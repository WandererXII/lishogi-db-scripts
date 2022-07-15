// Util functions

function whiteBlack(c) {
  if (c === "black") return "gote";
  if (c === "white") return "sente";
  return "";
}

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

// old color is expected
function turnNumberToPlies(turn, color) {
  const turnNumber = parseInt(turn);
  if (turnNumber) {
    const ply = color === "w" ? turnNumber * 2 - 1 : turnNumber * 2;
    return ply.toString();
  } else return turn;
}

function fixPocket(pocket) {
  let newPocket = "";
  const droppableRoles = ["r", "b", "g", "s", "n", "l", "p"];
  // sente
  for (r of droppableRoles) {
    r = r.toUpperCase();
    const re = new RegExp(r, "g");
    const num = (pocket.match(re) || []).length;
    if (num === 1) newPocket += r;
    else if (num > 1) newPocket += num.toString() + r;
  }
  // gote
  for (r of droppableRoles) {
    const re = new RegExp(r, "g");
    const num = (pocket.match(re) || []).length;
    if (num === 1) newPocket += r;
    else if (num > 1) newPocket += num.toString() + r;
  }
  if (newPocket === "") return "-";
  return newPocket;
}

function repairFen(fen, skipTurn = false) {
  var splitted = fen.split(" ");
  var newFen = "";

  const board = splitted.shift();
  newFen += fixBoard(board);

  const color = splitted.shift();
  if (color) newFen += " " + switchColor(color);
  else return newFen;

  const pocket = splitted.shift();
  if (pocket) newFen += " " + fixPocket(pocket);
  else return newFen;

  const moveNumber = splitted.shift();
  if (skipTurn) newFen += " " + moveNumber;
  else if (moveNumber) newFen += " " + turnNumberToPlies(moveNumber, color);
  return newFen;
}

function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

print("Games");
db.game5.find({ _id: "lrZSdiny" }).forEach((g) => {
  const oldFen = g.if;
  if (oldFen) update(db.game5, { _id: g._id }, "if", repairFen(oldFen));
});

print("Done!");
