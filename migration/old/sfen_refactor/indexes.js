print("puzzle2_round: " + db.puzzle2_round.find().count());
db.puzzle2_round.createIndex({ "d": 1 }, { expireAfterSeconds: 7889238, background: true});
sleep(1000);

print("player_assessment: " + db.player_assessment.find().count());
db.player_assessment.createIndex({ "date": 1 }, { expireAfterSeconds: 7889238, background: true});
sleep(1000);

print("fishnet_analysis: " + db.fishnet_analysis.find().count());
db.fishnet_analysis.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 1209600, background: true});
sleep(1000);

print("Removing hand info from games");
db.game5.updateMany({chd: {$exists: 1}}, {$unset: {"chd": 1}});

print("DONE!")