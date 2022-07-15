function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

print("Coordinates");
db.coordinate_score.updateMany({}, { $rename: { black: "gote" } });
db.coordinate_score.updateMany({}, { $rename: { white: "sente" } });

print("Learn");
db.learn_progress.updateMany(
  {},
  { $rename: { "stages.intoduction": "stages.introduction" } }
);

print("Activity");
db.activity.updateMany(
  { "l.intoduction": { $exists: 1 } },
  { $rename: { "l.intoduction": "l.introduction" } }
);

print("Dropping eval cache");
db.eval_cache.drop();

print("Dropping cache");
db.cache.renameCollection("cacheOLD25");
db.cache.createIndex({ e: 1 }, { expireAfterSeconds: 0 });

print("Done!");
