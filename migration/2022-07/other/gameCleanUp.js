print("Total errors: " + db.game5.find({ um: { $exists: false } }).count());

db.game5.updateMany(
  { um: { $exists: false } },
  {
    $set: { um: BinData(0, "") },
    $unset: ["pg", "ps", "cl", "cc", "st"],
  }
);
