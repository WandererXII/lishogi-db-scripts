coll = db.forecast;

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

function fixSfen(sfen, ply) {
  var parts = sfen.split(" ");
  parts[3] = (ply + 1).toString();
  return parts.join(" ");
}

function setFields(id, key, value) {
  var update = { $set: {} };
  update.$set[key] = value;

  coll.update({ _id: id }, update);
}

coll.find({}).forEach((f) => {
  const cur_id = f._id;
  var newSteps = [];
  for (let i in f.steps) {
    const cur_step = f.steps[i];
    for (let j in cur_step) {
      f.steps[i][j].usi = assureUsi(f.steps[i][j].uci || f.steps[i][j].usi);
      f.steps[i][j].sfen = fixSfen(f.steps[i][j].fen || f.steps[i][j].sfen, f.steps[i][j].ply); // todo

      delete f.steps[i][j].san;
      delete f.steps[i][j].uci;
      delete f.steps[i][j].fen;
    }
    newSteps.push(f.steps[i]);
  }
  setFields(cur_id, "steps", newSteps);
});

print("Done!");