package lishogi

case class Info(
    ply: Int,
    eval: Eval,
    variation: List[String] = Nil
) {

  def cp   = eval.cp
  def mate = eval.mate
  def best = eval.best

  def turn = 1 + (ply - 1) / 2

  def color = oldShogi.Color.fromPly(ply - 1)

  def encode: String =
    List(
      best.fold("")(_.usi),
      variation take Info.LineMaxPlies mkString " ",
      mate.fold("")(_.value.toString),
      cp.fold("")(_.value.toString)
    ).dropWhile(_.isEmpty).reverse mkString Info.separatorNew

  def hasVariation  = variation.nonEmpty
  def dropVariation = copy(variation = Nil, eval = eval.dropBest)

  def invert = copy(eval = eval.invert)

  def cpComment: Option[String] = cp map (_.showPawns)
  def mateComment: Option[String] =
    mate map { m =>
      s"Mate in ${math.abs(m.value)}"
    }
  def evalComment: Option[String] = cpComment orElse mateComment

  def isEmpty = cp.isEmpty && mate.isEmpty

  def forceCentipawns: Option[Int] =
    mate match {
      case None                  => cp.map(_.centipawns)
      case Some(m) if m.negative => Some(Int.MinValue - m.value)
      case Some(m)               => Some(Int.MaxValue - m.value)
    }

  override def toString =
    s"Info $color [$ply] ${cp.fold("?")(_.showPawns)} ${mate.fold(0)(_.value)} $best $variation;"
}

object Info {
  import Eval.{ Cp, Mate }


  val LineMaxPlies = 10
  val separatorOld  = "@"
  val separatorNew  = ","
  val listSeparator = ";"

  def encodeList(infos: List[Info]): String = infos map (_.encode) mkString listSeparator

  private def strCp(s: String)   = s.toIntOption map Cp.apply
  private def strMate(s: String) = s.toIntOption map Mate.apply

}

case class Eval(
    cp: Option[Eval.Cp],
    mate: Option[Eval.Mate],
    best: Option[oldShogi.format.Usi]
) {

  def isEmpty = cp.isEmpty && mate.isEmpty

  def dropBest = copy(best = None)

  def invert = copy(cp = cp.map(_.invert), mate = mate.map(_.invert))

  def score: Option[Eval.Score] = cp.map(Eval.Score.cp) orElse mate.map(Eval.Score.mate)
}

object Eval {

  case class Score(value: Either[Cp, Mate]) extends AnyVal {

    def cp: Option[Cp]     = value.left.toOption
    def mate: Option[Mate] = value.toOption

    def isCheckmate = value == Score.checkmate
    def mateFound   = value.isRight

    def invert                  = copy(value = value.left.map(_.invert).map(_.invert))
    def invertIf(cond: Boolean) = if (cond) invert else this

    def eval = Eval(cp, mate, None)
  }

  object Score {

    def cp(x: Cp): Score     = Score(Left(x))
    def mate(y: Mate): Score = Score(Right(y))

    val checkmate: Either[Cp, Mate] = Right(Mate(0))
  }

  case class Cp(value: Int) extends AnyVal with Ordered[Cp] {

    def centipawns = value

    def pawns: Float      = value / 100f
    def showPawns: String = "%.2f" format pawns

    def ceiled =
      if (value > Cp.CEILING) Cp(Cp.CEILING)
      else if (value < -Cp.CEILING) Cp(-Cp.CEILING)
      else this

    def invert                  = Cp(value = -value)
    def invertIf(cond: Boolean) = if (cond) invert else this

    def compare(other: Cp) = Integer.compare(value, other.value)

    def signum: Int = Math.signum(value.toFloat).toInt
  }

  object Cp {

    val CEILING = 5500

    val initial = Cp(50)
  }

  case class Mate(value: Int) extends AnyVal with Ordered[Mate] {

    def moves = value

    def invert                  = Mate(value = -value)
    def invertIf(cond: Boolean) = if (cond) invert else this

    def compare(other: Mate) = Integer.compare(value, other.value)

    def signum: Int = Math.signum(value.toFloat).toInt

    def positive = value > 0
    def negative = value < 0
  }

  val initial = Eval(Some(Cp.initial), None, None)

  val empty = Eval(None, None, None)

}
