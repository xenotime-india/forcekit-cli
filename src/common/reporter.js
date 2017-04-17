/**
 * Copyright (c) 2015, Yanis Wang <yanis.wang@gmail.com>
 * MIT Licensed
 */
export default mod => {
  class Reporter {
    constructor() {
      const self = this;
      self._init(...arguments);
    }

    _init(html, ruleset) {
      const self = this;
      self.html = html;
      self.lines = html.split(/\r?\n/);
      const match = html.match(/\r?\n/);
      self.brLen = match !== null ? match[0].length : 0;
      self.ruleset = ruleset;
      self.messages = [];
    }

    // error message
    error(message, line, col, rule, raw) {
      this.report('error', message, line, col, rule, raw);
    }

    // warning message
    warn(message, line, col, rule, raw) {
      this.report('warning', message, line, col, rule, raw);
    }

    // info message
    info(message, line, col, rule, raw) {
      this.report('info', message, line, col, rule, raw);
    }

    // save report
    report(type, message, line, col, rule, raw) {
      const self = this;
      const lines = self.lines;
      const brLen = self.brLen;
      let evidence;
      let evidenceLen;
      for(let i=line-1, lineCount=lines.length;i<lineCount;i++){
        evidence = lines[i];
        evidenceLen = evidence.length;
        if(col > evidenceLen && line < lineCount){
          line ++;
          col -= evidenceLen;
          if(col !== 1){
            col -= brLen;
          }
        }
        else{
          break;
        }
      }
      self.messages.push({
        type,
        message,
        raw,
        evidence,
        line,
        col,
        rule: {
          id: rule.id,
          description: rule.description,
          link: `https://github.com/yaniswang/VFHint/wiki/${rule.id}`
        }
      });
    }
  }

  mod.Reporter = Reporter;
};
