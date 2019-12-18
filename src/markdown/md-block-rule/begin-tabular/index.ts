import { RuleBlock, Token } from 'markdown-it';
import { ParseTabular } from './parse-tabular';
import { ClearSubMathLists } from "./sub-math";
import { ClearSubTableLists } from "./sub-tabular";
import { pushError, CheckParseError } from '../parse-error';
import { getParams } from './common';
import {StatePushIncludeGraphics} from "../../md-inline-rule/includegraphics";

export const openTag: RegExp = /(?:\\begin\s{0,}{tabular}\s{0,}\{([^}]*)\})/;
export const openTagG: RegExp = /(?:\\begin\s{0,}{tabular}\s{0,}\{([^}]*)\})/g;
const closeTag: RegExp = /(?:\\end\s{0,}{tabular})/;
const closeTagG: RegExp = /(?:\\end\s{0,}{tabular})/g;

type TTypeContent = {type?: string, content?: string, align?: string}
type TTypeContentList = Array<TTypeContent>;
export type TAttrs = string[];
export type TTokenTabular = {token: string, tag: string, n: number, content?: string, attrs?: Array<TAttrs>};
export type TMulti = {mr?: number, mc?: number, attrs: Array<TAttrs>, content?: string, subTable?: Array<TTokenTabular>}

const addContentToList = (str: string): TTypeContentList => {
  let res: TTypeContentList = [];
  const match: RegExpMatchArray = str.match(/(?:\\begin\s{0,}{tabular})/);
  if (match) {
    let params = getParams(str, match.index + match[0].length);
    if (params) {
      if (match.index > 0) {
        res.push({type: 'inline', content: str.slice( 0, match.index), align: ''});
      }
      res.push({type: 'tabular', content: str.slice( params.index), align: params.align});
    } else {
      let mB: RegExpMatchArray = str
        .match(openTag);
      if (mB) {
        if (mB.index > 0) {
          res.push({type: 'inline', content: str.slice( 0, mB.index), align:''});
        }
        res.push({type: 'tabular', content: str.slice( mB.index + mB[0].length), align: mB[1]});
      } else {
        res.push({type: 'inline', content: str, align:''});
      }
    }
  } else {
    res.push({type: 'inline', content: str, align:''});
  }
  return res;
};

const parseInlineTabular = (str: string): TTypeContentList | null => {
  let mB: RegExpMatchArray = str.match(openTagG);
  let mE: RegExpMatchArray = str.match(closeTagG);
  if (!mB || !mE) {
    if (mB && !mE) {
      pushError('Not found end{tabular}!')
    }
    if (!mB && mE) {
      pushError('Not found begin{tabular}!')
    }
    return null;
  }
  if (mB.length !== mE.length) {
    pushError('Open and close tags mismatch!');
    return null;
  }

  let res:TTypeContentList = [];
  let pos: number = 0;
  let posB: number = 0;
  let posE: number = 0;

  for (let i = 0; i< str.length; i++) {
    const matchB = str
      .slice(posB)
      .match(openTag);

    const matchE = str
      .slice(posE)
      .match(closeTag);

    if (!matchB) {
      if (!matchE) {
        res.push({type: 'inline', content: str.slice(posE)});
        break;
      }
      res.push({type: 'tabular', content: str.slice(pos, matchE.index), align: ''});
      break;
    } else {
      if (!matchE) {
        res = res.concat(addContentToList(str.slice( posB, posB + matchB.index+matchB[0].length)));
        break;
      }
    }

    if (posB + matchB.index > posE + matchE.index ) {
      res = res.concat(addContentToList(str.slice(pos, pos + matchE.index)));
      posB += matchE.index + matchE[0].length;
      pos += matchE.index + matchE[0].length;
      i = posB;
      posE = posB;
    } else {
      posB += matchB.index + matchB[0].length;
      if (openTag.test(str.slice(posB, posE + matchE.index + matchE[0].length))) {
        posE += matchE.index + matchE[0].length;
      } else {
        res = res.concat(addContentToList(str.slice(pos, posE + matchE.index)));
        posE = posE + matchE.index + matchE[0].length;
        pos = posE;
        posB = posE;
      }
    }
  }
  return res;
};

const StatePushParagraphOpen = (state, startLine: number, align: string) => {
  let token: Token;
  token = state.push('paragraph_open', 'div', 1);
  token.attrs = [['class', 'table_tabular ']];
  token.attrs.push(['style', `text-align: ${align ? align : 'center'}`]);

  token.map = [startLine, state.line];
};

const StatePushParagraphClose = (state) => {
  state.push('paragraph_close', 'div', -1);
};

const StatePushTabulars = (state, cTabular: TTypeContentList, align: string) => {
  let token: Token;

  for (let i = 0; i < cTabular.length; i++) {
    if (cTabular[i].type === 'inline') {
      if (!StatePushIncludeGraphics(state, -1, -1, cTabular[i].content, align)) {
        token = state.push('inline', '', 0);
        token.children = [];
        token.content = cTabular[i].content;
      }
      continue;
    }
    const res: Array<TTokenTabular> | null = ParseTabular(cTabular[i].content, 0, cTabular[i].align);
    if (!res || res.length === 0) {
      continue;
    }
    for (let j = 0; j < res.length; j++) {
      token          = state.push(res[j].token, res[j].tag, res[j].n);
      if (res[j].attrs) {
        token.attrs  = [].concat(res[j].attrs);
      }
      if (res[j].token === 'inline') {
        if (res[j].content) {
          token.content  = res[j].content;
          token.children = [];
        }
      } else {
        token.content  = res[j].content;
        token.children = [];
      }
    }
  }
};


export const StatePushDiv = (state, startLine: number, nextLine: number, content: string) => {
  let token: Token;
  state.line = nextLine;
  token = state.push('paragraph_open', 'div', 1);
  token.map = [startLine, state.line];
  token = state.push('inline', '', 0);
  token.children = [];
  token.content = content;
  state.push('paragraph_close', 'div', -1);
};

export const StatePushTabularBlock = (state, startLine: number, nextLine: number, content: string, align: string): boolean => {
  const cTabular = parseInlineTabular(content);
  if (!cTabular || cTabular.length === 0) {
    return CheckParseError(state, startLine, nextLine, content)
  }
  state.line = nextLine;
  StatePushParagraphOpen(state, startLine, align);
  StatePushTabulars(state, cTabular, align);
  StatePushParagraphClose(state);
  return true;
};

export const BeginTabular: RuleBlock = (state, startLine: number, endLine: number) => {
  ClearSubTableLists();
  ClearSubMathLists();
  let terminate: boolean;
  const openTag: RegExp = /\\begin\s{0,}{tabular}/;
  const closeTag: RegExp = /\\end\s{0,}{tabular}/;
  let pos: number = state.bMarks[startLine] + state.tShift[startLine];
  let max: number = state.eMarks[startLine];
  let nextLine: number = startLine + 1;

  const terminatorRules = state.md.block.ruler.getRules('paragraph');
  let lineText: string = state.src.slice(pos, max);
  let dopDivB: string = '';

  let oldStartLine: number = startLine;
  let oldNextLine: number = nextLine;

  if (!openTag.test(lineText)) {
    dopDivB = lineText + '\n';
    if (openTag.test(state.src.slice(pos, state.eMarks[endLine]))) {
      for (; nextLine <= endLine; nextLine++) {
        if (lineText === '') {
          dopDivB = '';
          break;
        }
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);
        if (openTag.test(lineText)) {
          oldNextLine = nextLine;
          startLine = nextLine;
          nextLine += 1;
          break
        }
        dopDivB += lineText + '\n';
      }
    } else {
      return false;
    }
    if (dopDivB &&  dopDivB.length > 0) {
      if (!StatePushIncludeGraphics(state, oldStartLine, oldNextLine, dopDivB, '')) {
        StatePushDiv(state, oldStartLine, oldNextLine, dopDivB);
      }
    }
  }

  let resString: string = '';
  let iOpen: number = openTag.test(lineText) ? 1 : 0;

  if (iOpen > 0) {
    const match: RegExpMatchArray = lineText.match(/(?:\\begin\s{0,}{tabular})/);
    if (match) {
      resString += lineText;
      if (match.index > 0 && lineText.charCodeAt(match.index-1) === 0x60) {
        return false;
      }
    }
    if (closeTag.test(lineText)) {
      if (lineText.match(openTagG).length === lineText.match(closeTagG).length) {
        iOpen--;
      }
    }
  }

  for (; nextLine <= endLine; nextLine++) {
    if (lineText === '') {
      if (iOpen === 0) {
        break;
      }
    }
    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];
    lineText = state.src.slice(pos, max);

    resString += '\n' + lineText;
    if (iOpen > 0) {
      if (closeTag.test(lineText)) {
        iOpen--;
      }
    } else {
      if (state.isEmpty(nextLine)) { break }
    }

    if (openTag.test(lineText)) {
      iOpen++;
    }
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) { continue; }

    // Some tags can terminate paragraph without empty line.
    terminate = false;
    for (let i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }
  return StatePushTabularBlock(state, startLine, nextLine, resString, 'center');
};