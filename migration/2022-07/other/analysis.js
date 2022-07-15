
print("Analysis3")

db.game5.aggregate([
  { $match: { an: true } },
  {
    $lookup: {
      from: "analysis2",
      localField: "_id",
      foreignField: "_id",
      as: "anData",
    },
  },
  { $unwind: { path: "$anData" } },
  {
    $project: {
      _id: 1,
      studyId: "$anData.studyId",
      data: "$anData.data",
      ply: "$anData.ply",
      uid: "$anData.uid",
      by: "$anData.by",
      date: "$anData.date",
      pg: 1,
      if: 1,
      v: 1,
    },
  },
  {
    $out: "analysis3",
  },
],{
  allowDiskUse: true,
});

print("Removing flipped analysis")

const toRemove = [];
db.analysis3.find({if: { $exists: true }}).forEach((a) => {
  const sfenColor = a.if.split(" ")[1];
  const plyColor = (a.ply || 0) % 2 === 0 ? 'b' : 'w';
  if (sfenColor !== plyColor) {
    toRemove.push(a._id);
  }
});

print(toRemove)
db.analysis3.deleteMany({ _id: { $in: toRemove } });
db.game5.updateMany({ _id: { $in: toRemove } }, { $unset: { an: true } });

print("Done!")