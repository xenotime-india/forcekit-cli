export default (VFHint) => {
  VFHint.addRule({
    id: 'html-disabled',
    description: 'Do not use the <HTML> tag.',
    init(parser, reporter) {
      const self = this;
      const formCount = 0;
      parser.addListener('tagstart', event => {
        const tagName = event.tagName.toLowerCase();
        const col = event.col + tagName.length + 1;
        if(tagName === '<html>') {
          reporter.warn('Do not use the <HTML> tag. This is redundant with the <apex:page> tag.', event.line, col, self, event.raw);
        }
      });
    }
  });
};