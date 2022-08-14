package lishogi

import akka.stream._
import akka.stream.scaladsl._
import akka.stream.stage._
import scala.concurrent.duration._

import org.joda.time.DateTime
import org.joda.time.format._

object Reporter extends GraphStage[FlowShape[Option[Main.AnWrap], Main.AnWrap]] {

  val freq = 2.seconds

  val in = Inlet[Option[Main.AnWrap]]("reporter.in")
  val out = Outlet[Main.AnWrap]("reporter.out")
  override val shape = FlowShape.of(in, out)

  override def createLogic(inheritedAttributes: Attributes): GraphStageLogic = new GraphStageLogic(shape) {

    private val formatter = DateTimeFormat forStyle "MS"

    private var counter = 0
    private var prev = 0
    private var date: Option[DateTime] = None
    private var gameId: String = ""

    setHandler(in, new InHandler {
      override def onPush() = {
        grab(in) match {
          case Some(a) => {
            counter += 1
            date = None
            gameId = a.id
            push(out, a)
          }
          case None => {
            val gps = (counter - prev) / freq.toSeconds
            println(s"${date.fold("-")(formatter.print)} https://lishogi.org/$gameId $counter $gps/s")
            prev = counter
            pull(in)
          }
        }
      }

      setHandler(out, new OutHandler {
        override def onPull() = {
          pull(in)
        }
      })

    })

  }
}
