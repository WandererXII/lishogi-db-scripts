function update(coll, srch, key, updatedSfen) {
  var update = { $set: {} };
  update.$set[key] = updatedSfen;
  coll.update(srch, update);
}

function repairFen(fen) {
    var splitted = fen.split(" ");
  
    const board = splitted.shift();
    if (!board) return fen;
  
    const color = splitted.shift();
    if (!color) return fen;
  
    const pocket = splitted.shift();
    if (!pocket) return fen;
  
    const moveNumber = splitted.shift();
    if (!moveNumber || moveNumber !== '2' || color !== 'w') return fen;
    return board + ' ' + color + ' ' + pocket + ' 1';
  }

db.simul.find({ position: { $exists: true } }).forEach((s) => {
    const oldFen = s.position;
    if (oldFen) update(db.simul, { _id: s._id }, "position", repairFen(oldFen));
  });

db.simul.createIndex({ hostId: 1 }, { partialFilterExpression: { status: 10 } });
db.simul.createIndex({ hostSeenAt: -1 }, { partialFilterExpression: { status: 10, featurable: true } });