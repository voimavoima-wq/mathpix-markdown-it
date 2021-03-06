export const setFontSize = (fontSize: number, options) => {
  if (!fontSize) {
    return options
  }
  const pt = Number(fontSize) * 3/4;
  const scale = pt/5;
  options.bondThickness = 0.6 * scale;
  options.bondLength = 15 * scale;
  options.bondSpacing = 0.18 * 15 * scale;
  options.fontSizeLarge = pt;
  options.fontSizeLargePx = fontSize;
  options.fontSizeSmall = 3 * scale;
  options.fontSizeSmallPx = (3 * scale) * 4/3;
  options.padding = 5 * scale;

  return options;
};

export const setDisableColors = (options) => {
  options.themes = {
    dark: {
      C:  '#fff',
      O:  '#fff',
      N:  '#fff',
      F:  '#fff',
      CL: '#fff',
      BR: '#fff',
      I:  '#fff',
      P:  '#fff',
      S:  '#fff',
      B:  '#fff',
      SI: '#fff',
      H:  '#fff',
      BACKGROUND: '#141414'
    },
    light: {
      C:  '#222',
      O:  '#222',
      N:  '#222',
      F:  '#222',
      CL: '#222',
      BR: '#222',
      I:  '#222',
      P:  '#222',
      S:  '#222',
      B:  '#222',
      SI: '#222',
      H:  '#222',
      BACKGROUND: '#fff'
    }
  };
  return options;
};


export const getScale = (fontSize: number) => {
  if (!fontSize) {
    fontSize = 14;
  }
  const pt = Number(fontSize) * 3/4;
  const scale = pt/5;
  return scale;
};
