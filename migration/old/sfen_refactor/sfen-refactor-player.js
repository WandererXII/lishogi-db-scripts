// Util functions

function whiteBlack(c) {
  if (c === "black" || c === "gote") return "gote";
  if (c === "white" || c === "sente") return "sente";
  return "";
}

function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

print("Player assessment");

db.player_assessment.updateMany({}, { $rename: { white: "sente" } });

db.player_assessment.find().forEach(function (doc) {
  const oldId = doc._id;
  const splitted = oldId.split("/");
  if (splitted.length > 1) {
    doc._id = splitted[0] + "/" + whiteBlack(splitted[1]);
    db.player_assessment_new.insert(doc);
  }
});
db.player_assessment_new.renameCollection("player_assessment", true);

print("Done!");
