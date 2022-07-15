package lishogi

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

import com.typesafe.config.ConfigFactory

import reactivemongo.api._
import reactivemongo.api.bson._
import reactivemongo.api.bson.collection.BSONCollection
import reactivemongo.api.bson.exceptions.TypeDoesNotMatchException

import scala.util.{ Failure, Success, Try }


import org.joda.time._

object DBWrap {

  private val config = ConfigFactory.load()
  private val dbUri = config.getString("db.uri")

  val dbName = "lishogi"
  val collName = "game5"

  val driver = new AsyncDriver()
  lazy val parsedURIFuture = MongoConnection.fromString(dbUri)
  lazy val connection: Future[MongoConnection] = parsedURIFuture.flatMap(u => driver.connect(u))

  def get: Future[(BSONCollection, () => Unit)] =
    connection flatMap { conn =>
      conn.database(dbName).map { db =>
        (
          db collection collName,
          (() => {
            driver.close()
          })
        )
      }
    }

  def quickHandler[T](read: PartialFunction[BSONValue, T], write: T => BSONValue): BSONHandler[T] =
    new BSONHandler[T] {
      def readTry(bson: BSONValue) =
        read
          .andThen(Success(_))
          .applyOrElse(
            bson,
            (b: BSONValue) => handlerBadType(b)
          )
      def writeTry(t: T) = Success(write(t))
    }

  def handlerBadType[T](b: BSONValue): Try[T] =
    Failure(TypeDoesNotMatchException("BSONValue", b.getClass.getSimpleName))


  implicit val BSONJodaDateTimeHandler = quickHandler[DateTime](
    { case v: BSONDateTime => new DateTime(v.value) },
    v => BSONDateTime(v.getMillis)
  )
}
