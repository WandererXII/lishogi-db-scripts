coll = db.puzzle2_puzzle;

function setFields(id, key, value) {
  var update = { $set: {} };
  update.$set[key] = value;

  coll.update({ _id: id }, update);
}

function squareUciToUsi(sq) {
  const file = 8 - (sq.charCodeAt(0) - "a".charCodeAt(0)),
    rank = 8 - (sq.charCodeAt(1) - "1".charCodeAt(0));
  const files = ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    ranks = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
  return files[file] + ranks[rank];
}
function assureUsi(str) {
  // UCI drop
  if (str.match(/^([RBGSNLP]\*)[a-i][1-9]$/)) {
    return str.substring(0, 2) + squareUciToUsi(str.substring(2, 4));
  }
  // UCI move
  else if (str.match(/^([a-i][1-9][a-i][1-9])(\+|\=)?$/)) {
    const prom = str.length === 5 ? "+" : "";
    return (
      squareUciToUsi(str.substring(0, 2)) +
      squareUciToUsi(str.substring(2, 4)) +
      prom
    );
  }
  return str;
}
function updateMoveLine(line) {
  const split = line.split(' ');
  return split.map(assureUsi).join(' ');
}

coll.find({}).forEach((p) => {
  const newMoveLine = updateMoveLine(p.line);
  setFields(p._id, 'line', newMoveLine)
});