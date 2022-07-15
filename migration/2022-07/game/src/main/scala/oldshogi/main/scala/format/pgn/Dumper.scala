package oldShogi
package format.pgn

object Dumper {

  def apply(situation: Situation, data: oldShogi.Move): String = {
    import data._

    ((promotion, piece.role) match {
      case (promotion, role) => {
        // Check whether there is a need to disambiguate:
        //   - can a piece of same role move to/capture on the same square?
        //   - if so, disambiguate, in order or preference, by:
        //       - file and rank - the oldShogi way
        val candidates = situation.board.pieces collect {
          case (cpos, cpiece) if cpiece == piece && cpos != orig && cpiece.eyes(cpos, dest) => cpos
        } filter { cpos =>
          situation.move(cpos, dest, promotion).isValid ||
          (promotion && situation.move(cpos, dest, false).isValid)
        }

        val disambiguation = if (candidates.isEmpty) {
          ""
        } else {
          orig.chessKey
        }
        val promotes = {
          if (!promotion && situation.board.variant.canPromote(data))
            "="
          else if (promotion) "+"
          else ""
        }
        s"${role.pgn}$disambiguation${if (captures) "x" else ""}${dest.chessKey}$promotes"
      }
    })
  }

  def apply(data: oldShogi.Drop): String = {
    data.toUsi.chess
  }

  def apply(data: oldShogi.Move): String =
    apply(
      data.situationBefore,
      data
    )
}
