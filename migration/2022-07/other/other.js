print("Removing from position variant in game5");
db.game5.updateMany({ variant: 3 }, { $unset: variant });

print("Dropping learn progress");
db.learn_progress.drop();

print("Dropping eval cache");
db.eval_cache.drop();

print("Updating fishnet client");
db.fishnet_client.updateMany({}, { $unset: ["instance", "evaluation"] });

print("Updating study_chapter setup fen -> sfen");
db.study_chapter.updateMany(
  {},
  { $rename: { "setup.fromFen": "setup.fromSfen" } }
);

print("Removing analysis info from study chapter");
db.study_chapter.updateMany(
  { serverEval: { $exists: true } },
  { $unset: { serverEval: true } }
);

print("Updating study_chapter setup variant");
db.study_chapter.updateMany(
  { "setup.variant": 3 },
  { $set: { "setup.variant": NumberInt(1) } }
);
db.study_chapter.updateMany(
  { "setup.variant": 1 },
  { $set: { "setup.variant": NumberInt(1) } }
);
db.study_chapter.updateMany(
  { "setup.variant": 2 },
  { $set: { "setup.variant": NumberInt(2) } }
);

print("Remove old pgn saved notation");
db.game5.updateMany(
  { "pgni.pgn": { $exists: true } },
  { $unset: { pgni: true } }
);

print("Update variant in seeks");
db.seek.updateMany({ variant: 3 }, { $set: { variant: NumberInt(1) } });
db.seek_archive.updateMany({ variant: 3 }, { $set: { variant: NumberInt(1) } });

print("fishnet_analysis: " + db.fishnet_analysis.find().count());
db.fishnet_analysis.drop();
db.fishnet_analysis.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 1209600, background: true }
);
