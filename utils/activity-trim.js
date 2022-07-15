ids_to_remove = [];

db.activity.find().forEach((a) => {
  days = a._id.split(":")[1];
  if (days < 500) ids_to_remove.push(a._id);
});

print("Before: ", db.activity.find().count());
db.activity.deleteMany({ _id: { $in: ids_to_remove } });
print("After: ", db.activity.find().count());

print("Before timeline: ", db.timeline_entry.count());
db.timeline_entry.deleteMany({ date: { $lte: new Date(2022, 1, 31) } });
print("After timeline: ", db.timeline_entry.count());
