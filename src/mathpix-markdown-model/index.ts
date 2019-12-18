import {checkFormula} from './check-formula';
import {markdownToHTML as markdownHTML} from "../markdown";
import {MathpixStyle, PreviewStyle, ContainerStyle, codeStyles, TocStyle, resetBodyStyles} from "../mathjax/styles";
import { tabularStyles } from "../mathjax/styles-tabular";
import {MathJax} from '../mathjax';
import * as CSS from 'csstype'; // at top of file

export interface optionsMathpixMarkdown {
    alignMathBlock?: CSS.TextAlignProperty;
    display?: CSS.DisplayProperty;
    isCheckFormula?: boolean;
    showTimeLog?: boolean;
    isDisableFancy?: boolean;
    disableRules?: string[];
    fontSize?: number;
    padding?: number;
    htmlTags?: boolean; // Enable HTML tags in source
    breaks?: boolean,
    typographer?: boolean,
    width?: number;
    showToc?: boolean;
    overflowY?: string; //default 'unset'
}

export type TMarkdownItOptions = {
  htmlTags?: boolean,
  breaks?: boolean,
  typographer?: boolean,
  width?: number,
  lineNumbering?: boolean
}

class MathpixMarkdown_Model {
    public disableFancyArrayDef = ['replacements', 'list', 'usepackage', 'separateForBlock', 'toc'];
    public disableRules: string[];
    public isCheckFormula?: boolean;
    public showTimeLog?: boolean;

    setOptions(disableRules: string[], isCheckFormula?: boolean, showTimeLog?: boolean){
        this.disableRules = disableRules;
        this.isCheckFormula = isCheckFormula;
        this.showTimeLog = showTimeLog;
    }
    checkFormula = checkFormula;

  texReset = MathJax.Reset;
  getLastEquationNumber = MathJax.GetLastEquationNumber;

  markdownToHTML = (markdown: string, options: TMarkdownItOptions):string => {
    const { lineNumbering = false } = options;
    let html = markdownHTML(markdown, options);
    if (!lineNumbering) {
      MathJax.Reset();
      if (html.indexOf('clickable-link') !== -1) {
        html = this.checkEquationNumber(html);
      }
    }

    return html;
  };

  showTocInContainer = (html: string, containerName: string = 'toc') => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;
    const toc = body.getElementsByClassName('table-of-contents')[0];
    if (toc) {
      const toc_container = document.getElementById(containerName);
      if (toc_container) {
        toc_container.innerHTML = toc.innerHTML;
        const preview_right = document.getElementById("preview-right");
        if (preview_right) {
          preview_right.style.margin = 'unset';
        }
      }
    }
  };

  getTocContainerHTML = ( html: string ):string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;
    const toc = body.getElementsByClassName('table-of-contents')[0];
    if (toc) {
      return toc.innerHTML;
    }else {
      return '';
    }
  };

  checkEquationNumber = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const body = doc.body;
      const links = body.getElementsByClassName('clickable-link');
      for(let i = 0; i < links.length; i++) {
        const eq = links[i].getAttribute('value');
        const equationNumber = doc.getElementById(eq);
        if (!equationNumber) {
          links[i].innerHTML=`[${decodeURIComponent(eq)}]`;
        } else {
          const numbers = equationNumber.getAttribute('number');
          if(numbers) {
            links[i].innerHTML = `[${numbers.split(',')[0]}]`
          }
        }
      }
      return body.innerHTML;
    } catch (e) {
      return html;
    }

  };

    handleClick = (e) => {
      const domNode = e.target.attributes;
      const preview: HTMLDivElement = <HTMLDivElement>document.getElementById("preview");
      let offsetTarget: number;

      if (domNode.href && domNode.length === 2 ) {
        e.preventDefault();
        const anchor: HTMLElement = document.getElementById(domNode.href.nodeValue.slice(1));
        if (!anchor) { return };
        offsetTarget = anchor.getBoundingClientRect().top + preview.scrollTop - 48;
        this.scrollPage(preview, offsetTarget);
      } else {
        if (domNode.length > 2 && domNode[2].value) {
          if (domNode[2].value === 'clickable-link') {
            e.preventDefault();
            const domID: string = domNode[3].value;
            const el: HTMLElement = document.getElementById(domID);
            if (!el) { return };
            if (el.classList.contains('table')||el.classList.contains('figure')) {
              offsetTarget = el.getBoundingClientRect().top + preview.scrollTop - 48;
            } else {
              offsetTarget = (el.offsetTop) - (window.innerHeight / 2) || 0;
            }
            this.scrollPage(preview, offsetTarget);
          } else {
            if (domNode[2].value && domNode[2].value.indexOf('toc-link') >= 0 ) {
              e.preventDefault();
              const selectLink = document.getElementsByClassName('toc-link');
              if (selectLink && selectLink.length > 0) {
                for (let i = 0; i< selectLink.length; i++) {
                  selectLink[i].classList.remove('selected');
                }
              }
              domNode[2].value = 'toc-link selected';
              const anchor: HTMLElement = document.getElementById(domNode.href.nodeValue.slice(1));
              if (!anchor) { return };
              offsetTarget = anchor.getBoundingClientRect().top + preview.scrollTop - 48;
              this.scrollPage(preview, offsetTarget);
            }
          }
        }
      }
    };

    scrollPage = (parent, offsetTarget) => {
        const offsetStart: number = parent.scrollTop;
        const step: number = Math.abs(offsetTarget - offsetStart) / 20;
        let clickPoint: number = offsetStart;
        const refeatTimer: number = window.setInterval(() => {
            clickPoint = offsetTarget > offsetStart ? (clickPoint + step) : (clickPoint - step);
            parent.scrollTop = clickPoint;
            const scrollNext: number = (step > 1) ? Math.abs(clickPoint - offsetTarget) + 1 : Math.abs(clickPoint - offsetTarget);
            if (scrollNext <= step) {
                clearInterval(refeatTimer);
                return;
            }
        }, 10);
    };

    loadMathJax = (notScrolling:boolean=false, setTextAlignJustify: boolean=true, isResetBodyStyles: boolean=false):boolean => {
        try {
            const el = document.getElementById('SVG-styles');
            if (!el) {
                document.head.appendChild(MathJax.Stylesheet());
            }

            const elStyle = document.getElementById('Mathpix-styles');
            if (!notScrolling) {
              window.addEventListener('click', this.handleClick, false);
            }
            if (!elStyle) {
                const style = document.createElement("style");
                style.setAttribute("id", "Mathpix-styles");
                let bodyStyles = isResetBodyStyles ? resetBodyStyles : '';
                style.innerHTML = bodyStyles + MathpixStyle(setTextAlignJustify) + codeStyles + tabularStyles;
                document.head.appendChild(style);
            }
            return true;
        } catch (e) {
            console.log('Error load MathJax =>', e.message);
            return false;
        }
    };

    convertToHTML = (str:string, options: TMarkdownItOptions) => {
        const startTime = new Date().getTime();
        const  mathString =  this.isCheckFormula ? this.checkFormula(str, this.showTimeLog): str;
        options.lineNumbering = false;
        const html = this.markdownToHTML(mathString, options);
        const endTime = new Date().getTime();
        if(this.showTimeLog){
            console.log(`===> setText: ${endTime - startTime}ms`);
        }
        return html;
    };

    getMathjaxStyle = () => {
      return MathJax.Stylesheet().children[0].value;
    }

    getMathpixStyle = (stylePreview: boolean = false, showToc: boolean = false, tocContainerName: string = 'toc') => {
      const MathJaxStyle = MathJax.Stylesheet();
      let style: string = ContainerStyle + MathJaxStyle.children[0].value + MathpixStyle(stylePreview) + codeStyles + tabularStyles;
      if (showToc) {}
      return stylePreview
        ? showToc ? style + PreviewStyle + TocStyle(tocContainerName) : style + PreviewStyle
        : style;
    };

    render = ( text: string, options?: optionsMathpixMarkdown ):string => {
        const { alignMathBlock='center', display='block', isCheckFormula=false, showTimeLog=false,
          isDisableFancy=false, fontSize=null, padding=null, htmlTags=false, width=0, showToc = false,
          overflowY='unset', breaks = true, typographer = true
        } = options || {};
        const disableRules = isDisableFancy ? this.disableFancyArrayDef : options ? options.disableRules || [] : [];
        if (!showToc) {
          disableRules.push('toc');
        }
        const styleFontSize = fontSize ? ` font-size: ${options.fontSize}px;` : '';
        const stylePadding = padding ? ` padding-left: ${options.padding}px; padding-right: ${options.padding}px;` : '';
        this.setOptions(disableRules, isCheckFormula, showTimeLog);
        return (
            `<div id='preview' style='justify-content:${alignMathBlock};overflow-y:${overflowY};will-change:transform;'>
                <div id='container-ruller'></div>
                <div id='setText' style='display: ${display}; justify-content: inherit;${styleFontSize}${stylePadding}' >
                    ${this.convertToHTML(text, 
              {htmlTags: htmlTags, breaks: breaks, typographer: typographer, width: width})}
                </div>
            </div>`
        );
    };
}

export const MathpixMarkdownModel = new MathpixMarkdown_Model();