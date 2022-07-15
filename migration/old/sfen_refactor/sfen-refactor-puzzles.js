// Util functions

function switchColor(c) {
  if (c === "b") return "w";
  if (c === "w") return "b";
  return c;
}

function fixBoard(board) {
  return board
    .replace(/t/g, "+p")
    .replace(/u/g, "+l")
    .replace(/a/g, "+s")
    .replace(/m/g, "+n")
    .replace(/d/g, "+r")
    .replace(/h/g, "+b")
    .replace(/T/g, "+P")
    .replace(/U/g, "+L")
    .replace(/A/g, "+S")
    .replace(/M/g, "+N")
    .replace(/D/g, "+R")
    .replace(/H/g, "+B");
}

function repairFen(fen) {
  var splitted = fen.split(" ");
  var newFen = "";

  const board = splitted.shift();
  newFen += fixBoard(board);

  const color = splitted.shift();
  if (color) newFen += " " + switchColor(color);
  else return newFen;

  const pocket = splitted.shift();
  newFen += " " + pocket;

  const moveNumber = splitted.shift();
  newFen += " " + moveNumber;
  return newFen;
}

function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

// Puzzle update
print("Puzzles");

db.puzzle2_puzzle.find().forEach((p) => {
  update(db.puzzle2_puzzle, { _id: p._id }, "fen", repairFen(p.fen));
});

print("Done!");
