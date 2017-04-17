export default (VFHint) => {
  VFHint.addRule({
    id: 'form-count',
    description: 'Minimize number of forms on a page.',
    init(parser, reporter) {
      const self = this;
      let formCount = 0;
      parser.addListener('tagstart', event => {
        const tagName = event.tagName.toLowerCase();
        const col = event.col + tagName.length + 1;
        if(tagName === 'apex:form') {
          formCount++;
          if(formCount > 1){
            reporter.warn('Multiple <apex:form> tag found.', event.line, col, self, event.raw);
          }
        }
      });
    }
  });
};