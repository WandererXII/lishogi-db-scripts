db.analysis3.ensureIndex({
  done: 1,
});
db.analysis3.ensureIndex({
  date: -1,
});
db.analysis3.ensureIndex({
  uid: 1,
});
db.clas_clas.ensureIndex({ teachers: 1, viewedAt: -1 });
db.clas_student.ensureIndex({ clasId: 1, userId: 1 });
db.clas_student.ensureIndex(
  { userId: 1 },
  { partialFilterExpression: { managed: true } }
);
db.f_post.ensureIndex({ topicId: 1, troll: 1 });
db.f_post.ensureIndex({ topicId: 1, createdAt: 1, troll: 1 });
db.f_post.ensureIndex({ categId: 1, troll: 1 });
db.f_post.ensureIndex({ createdAt: -1, troll: 1 });
db.f_post.ensureIndex({ userId: 1 });

db.f_topic.ensureIndex({ categId: 1, troll: 1 });
db.f_topic.ensureIndex({ categId: 1, updatedAt: -1, troll: 1 });

db.relation.ensureIndex({ u1: 1 });
db.relation.ensureIndex({ u2: 1 });

db.timeline_entry.ensureIndex({ user: 1, date: -1 });
db.timeline_entry.ensureIndex({ type: 1, date: -1 });


db.game4.ensureIndex({ s: 1 });
db.game4.ensureIndex({ uids: 1 }, { sparse: 1 });
db.game4.ensureIndex({ wid: 1 }, { sparse: 1 });
db.game4.ensureIndex({ ca: -1 });
db.game4.ensureIndex({ uids: 1, ca: -1 });
db.game4.ensureIndex({ bm: 1 }, { sparse: 1 });

db.study.createIndex(
  { topics: 1, rank: -1 },
  { partialFilterExpression: { topics: { $exists: 1 } }, background: 1 }
);
db.study.createIndex(
  { topics: 1, createdAt: -1 },
  { partialFilterExpression: { topics: { $exists: 1 } }, background: 1 }
);
db.study.createIndex(
  { topics: 1, updatedAt: -1 },
  { partialFilterExpression: { topics: { $exists: 1 } }, background: 1 }
);
db.study.createIndex(
  { topics: 1, likes: -1 },
  { partialFilterExpression: { topics: { $exists: 1 } }, background: 1 }
);
db.study.createIndex(
  { uids: 1, rank: -1 },
  { partialFilterExpression: { topics: { $exists: 1 } }, background: 1 }
);

db.tournament2.ensureIndex({
  status: 1,
});
db.tournament2.ensureIndex({
  createdAt: 1,
});
db.tournament2.ensureIndex({
  startsAt: 1,
});
db.tournament_pairing.ensureIndex({
  tid: 1,
  d: -1,
});
db.tournament_pairing.ensureIndex({
  tid: 1,
  u: 1,
  d: -1,
});
db.tournament_player.ensureIndex({
  tid: 1,
  uid: 1,
});
db.tournament_player.ensureIndex({
  tid: 1,
  m: -1,
});

db.tournament2.ensureIndex(
  { forTeams: 1, startsAt: -1 },
  { partialFilterExpression: { forTeams: { $exists: 1 } } }
);

db.tournament_player.createIndex(
  { tid: 1, t: 1, m: -1 },
  { partialFilterExpression: { t: { $exists: true } } },
  { background: true }
);

db.report2.createIndex(
  { room: 1, score: -1 },
  { partialFilterExpression: { open: true }, name: "best_open" }
);
db.report2.createIndex(
  { "inquiry.mod": 1 },
  { partialFilterExpression: { "inquiry.mod": { $exists: true } } }
);
db.report2.createIndex({ user: 1 });
db.report2.createIndex({ "atoms.by": 1 });

db.swiss.ensureIndex({ teamId: 1, startsAt: -1 });

db.swiss_player.ensureIndex({ s: 1, u: 1 });
db.swiss_player.ensureIndex({ s: 1, n: 1 }, { unique: true });
db.swiss_player.ensureIndex({ s: 1, c: -1 });

db.swiss_pairing.ensureIndex({ s: 1, r: 1 });
db.swiss_pairing.ensureIndex({ s: 1, p: 1, r: 1 });
db.swiss_pairing.ensureIndex(
  { t: 1 },
  { partialFilterExpression: { t: true } }
);