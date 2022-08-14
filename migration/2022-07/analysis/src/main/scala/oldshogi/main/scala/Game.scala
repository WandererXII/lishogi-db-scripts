package oldShogi

import cats.data.Validated
import format.{ pgn, Usi }

case class Game(
    situation: Situation,
    pgnMoves: Vector[String] = Vector(),
    clock: Option[Clock] = None,
    turns: Int = 0,         // plies
    startedAtTurn: Int = 0, // plies
    startedAtMove: Int = 1
) {
  def apply(
      orig: Pos,
      dest: Pos,
      promotion: Boolean = false,
      metrics: MoveMetrics = MoveMetrics()
  ): Validated[String, (Game, Move)] = {
    situation.move(orig, dest, promotion).map(_ withMetrics metrics) map { move =>
      apply(move) -> move
    }
  }

  def apply(move: Move): Game = {
    val newSituation = move situationAfter

    copy(
      situation = newSituation,
      turns = turns + 1,
      pgnMoves = pgnMoves :+ pgn.Dumper(situation, move),
      clock = applyClock(move.metrics, newSituation.status.isEmpty)
    )
  }

  def drop(
      role: Role,
      pos: Pos,
      metrics: MoveMetrics = MoveMetrics()
  ): Validated[String, (Game, Drop)] =
    situation.drop(role, pos).map(_ withMetrics metrics) map { drop =>
      applyDrop(drop) -> drop
    }

  def applyDrop(drop: Drop): Game = {
    val newSituation = drop situationAfter

    copy(
      situation = newSituation,
      turns = turns + 1,
      pgnMoves = pgnMoves :+ pgn.Dumper(drop),
      clock = applyClock(drop.metrics, newSituation.status.isEmpty)
    )
  }

  private def applyClock(metrics: MoveMetrics, gameActive: Boolean) =
    clock.map { c =>
      {
        val newC = c.step(metrics, gameActive)
        if (turns - startedAtTurn == 1) newC.start else newC
      }
    }

  def apply(usi: Usi.Move): Validated[String, (Game, Move)] = apply(usi.orig, usi.dest, usi.promotion)
  def apply(usi: Usi.Drop): Validated[String, (Game, Drop)] = drop(usi.role, usi.pos)
  def apply(usi: Usi): Validated[String, (Game, MoveOrDrop)] = {
    usi match {
      case u: Usi.Move => apply(u) map { case (g, m) => g -> Left(m) }
      case u: Usi.Drop => apply(u) map { case (g, d) => g -> Right(d) }
    }
  }

  def player = situation.color

  def board = situation.board

  def isStandardInit = board.pieces == oldShogi.variant.Standard.pieces

  // Fullmove number: The number of the full move.
  // It starts at 1, and is incremented after Gote's move.
  def fullMoveNumber: Int = 1 + turns / 2

  def playedPlies: Int = turns - startedAtTurn

  def moveNumber: Int = startedAtMove + playedPlies

  def withBoard(b: Board) = copy(situation = situation.copy(board = b))

  def updateBoard(f: Board => Board) = withBoard(f(board))

  def withPlayer(c: Color) = copy(situation = situation.copy(color = c))

  def withTurns(t: Int) = copy(turns = t)
}

object Game {
  def apply(variant: oldShogi.variant.Variant): Game =
    new Game(
      Situation(Board init variant, Sente)
    )

  def apply(board: Board): Game = apply(board, Sente)

  def apply(board: Board, color: Color): Game = new Game(Situation(board, color))

  def apply(variantOption: Option[oldShogi.variant.Variant], fen: Option[String]): Game = {
    val variant = variantOption | oldShogi.variant.Standard
    val g       = apply(variant)
    fen
      .flatMap {
        format.Forsyth.<<<@(variant, _)
      }
      .fold(g) { parsed =>
        g.copy(
          situation = Situation(
            board = parsed.situation.board withVariant g.board.variant withHandData {
              parsed.situation.board.handData orElse g.board.handData
            },
            color = parsed.situation.color
          ),
          turns = parsed.turns,
          startedAtTurn = parsed.turns,
          startedAtMove = parsed.moveNumber
        )
      }
  }
}
