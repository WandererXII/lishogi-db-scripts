//mongo --eval "var parallelism=4,instance=1;"" "mongodb://127.0.0.1:27017/lishogi" study-all2.js
//mongo --eval "var parallelism=4,instance=2;"" "mongodb://127.0.0.1:27017/lishogi" study-all2.js
//mongo --eval "var parallelism=4,instance=3;"" "mongodb://127.0.0.1:27017/lishogi" study-all2.js
//mongo --eval "var parallelism=4,instance=4;"" "mongodb://127.0.0.1:27017/lishogi" study-all2.js

const parallelism = 1;
const instance = 1;
print(`parallelism: ${parallelism}, instance: ${instance}`);

const idChars = "abcdefghyjklmnopqrstuvwxyzABCDEFGHYJKLMNOPQRSTUVWXYZ0123456789".split(
  ""
);
const sliceSize = idChars.length / parallelism;
const charSlice = idChars.slice(
  sliceSize * (instance - 1),
  sliceSize * instance
);
const firstCharRegex = new RegExp("^[" + charSlice.join("") + "]");
print(firstCharRegex);

const coll_flat = db.study_chapter_flat;
const coll      = db.study_chapter;

const dotRegex = /\./g;
const dollarRegex = /\$/g;

const dotSubRegex = /û/g;
const dollarSubRegex = /ü/g;

const dotSub = String.fromCharCode(251);
const dollarSub = String.fromCharCode(252);

// mig utils

const charOffset = 35;
// ["r", "b", "n", "p", "g", "s", "l"]
//                =>
// ["r", "b", "g", "s", "n", "l", "p"]
//   0    1    2    3    4    5    6
function convertDropChar(num) {
  switch (num) {
    case 0:
    case 1:
      return num;
    case 2:
      return 4;
    case 3:
      return 6;
    case 4:
      return 2;
    case 5:
      return 3;
    case 6:
      return 5;
    default:
      return num;
  }
}
function coordsToCharCode(x, y, files) {
  const sq = x + y * 16;
  return charOffset + (sq >>> 4) * files + (sq & 15);
}
function rewriteCharPair(charPair, files) {
  // offsetting by old char offset
  const first = charPair.charCodeAt(0) - 34, second = charPair.charCodeAt(1) - 34;
  const drops = 81 + 128; // 209
  if (second >= drops) {
      return String.fromCharCode(
        coordsToCharCode(8 - (first % 9), 8 - Math.floor(first / 9), files),
        charOffset + files * files + convertDropChar(second - drops)
      );
  }
  else {
      const prom = second >= 128;
      if (prom) {
        const s = second - 128;
        return String.fromCharCode(
          coordsToCharCode(8 - (s % 9), 8 - Math.floor(s / 9), files),
          coordsToCharCode(8 - (first % 9), 8 - Math.floor(first / 9), files),
        );
      } else {
        return String.fromCharCode(
          coordsToCharCode(8 - (first % 9), 8 - Math.floor(first / 9), files),
          coordsToCharCode(8 - (second % 9), 8 - Math.floor(second / 9), files)
        );
      }
  }
}
function rewriteWholePath(str, files) {
  const match = str.match(/..?/g);
  let res = "";
  for (const s of match) {
    print(rewriteCharPair(s, files))
    res += rewriteCharPair(s, files);
  }
  return res;
}

function encodeKey(key) {
  return key
    .replace(dotRegex, dotSub)
    .replace(dollarRegex, dollarSub);
}
function decodeKey(key) {
  return key
    .replace(dotSubRegex, '.')
    .replace(dollarSubRegex, '$');
}

function replaceNodeKey(key, files) {
  if (key.length === 1) return key;
  return encodeKey(rewriteWholePath(decodeKey(key), files));
}

function fixSfen(sfen, ply) {
  var parts = sfen.split(" ");
  parts[3] = (ply + 1).toString();
  return parts.join(" ");
}

const files = ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  ranks = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
function squareUciToUsi(sq) {
  const file = 8 - (sq.charCodeAt(0) - "a".charCodeAt(0)),
    rank = 8 - (sq.charCodeAt(1) - "1".charCodeAt(0));
  return files[file] + ranks[rank];
}
function assureUsi(str) {
  // UCI drop
  if (str.match(/^([RBGSNLP]\*)[a-i][1-9]$/)) {
    return str.substring(0, 2) + squareUciToUsi(str.substring(2, 4));
  }
  // UCI move
  else if (str.match(/^([a-i][1-9][a-i][1-9])(\+|\=)?$/)) {
    const prom = str.length === 5 ? "+" : "";
    return (
      squareUciToUsi(str.substring(0, 2)) +
      squareUciToUsi(str.substring(2, 4)) +
      prom
    );
  }
  print(str);
  return str;
}

// mig utils end

function updateRoot(oldRoot, files) {
  const initPly = oldRoot['ÿ'].p;
  const newRoot = {};
  for (let m in oldRoot) {
    const node = oldRoot[m];

    // delete san and crazyhouse
    delete node['s'];
    delete node['z'];

    // fix plies
    const curLength = m.length > 1 ? (m.length / 2) : 0;
    const nodePly = initPly + curLength;
    node.p = NumberInt(nodePly);
    node.f = fixSfen(node.f, nodePly);

    // replace uci with usi
    if (node.u) node.u = assureUsi(node.u);

    // update the key
    var newCKey = replaceNodeKey(m, files);
    newRoot[newCKey] = node;
  }
  return newRoot;
}

let i = 0;
let lastAt = Date.now();
let sumSizeFrom = 0;
let sumSizeTo = 0;
let sumMoves = 0;
let tooBigNb = 0;
let batch = [];

const batchSize = 1000;
const totalNb = coll_flat.count() / parallelism;

coll_flat.find({_id:firstCharRegex}).forEach((c) => {

    c.root = updateRoot(c.root, 9); // todo

    sumSizeTo += Object.bsonsize(c);
    
    // remove?
    const nbMoves = Object.keys(c.root).length;
    if (nbMoves > 3000) tooBigNb++;
    else batch.push(c);
    
    i++;
    sumMoves += nbMoves;
    if (i % batchSize == 0) {
      coll.insertMany(batch, {
        ordered: false,
        writeConcern: { w: 0, j: false },
      });
      batch = [];
      const at = Date.now();
      const perSecond = Math.round((batchSize / (at - lastAt)) * 1000);
      const percent = (100 * i) / totalNb;
      const minutesLeft = Math.round((totalNb - i) / perSecond / 60);
      print(
        `${i} ${percent.toFixed(
          2
        )}% ${perSecond}/s ETA ${minutesLeft} minutes | size:${(
          sumSizeFrom / batchSize
        ).toFixed(0)}->${(sumSizeTo / batchSize).toFixed(0)} moves:${(
          sumMoves / batchSize
        ).toFixed(0)} big:${tooBigNb}`
      );
      lastAt = at;
      sumSizeFrom = 0;
      sumSizeTo = 0;
      sumMoves = 0;
      tooBigNb = 0;
    }
});

coll.insertMany(batch, {
  ordered: false,
  // writeConcern: { w: 0, j: false }
});
