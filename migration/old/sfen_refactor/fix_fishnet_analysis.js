// Util functions

function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

print("Fishnet analysis");
db.fishnet_analysis
  .find({ "game.initialFen": { $exists: true } })
  .forEach((f) => {
    const fen = f.game.initialFen;
    const startPly = f.startPly;
    if (fen.includes(" w ") && startPly == 0) {
      print("Updating, ", f._id);
      update(db.fishnet_analysis, { _id: f._id }, "startPly", 1);
    }
  });

print("Done!");
db.fishnet_analysis.updateMany({}, { $unset: { lastTryByKey: "" } });
db.fishnet_analysis.updateMany({}, { $set: { tries: 0 } });
