package oldShogi.format

final case class FEN(value: String) extends AnyVal {
  override def toString = value
}
