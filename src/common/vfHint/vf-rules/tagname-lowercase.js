export default (VFHint) => {
  VFHint.addRule({
    id: 'tagname-lowercase',
    description: 'All html element names must meet the camelCase style.',
    init(parser, reporter) {
      const self = this;
      parser.addListener('tagstart,tagend', event => {
        const tagName = event.tagName;
        const splitArr = tagName.split(':');
        for(let i = 0 ; i < splitArr.length; i++) {
          if (/^[a-z][a-zA-Z\d]*([A-Z][a-zA-Z\d]*)*$/.test(splitArr[i]) === false) {
            reporter.error(`The vf element name of [ ${tagName} ] must be in camelCase style.`, event.line, event.col, self, event.raw);
            break;
          }
        }
      });
    }
  });
};