
let gameCnt = 0;

db.game5.find( {if: {$exists: true}} ).forEach((g) => {
  const sfen = g.if;
  const splitSfen = sfen.split(" ");
  const sfenColor = splitSfen[1] === 'w' ? 'gote' : 'sente'
  const plyColor = ((g.st || 0) % 2 === 0) ? 'sente' : 'gote';

  if (sfenColor !== plyColor)
    gameCnt++;
});

print("Total: ", gameCnt)
