db.puzzle2_puzzle
  .find({
    $and: [{ gameId: { $exists: true } }, { users: { $exists: false } }],
  })
  .forEach((p) => {
    const game = db.game5.findOne({ _id: p.gameId });
    const newUsers = game && game.us;
    if (!newUsers) return;
    db.puzzle2_puzzle.update({ _id: p._id }, { $set: { users: newUsers } });
  });
