db.puzzle2_round
  .aggregate(
    [
      {
        $match: {
          v: {
            $exists: 1,
          },
        },
      },
      {
        $group: {
          _id: {
            $arrayElemAt: [
              {
                $split: ["$_id", ":"],
              },
              1,
            ],
          },
          vu: {
            $sum: {
              $cond: [
                {
                  $gt: ["$v", 0],
                },
                "$v",
                0,
              ],
            },
          },
          vd: {
            $sum: {
              $cond: [
                {
                  $lt: ["$v", 0],
                },
                {
                  $subtract: [0, "$v"],
                },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          vu: 1,
          vd: 1,
          v: {
            $divide: [
              {
                $subtract: ["$vu", "$vd"],
              },
              {
                $add: ["$vu", "$vd"],
              },
            ],
          },
        },
      },
    ],
    {
      allowDiskUse: true,
    }
  )
  .forEach((r) => {
    db.puzzle2_puzzle.update(
      { _id: r._id },
      {
        $set: {
          vote: r.v,
          vd: NumberInt(r.vd),
          vu: NumberInt(r.vu),
        },
      }
    );
  });
