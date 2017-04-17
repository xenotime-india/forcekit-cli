export default (VFHint) => {
  VFHint.addRule({
    id: 'attr-lowercase',
    description: 'All attribute names must be in lowercase.',
    init(parser, reporter, options) {
      const self = this;
      const exceptions = Array.isArray(options) ? options : [];
      parser.addListener('tagstart', event => {
        const attrs = event.attrs;
        let attr;
        const col = event.col + event.tagName.length + 1;
        for(let i=0, l=attrs.length;i<l;i++){
          attr = attrs[i];
          const attrName = attr.name;
          if (!exceptions.includes(attrName) && /^[a-z][a-zA-Z\d]*([A-Z][a-zA-Z\d]*)*$/.test(attrName) === false){
            reporter.error(`The attribute name of [ ${attrName} ] must be in camelCase style.`, event.line, col + attr.index, self, attr.raw);
          }
        }
      });
    }
  });
};
