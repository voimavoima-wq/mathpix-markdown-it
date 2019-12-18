"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var begin_tabular_1 = require("./begin-tabular");
var includegraphics_1 = require("../md-inline-rule/includegraphics");
exports.openTag = /\\begin\s{0,}\{(center|left|right)\}/;
var openCloseTag = /\\begin\s{0,}\{(center|left|right)\}\s{0,}([\s\S]*?)\s{0,}\\end\s{0,}\{(center|left|right)\}/;
var endTag = function (arg) {
    if (arg === void 0) { arg = 'center'; }
    return new RegExp('\\end\s{0,}\{(' + arg + ')\}');
};
exports.SeparateInlineBlocksBeginAlign = function (state, startLine, nextLine, content, align) {
    var res = [];
    var match = content.match(openCloseTag);
    if (match) {
        if (match.index > 0) {
            res.push({ content: content.slice(0, match.index), align: align });
        }
        res.push({ content: match[2], align: match[1] });
        content = content.slice(match.index + match[0].length);
        res = res.concat(exports.SeparateInlineBlocksBeginAlign(state, startLine, nextLine, content, align));
    }
    else {
        res.push({ content: content, align: align });
    }
    return res;
};
var InlineBlockBeginAlign = function (state, startLine) {
    var token;
    var pos = state.bMarks[startLine] + state.tShift[startLine];
    var max = state.eMarks[startLine];
    var lineText = state.src.slice(pos, max);
    var match = lineText.match(exports.openTag);
    if (!match) {
        return false;
    }
    var align = match[1];
    var closeTag = endTag(align);
    var pB = match.index + match[0].length;
    var matchE = lineText.match(closeTag);
    var pE = matchE ? matchE.index : 0;
    //const dopDiv: string =  matchE ? lineText.slice(matchE.index + matchE[0].length) : '';
    token = state.push('paragraph_open', 'div', 1);
    token.attrs = [
        ['class', 'center'],
        ['style', "text-align: " + (align ? align : 'center')]
    ];
    token.map = [startLine, startLine];
    if (pB > 0) {
        state.tShift[startLine] = pB;
    }
    if (pE > 0) {
        state.eMarks[startLine] = state.eMarks[startLine] - (lineText.length - pE + 1);
    }
    state.parentType = 'paragraph';
    state.env.align = align;
    var content = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
    if (!begin_tabular_1.StatePushTabularBlock(state, startLine, startLine + 1, content, align)) {
        if (!includegraphics_1.StatePushIncludeGraphics(state, startLine, startLine + 1, content, align)) {
            begin_tabular_1.StatePushDiv(state, startLine, startLine + 1, content);
        }
    }
    token = state.push('paragraph_close', 'div', -1);
    state.line = startLine + 1;
    return true;
};
exports.BeginAlign = function (state, startLine, endLine) {
    var token;
    var terminate;
    var pos = state.bMarks[startLine] + state.tShift[startLine];
    var max = state.eMarks[startLine];
    var nextLine = startLine + 1;
    var terminatorRules = state.md.block.ruler.getRules('paragraph');
    var lineText = state.src.slice(pos, max);
    var resText = '';
    var isCloseTagExist = false;
    var match = lineText.match(exports.openTag);
    if (!match) {
        return false;
    }
    var align = match[1];
    var closeTag = endTag(align);
    var pB = 0;
    if (closeTag.test(lineText)) {
        if (InlineBlockBeginAlign(state, startLine)) {
            return true;
        }
    }
    if (match.index + match[0].length < lineText.trim().length) {
        pB = match.index + match[0].length;
        resText = lineText.slice(match.index + match[0].length);
    }
    for (; nextLine < endLine; nextLine++) {
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);
        if (closeTag.test(lineText)) {
            isCloseTagExist = true;
            break;
        }
        resText += lineText;
        // this would be a code block normally, but after paragraph
        // it's considered a lazy continuation regardless of what's there
        if (state.sCount[nextLine] - state.blkIndent > 3) {
            continue;
        }
        // quirk for blockquotes, this line should already be checked by that rule
        if (state.sCount[nextLine] < 0) {
            continue;
        }
        // Some tags can terminate paragraph without empty line.
        terminate = false;
        for (var i = 0, l = terminatorRules.length; i < l; i++) {
            if (terminatorRules[i](state, nextLine, endLine, true)) {
                terminate = true;
                break;
            }
        }
        if (terminate) {
            break;
        }
    }
    if (!isCloseTagExist) {
        return false;
    }
    var matchE = lineText.match(closeTag);
    var pE = 0;
    //let pE = matchE ? matchE.index: 0;
    if (matchE) {
        resText += lineText.slice(0, matchE.index - 1);
        pE = matchE.index;
    }
    token = state.push('paragraph_open', 'div', 1);
    token.attrs = [
        ['class', 'center'],
        ['style', "text-align: " + (align ? align : 'center')]
    ];
    token.map = [startLine, nextLine];
    if (pB > 0) {
        state.tShift[startLine] = pB;
    }
    else {
        startLine += 1;
    }
    if (pE > 0) {
        state.eMarks[nextLine] = state.eMarks[nextLine] - (lineText.length - pE + 1);
    }
    else {
        nextLine += 1;
    }
    state.parentType = 'paragraph';
    state.env.align = align;
    var content = resText;
    if (!begin_tabular_1.StatePushTabularBlock(state, startLine, nextLine, content, align)) {
        if (!includegraphics_1.StatePushIncludeGraphics(state, startLine, nextLine, content, align)) {
            begin_tabular_1.StatePushDiv(state, startLine, nextLine, content);
        }
    }
    token = state.push('paragraph_close', 'div', -1);
    state.line = nextLine + 1;
    return true;
};
//# sourceMappingURL=begin-align.js.map