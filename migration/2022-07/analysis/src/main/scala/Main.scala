package lishogi

import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import reactivemongo.api._
import reactivemongo.api.bson._

import akka.actor.ActorSystem
import akka.stream._
import akka.stream.scaladsl._
import reactivemongo.akkastream.{ State, cursorProducer }

import Eval.{ Cp, Mate }

import DBWrap.BSONJodaDateTimeHandler
import org.joda.time.DateTime

object Main extends App {

  case class AnWrap(value: (String, String, BSONBinary, Option[Int], Option[String], Option[Int])) extends AnyVal {
    def id = value._1
    def anData = value._2
    def binMoves = value._3
    def variantId = value._4
    def initialSfen = value._5
    def initPly     = if (initialSfen.exists(_.contains(" w "))) 1 else 0

    def update(ad: String): AnWrap =
      AnWrap(value.copy(_2 = ad))
  }

    val concurrency = 4
    val maxDocs = Int.MaxValue

    println(s"Migrate with concurrency $concurrency")

    implicit val system = ActorSystem()
    val decider: Supervision.Decider = {
      case e: Exception =>
        println(e)
        Supervision.Resume
      case _ => Supervision.Stop
    }
    implicit val materializer = ActorMaterializer(
      ActorMaterializerSettings(system)
        .withInputBuffer(
          initialSize = 32,
          maxSize = 32
        ).withSupervisionStrategy(decider)
    )

    DBWrap.get foreach {
      case (coll, close) =>

        val query = BSONDocument(
          "pg" -> BSONDocument("$exists" -> true), // will be deleted if done
        )
        val projection = BSONDocument("data" -> true, "ply" -> 1, "pg" -> true, "v" -> true, "if" -> true)

        val anSource = coll
          .find(query, Some(projection))
          .sort(BSONDocument("date" -> 1))
          .cursor[BSONDocument](readPreference = ReadPreference.secondaryPreferred)
          .documentSource(maxDocs = maxDocs)

        def readDoc(doc: BSONDocument): AnWrap = AnWrap(
          (
            doc.getAsTry[String]("_id").get,
            doc.getAsTry[String]("data").get,
            doc.getAsTry[BSONBinary]("pg").get,
            doc.getAsOpt[Int]("v"),
            doc.getAsOpt[String]("if"),
            doc.getAsOpt[Int]("ply"),
          )
        )

        val tickSource =
          Source.tick(Reporter.freq, Reporter.freq, None)

          def strCp(s: String)   = s.toIntOption map Cp.apply
          def strMate(s: String) = s.toIntOption map Mate.apply

          def decode(ply: Int, str: String): Info =
            str.split(Info.separatorOld) match {
              case Array(cp)         => Info(ply, Eval(strCp(cp), None, None))
              case Array(cp, ma)     => Info(ply, Eval(strCp(cp), strMate(ma), None))
              case Array(cp, ma, va) => Info(ply, Eval(strCp(cp), strMate(ma), None), va.split(' ').toList)
              case Array(cp, ma, va, be) =>
                Info(ply, Eval(strCp(cp), strMate(ma), oldShogi.format.Usi piotr be), va.split(' ').toList)
              case _                 => Info(ply, Eval.empty)
            }
          def decodeList(str: String, fromPly: Int): List[Info] =
            str.split(Info.listSeparator).toList.zipWithIndex map { case (infoStr, index) =>
              decode(index + 1 + fromPly, infoStr)
            }

        def convert(a: AnWrap): Future[AnWrap] = Future {
          try {
            val pgnMoves = oldShogi.format.pgn.Binary.readMoves(a.binMoves.byteArray.toList).get
            val oldVariant = a.variantId.flatMap(oldShogi.variant.Variant.apply).getOrElse(oldShogi.variant.Standard)
            val gamesWithInit = oldShogi.Replay.gameMoveWhileValid(pgnMoves, a.initialSfen.getOrElse(oldShogi.format.Forsyth.initial), oldVariant)
            val games = gamesWithInit._1 :: gamesWithInit._2.map(g => g._1)
            val infos = decodeList(a.anData, a.initPly)
            val newInfos = infos.map(i =>
              if (i.variation.nonEmpty) {
                val game = games.lift(i.ply - 1 - a.initPly)
                val usis: Option[List[String]] = game.flatMap { g =>
                  val sfen = oldShogi.format.Forsyth >> g
                  oldShogi.format.UsiDump(i.variation, Some(sfen), oldVariant).toOption
                }
                i.copy(variation = usis.fold(List[String]())(_.take(Info.LineMaxPlies)))
              }
              else i
            )
            a.update(Info.encodeList(newInfos))
          }
          catch {
            case e: Throwable =>
              println(s"Error ${a.anData}")
              throw e
          }
        }

        def update(a: AnWrap): Future[Unit] =
          coll.update.one(
            BSONDocument("_id" -> a.id),
            BSONDocument(
              "$set" -> BSONDocument("data" -> a.anData),
              "$unset" -> BSONDocument(
                "pg" -> true,
                "v"  -> true,
                "if" -> true,
              )
            )
          ).map(_ => ())

        anSource
          .buffer(20000 min maxDocs, OverflowStrategy.backpressure)
          .map(d => Some(readDoc(d)))
          .merge(tickSource, eagerComplete = true)
          .via(Reporter)
          .mapAsyncUnordered(concurrency)(a => convert(a))
          .buffer(300 min maxDocs, OverflowStrategy.backpressure)
          .mapAsyncUnordered(concurrency * 2)(g => update(g))
          .runWith(Sink.ignore) andThen {
            case state =>
              close()
              system.terminate()
          }
    }
}
