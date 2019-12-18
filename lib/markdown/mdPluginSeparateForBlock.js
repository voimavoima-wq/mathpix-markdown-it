"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("./common");
var mdPluginText_1 = require("./mdPluginText");
exports.default = (function (md) {
    md.core.ruler.after('normalize', 'separateForBlock', function (state) {
        mdPluginText_1.resetCounter();
        var pickTag = /\\(?:title\{([^}]*)\}|section\{([^}]*)\}|subsection\{([^}]*)\})/;
        var str = state.src;
        var arr = str.split('\n');
        var arr2 = [];
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            var match = item.match(pickTag);
            if (!match) {
                arr2.push(arr[i]);
                continue;
            }
            if (match.index === 0 && match[0].length === item.length) {
                arr2.push(arr[i]);
                continue;
            }
            if (match.index === 0 || item.slice(0, match.index).trim() === '') {
                var s2 = item.slice(0, match[0].length);
                var s3 = item.slice(match.index + match[0].length, item.length);
                arr2.push(s2);
                arr2.push(s3);
            }
            else {
                var ch = item.charCodeAt(match.index - 1);
                if (common_1.isSpace(ch)) {
                    var s1 = item.slice(0, match.index - 1);
                    var s2 = item.slice(match.index, item.length);
                    var s3 = item.slice(match.index + match[0].length, item.length);
                    arr2.push(s1);
                    arr2.push(s2);
                    if (s3 && s3.length > 0) {
                        arr2.push(s3);
                    }
                }
                else {
                    arr2.push(item);
                }
            }
        }
        state.src = arr2.join('\n');
    });
    md.core.ruler.after('normalize', 'separateBeforeBlock', function (state) {
        mdPluginText_1.resetCounter();
        var beginTag = /\\(?:begin\s{0,}\{(center|left|right|table|figure)\})/;
        var closeTag = /\\(?:end\s{0,}\{(center|left|right|table|figure)\})/;
        var endTag = function (arg) { return new RegExp('\\end\s{0,}\{(' + arg + ')\}'); };
        var needSep = false;
        var str = state.src;
        var arr = str.split('\n');
        var arr2 = [];
        var isOpen = false;
        var last = '';
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            var matchB = item.match(beginTag);
            if (matchB) {
                var align = matchB[1];
                closeTag = endTag(align);
            }
            var matchE = item.match(closeTag);
            if (!matchE && isOpen) {
                arr2.push(item);
                continue;
            }
            if (matchB && matchE) {
                isOpen = false;
                if (matchB.index === 0 || item.slice(0, matchB.index).trim() === '') {
                    if (last.trim().length > 0) {
                        arr2.push('\n');
                        if (matchE.index + matchE[0].length < item.length) {
                            var s1 = item.slice(0, matchE.index + matchE[0].length);
                            var s2 = item.slice(matchE.index + matchE[0].length, item.length);
                            arr2.push(s1);
                            arr2.push('\n');
                            arr2.push(s2);
                        }
                        else {
                            arr2.push(item);
                        }
                    }
                    else {
                        if (matchE.index + matchE[0].length < item.length) {
                            var s1 = item.slice(0, matchE.index + matchE[0].length);
                            var s2 = item.slice(matchE.index + matchE[0].length, item.length);
                            arr2.push(s1);
                            arr2.push('\n');
                            arr2.push(s2);
                        }
                        else {
                            arr2.push(item);
                            if (i + 1 < arr.length && arr[i].trim().length > 0) {
                                arr2.push('\n');
                            }
                        }
                    }
                }
                else {
                    var s1 = item.slice(0, matchB.index);
                    arr2.push(s1);
                    arr2.push('\n');
                    if (matchE.index + matchE[0].length < item.length) {
                        var s2 = item.slice(matchB.index, matchE.index + matchE[0].length);
                        arr2.push(s2);
                        arr2.push('\n');
                        var s3 = item.slice(matchE.index + matchE[0].length, item.length);
                        arr2.push(s3);
                    }
                    else {
                        var s2 = item.slice(matchB.index);
                        arr2.push(s2);
                    }
                }
                continue;
            }
            if (matchE) {
                isOpen = false;
                if (matchE.index + matchE[0].length < item.length) {
                    var s1 = item.slice(0, matchE.index + matchE[0].length);
                    var s2 = item.slice(matchE.index + matchE[0].length, item.length);
                    arr2.push(s1);
                    arr2.push('\n');
                    arr2.push(s2);
                }
                else {
                    arr2.push(item);
                    if (i + 1 < arr.length && arr[i + 1].trim().length > 0
                        && !closeTag.test(arr[i + 1]) && arr[i + 1].charCodeAt(0) !== 0x60) {
                        arr2.push('\n');
                    }
                }
                continue;
            }
            if (matchB) {
                isOpen = true;
                if (matchB.index === 0 || item.slice(0, matchB.index).trim() === '') {
                    if (last.trim().length > 0 && last.charCodeAt(0) !== 0x60) {
                        arr2.push('\n');
                        arr2.push(item);
                    }
                    else {
                        arr2.push(item);
                    }
                }
                else {
                    var s1 = item.slice(0, needSep ? matchB.index : matchB.index);
                    var s2 = item.slice(matchB.index);
                    arr2.push(s1);
                    arr2.push('\n');
                    arr2.push(s2);
                }
                continue;
            }
            arr2.push(item);
            last = item;
        }
        state.src = arr2.join('\n');
    });
});
//# sourceMappingURL=mdPluginSeparateForBlock.js.map