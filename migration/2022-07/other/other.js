
// games
db.game5.updateMany({variant: 3}, { $unset: variant });

// learn
db.learn_progress.drop();