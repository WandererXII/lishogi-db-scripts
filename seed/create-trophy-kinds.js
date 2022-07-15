db.trophyKind.drop();

db.trophyKind.insert({
  _id: "developer",
  name: "Lishogi developer",
  icon: "\ue000",
  url: "https://github.com/WandererXII/lishogi",
  klass: "icon3d",
  order: NumberInt(100),
  withCustomImage: false,
});
db.trophyKind.insert({
  _id: "moderator",
  name: "Lishogi moderator",
  icon: "\ue002",
  url: "//lishogi.org/report",
  klass: "icon3d",
  order: NumberInt(101),
  withCustomImage: false,
});
db.trophyKind.insert({
  _id: "verified",
  name: "Verified account",
  icon: "E",
  klass: "icon3d",
  order: NumberInt(102),
  withCustomImage: false,
});

db.trophyKind.insert({
  _id: "bougyokuPractioner",
  name: "Bougyoku tournament - 2nd place",
  url: "//lishogi.org/blog/YGCXnRAAACMAJB0W/announcing-the-bougyoku-tournament",
  icon: "~",
  klass: "icon3d",
  order: NumberInt(1),
  withCustomImage: false,
});

db.trophyKind.insert({
  _id: "bougyoku",
  name: "Bougyoku tournament - Winner",
  url: "//lishogi.org/blog/YGCXnRAAACMAJB0W/announcing-the-bougyoku-tournament",
  icon: "~",
  klass: "fire-trophy",
  order: NumberInt(1),
  withCustomImage: false,
});

db.trophy.insert({
  _id: "bougyoku/uenopanda",
  user: "uenopanda",
  kind: "bougyoku",
  date: new Date(),
});

db.trophy.insert({
  _id: "bougyoku/uenopanda",
  user: "uenopanda",
  kind: "bougyoku",
  date: new Date(),
});

db.trophyKind.insert({
  _id: "bougyoku",
  name: "Bougyoku tournament - Winner",
  url: "//lishogi.org/blog/YGCXnRAAACMAJB0W/announcing-the-bougyoku-tournament",
  icon: "~",
  klass: "fire-trophy",
  order: NumberInt(1),
  withCustomImage: false,
});
