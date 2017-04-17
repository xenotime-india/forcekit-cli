export default (VFHint) => {
  VFHint.addRule({
    id: 'spec-char-escape',
    description: 'Special characters must be escaped.',
    init(parser, reporter) {
      const self = this;
      parser.addListener('text', event => {
        const raw = event.raw;
        const reSpecChar = /[<>]/g;
        let match;
        while((match = reSpecChar.exec(raw))){
          const fixedPos = parser.fixPos(event, match.index);
          reporter.error(`Special characters must be escaped : [ ${match[0]} ].`, fixedPos.line, fixedPos.col, self, event.raw);
        }
      });
    }
  });
};