// Util functions

function fixTime(old) {
  if(old.includes('秒')) return old.replace(/\|/g, '+');
  const s = old.split(/\+|\|/);
  const lim = s[0];
  if(!lim) return old;
  const byoPer = s[2];
  if(!byoPer) {
    return lim;
  }
  const s2 = byoPer.split('(');
  const byo = s2[0];

  const byoStr = byo ? ('+' + byo + '秒') : '';
  return lim + '秒' + byoStr
}

function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

print("Study chapter - tags");

db.study_chapter_flat
  .find({ tags: { $exists: 1, $not: { $size: 0 } } })
  .forEach((c) => {
    const cur_id = c._id;
    const new_tags = [];
    const tt = c.tags.some(t => t.startsWith("Event"));
    for (let i in c.tags) {
      const tag = c.tags[i];
      if (tt && tag.startsWith("TimeControl")) new_tags.push(tag.split(':')[0] + ':' + fixTime(tag.split(':')[1]));
      else if (tt && tag.startsWith("Date")) new_tags.push("Start:" + tag.split(':')[1]);
      else new_tags.push(tag);
    }
    update(db.study_chapter_flat, { _id: cur_id }, "tags", new_tags);
  });

//db.game5.find({"chd": {$exists: 1}}).count()

print("Done!");
