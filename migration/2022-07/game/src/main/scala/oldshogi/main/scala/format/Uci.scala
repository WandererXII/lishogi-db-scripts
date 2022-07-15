package oldShogi
package format

import cats.data.Validated
import cats.implicits._

sealed trait Usi {

  def chess: String
  def usi: String
  def piotr: String

  def origDest: (Pos, Pos)

  def apply(situation: Situation): Validated[String, MoveOrDrop]
}

object Usi {

  case class Move(
      orig: Pos,
      dest: Pos,
      promotion: Boolean = false
  ) extends Usi {

    def chessKeys = orig.chessKey + dest.chessKey
    def chess     = chessKeys + promotionString

    def usiKeys = orig.usiKey + dest.usiKey
    def usi     = usiKeys + promotionString

    def keysPiotr = orig.piotrStr + dest.piotrStr
    def piotr     = keysPiotr + promotionString

    def promotionString = if (promotion) "+" else ""

    def origDest = orig -> dest

    def apply(situation: Situation) = {
      situation.move(orig, dest, promotion) map Left.apply
    }
  }

  object Move {

    def apply(move: String): Option[Move] = {
      for {
        orig <- Pos.fromKey(move take 2)
        dest <- Pos.fromKey(move.slice(2, 4))
        promotion = if ((move lift 4) == Some('+')) true else false
      } yield Move(orig, dest, promotion)
    }

    def piotr(move: String) =
      for {
        orig <- move.headOption flatMap Pos.piotr
        dest <- move lift 1 flatMap Pos.piotr
        promotion = if ((move lift 2) == Some('+')) true else false
      } yield Move(orig, dest, promotion)

    def fromStrings(origS: String, destS: String, promS: Option[String]) = {
      for {
        orig <- Pos.fromKey(origS)
        dest <- Pos.fromKey(destS)
        promotion = if (promS.isDefined && promS != Some("=")) true else false
      } yield Move(orig, dest, promotion)
    }
  }

  case class Drop(role: Role, pos: Pos) extends Usi {

    def chess = s"${role.pgn}*${pos.chessKey}"

    def usi = s"${role.pgn}*${pos.usiKey}"

    def piotr = s"${role.pgn}*${pos.piotrStr}"

    def origDest = pos -> pos

    def apply(situation: Situation) = situation.drop(role, pos) map Right.apply
  }

  object Drop {

    def fromStrings(roleS: String, posS: String) =
      for {
        role <- Role.allByName get roleS
        pos  <- Pos.fromKey(posS)
      } yield Drop(role, pos)
  }

  case class WithSan(usi: Usi, san: String)

  def apply(move: oldShogi.Move) = Usi.Move(move.orig, move.dest, move.promotion)

  def apply(drop: oldShogi.Drop) = Usi.Drop(drop.piece.role, drop.pos)

  def apply(move: String): Option[Usi] =
    if (move lift 1 contains '*') for {
      role <- move.headOption flatMap Role.allByPgn.get
      pos  <- Pos.fromKey(move.slice(2, 4))
    } yield Usi.Drop(role, pos)
    else Usi.Move(move)

  def piotr(move: String): Option[Usi] =
    if (move lift 1 contains '*') for {
      role <- move.headOption flatMap Role.allByPgn.get
      pos  <- move lift 2 flatMap Pos.piotr
    } yield Usi.Drop(role, pos)
    else Usi.Move.piotr(move)

  def readList(moves: String): Option[List[Usi]] =
    moves.split(' ').toList.map(apply).sequence

  def writeList(moves: List[Usi]): String =
    moves.map(_.usi) mkString " "

  def readListPiotr(moves: String): Option[List[Usi]] =
    moves.split(' ').toList.map(piotr).sequence

  def writeListPiotr(moves: List[Usi]): String =
    moves.map(_.piotr) mkString " "
}
