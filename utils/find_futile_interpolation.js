puz_to_delete = [];

db.puzzle2_puzzle.find({ themes: { $eq: "tsume" } }).forEach((p) => {
  const moves = p.line.split(" ");
  let opponents_moves = [];
  let my_moves = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2) opponents_moves.push(moves[i]);
    else my_moves.push(moves[i]);
  }
  for (let i = 0; i < opponents_moves.length; i++) {
    if (
      opponents_moves[i].includes("*") &&
      opponents_moves[i].slice(2, 4) == my_moves[i + 1].slice(2, 4)
    ) {
      puz_to_delete.push('"' + p._id + '"');
      break;
    }
  }
});

print("// We will delete", puz_to_delete.length);
print("puzs_to_delete = [" + puz_to_delete.join() + "]");
print("db.puzzle2_puzzle.deleteMany({ _id: { $in: puzs_to_delete }});");
