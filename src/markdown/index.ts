import { ConfiguredMathJaxPlugin, CustomTagPlugin, HighlightPlugin,
    tocPlugin,
    anchorPlugin,
    tableTabularPlugin,
    listsPlugin,
    collapsiblePlugin,
    chemistry
} from "./mdPluginConfigured";
import { injectRenderRules } from "./rules";
import {MathpixMarkdownModel as MM, TMarkdownItOptions} from '../mathpix-markdown-model'

/** md renderer */
const mdInit = (options: TMarkdownItOptions) => {
  const {htmlTags = false, xhtmlOut = false, width = 1200, breaks = true, typographer = true, linkify = true,
          outMath = {}, mathJax = {}, renderElement = {},
          lineNumbering = false, htmlSanitize = true, smiles = {}} = options;
  return require("markdown-it")({
    html: htmlTags,
    xhtmlOut: xhtmlOut,
    breaks: breaks,
    langPrefix: "language-",
    linkify: linkify,
    typographer: typographer,
    quotes: "“”‘’",
    lineNumbering: lineNumbering,
    htmlSanitize: htmlSanitize
  })
    .use(chemistry, smiles )
    .use(tableTabularPlugin, {width: width, outMath: outMath})
    .use(listsPlugin, {width: width, outMath: outMath, renderElement: renderElement})
    .use(ConfiguredMathJaxPlugin({width: width, outMath: outMath, mathJax: mathJax, renderElement: renderElement}))
    .use(CustomTagPlugin())
    .use(HighlightPlugin, {auto: false})
    .use(anchorPlugin)
    .use(tocPlugin)
    .use(require('markdown-it-multimd-table'), {enableRowspan: true, enableMultilineRows: true})
    .use(require("markdown-it-footnote"))
    .use(require("markdown-it-sub"))
    .use(require("markdown-it-sup"))
    .use(require("markdown-it-deflist"))
    .use(require("markdown-it-mark"))
    .use(require("markdown-it-emoji"))
    .use(collapsiblePlugin)
    .use(require("markdown-it-ins"));
};



/** String transformtion pipeline */
// @ts-ignore
export const markdownToHtmlPipeline = (content: string, options: TMarkdownItOptions = {}) => {
  let md = mdInit(options);

  // inject rules override
  md = injectRenderRules(md);

  if (MM.disableRules && MM.disableRules.length > 0) {
      md.disable(MM.disableRules);
  }
  if (options.renderElement && options.renderElement.inLine) {
    return md.renderInline(content);
  } else {
    return md.render(content);
  }
};

/**
 * convert a markdown text to html
 */
export function markdownToHTML(markdown: string, options: TMarkdownItOptions = {}): string {
  return markdownToHtmlPipeline(markdown, options);
}
