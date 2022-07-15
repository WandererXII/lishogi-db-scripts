
function themeName(name) {
  switch (name) {
    case 'solid-orange':
      return 'orange';
    case 't_solid-natural':
    case 'solid-natural':
      return 'natural';
    case 't_wood1':
    case 'wood1':
      return 'wood';
    case 't_doubutsu':
      return 'doubutsu';
    case 'space1':
    case 'space2':
      return 'space';
    case 'blue':
    case 'gray':
    case 'oak':
    case 'kaya1':
    case 'kaya2':
    case 'Painting1':
    case 'Painting2':
    case 'Kinkaku':
    case 'doubutsu':
      return name.toLowerCase();
    default:
      return 'wood';
  }
}

db.pref.find().forEach((p) => {
  const curTheme = p.isTall ? p.themeTall : p.theme,
  highlights = p.highlight === undefined ? true : p.highlight;

  db.pref.update(
    { _id: p._id },
    {
      $set: {
        theme: themeName(curTheme),
        highlightLastDests: highlights,
        highlightCheck: highlights
      },
    }
  );
});
  
db.pref.updateMany({}, {
  $unset: {
    captured: true,
    clockBar: true,
    isTall: true,
    themeTall: true,
    highlight: true,
    is3d: true,
    theme3d: true,
    pieceSet3d: true,
    autoQueen: true,
    autoThreefold: true,
    rookCastle: true
  },
  $rename: {
    pieceNotation: "notation"
  }
});