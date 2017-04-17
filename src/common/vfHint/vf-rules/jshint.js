export default (VFHint) => {
  VFHint.addRule({
    id: 'jshint',
    description: 'Scan script with jshint.',
    init(parser, reporter, options) {
      const self = this;
      parser.addListener('cdata', event => {
        if(event.tagName.toLowerCase() === 'script'){
          const mapAttrs = parser.getMapAttrs(event.attrs);
          const type = mapAttrs.type;

          // Only scan internal javascript
          if(mapAttrs.src !== undefined || (type && /^(text\/javascript)$/i.test(type) === false)){
            return;
          }

          let jsVerify;

          if(typeof exports === 'object' && require){
            jsVerify = require('jshint').JSHINT;
          }
          else{
            jsVerify = JSHINT;
          }

          if(options !== undefined){
            const styleLine = event.line - 1;
            const styleCol = event.col - 1;
            const code = event.raw.replace(/\t/g,' ');
            try{
              const status = jsVerify(code, options);
              if(status === false){
                jsVerify.errors.forEach(error => {
                  const line = error.line;
                  reporter.warn(error.reason, styleLine + line, (line === 1 ? styleCol : 0) + error.character, self, error.evidence);
                });
              }
            }
            catch(e){}
          }
        }
      });
    }
  });
};