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

import DBWrap.BSONJodaDateTimeHandler
import org.joda.time.DateTime

object Main extends App {

  case class Encoded(value: (String, BSONBinary, Option[Int], Option[String], DateTime)) extends AnyVal {
    def id = value._1
    def binMoves = value._2
    def variantId = value._3
    def initialSfen = value._4
    def dateTime = value._5

    def update(bb: BSONBinary): Encoded =
      Encoded(value.copy(_2 = bb))
  }

    val fromStr = args.lift(0).getOrElse("2010-07-25")
    val concurrency = args.lift(1).fold(4)(java.lang.Integer.parseInt)
    val maxDocs = Int.MaxValue

    val from = new DateTime(fromStr).withTimeAtStartOfDay()

    println(s"Migrate since $from with concurrency $concurrency")

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
          "ca" -> BSONDocument("$gte" -> from),
          "pg" -> BSONDocument("$exists" -> true), // old PGN
          "um" -> BSONDocument("$exists" -> false) // no new usi moves
        )
        val projection = BSONDocument("pg" -> true, "v" -> true, "if" -> true, "ca" -> true)

        val gameSource = coll
          .find(query, Some(projection))
          .sort(BSONDocument("ca" -> 1))
          .cursor[BSONDocument](readPreference = ReadPreference.secondaryPreferred)
          .documentSource(maxDocs = maxDocs)

        def readDoc(doc: BSONDocument): Encoded = Encoded(
          (
            doc.getAsTry[String]("_id").get,
            doc.getAsTry[BSONBinary]("pg").get,
            doc.getAsOpt[Int]("v"),
            doc.getAsOpt[String]("if"),
            doc.getAsTry[DateTime]("ca").get
          )
        )

        val tickSource =
          Source.tick(Reporter.freq, Reporter.freq, None)

        def convert(g: Encoded): Future[Encoded] = Future {
          try {
            val pgnMoves = oldShogi.format.pgn.Binary.readMoves(g.binMoves.byteArray.toList).get
            val oldVariant = g.variantId.flatMap(oldShogi.variant.Variant.apply).getOrElse(oldShogi.variant.Standard)
            val newVariant = g.variantId.filterNot(_ == 3).flatMap(shogi.variant.Variant.apply).getOrElse(shogi.variant.Standard)
            val usisStr = oldShogi.format.UsiDump(pgnMoves, g.initialSfen, oldVariant).toOption.get
            val usis = shogi.format.usi.Usi.readList(usisStr).get

            val bb = shogi.format.usi.Binary.encodeMoves(usis, newVariant)

            // checking remove later
            val backUsis = shogi.format.usi.Binary.decodeMoves(bb.toList, newVariant)
            if (usis != backUsis) {
              println("Possible error: " + g.id)
              println(oldVariant.key + " -> " + newVariant.key)
              println(g.binMoves)
              println(pgnMoves)
              println(usisStr)
              println(usis)
              println(backUsis)
              println("\n\n")
            }
            // END
            
            g.update(BSONBinary(bb, Subtype.GenericBinarySubtype))
          }
          catch {
            case e: Throwable =>
              println(s"Error https://lishogi.org/${g.id} ${g.binMoves}")
              throw e
          }
        }

        def update(g: Encoded): Future[Unit] =
          coll.update.one(
            BSONDocument("_id" -> g.id),
            BSONDocument(
              "$set" -> BSONDocument("um" -> g.binMoves),
              "$unset" -> BSONDocument(
                "pg" -> true, // traslated to usi moves
                "ps" -> true, // can be deduced from usi moves
                "cl" -> true, // last element of usi moves
                "cc" -> true, // can be deduced from repetition and check
                "st" -> true, // can be deduced from initial sfen
              )
            )
          ).map(_ => ())

        gameSource
          .buffer(20000 min maxDocs, OverflowStrategy.backpressure)
          .map(d => Some(readDoc(d)))
          .merge(tickSource, eagerComplete = true)
          .via(Reporter)
          .mapAsyncUnordered(concurrency)(convert)
          .buffer(300 min maxDocs, OverflowStrategy.backpressure)
          .mapAsyncUnordered(concurrency * 2)(g => update(g))
          .runWith(Sink.ignore) andThen {
            case state =>
              close()
              system.terminate()
          }
    }
}
