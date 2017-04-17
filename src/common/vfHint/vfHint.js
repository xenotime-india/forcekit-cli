import vfparser from './vfparser';

const VFHint = {};

VFHint.version = '@VERSION';
VFHint.release = '@RELEASE';

VFHint.rules = {};

VFHint.defaultRuleset = {
  'tagname-lowercase': true,
  'attr-lowercase': true,
  'attr-value-double-quotes': true,
  'doctype-first': true,
  'tag-pair': true,
  'spec-char-escape': true,
  'id-unique': true,
  'src-not-empty': true,
  'attr-no-duplication': true,
  'title-require': true
};

VFHint.addRule = rule => {
  VFHint.rules[rule.id] = rule;
};

VFHint.verify = (html, ruleset) => {

  const localRuleset = [];

  if (ruleset === undefined || Object.keys(ruleset).length === 0) {
    for (const defaultRule in VFHint.defaultRuleset) {
      if (VFHint.defaultRuleset[defaultRule]) {
        localRuleset.push(defaultRule);
      }
    }
  } else {
    for (const rule of ruleset) {
      for (const defaultRule in VFHint.defaultRuleset) {
        if (defaultRule == rule.toLocaleString() && VFHint.defaultRuleset[defaultRule]) {
          localRuleset.push(defaultRule);
        }
      }
    }
  }

  const parser = new vfparser();
  const reporter = new VFHint.Reporter(html, ruleset);
  const rules = VFHint.rules;

  for (const ruleName of localRuleset) {
    const rule = rules[ruleName];
    if (rule !== undefined && ruleName !== false) {
      rule.init(parser, reporter, ruleName);
      //console.log(rule);
    }
  }

  parser.parse(html);

  return reporter.messages;
};

// format messages
VFHint.format = (arrMessages, options) => {
  options = options || {};
  const arrLogs = [];

  const indent = options.indent || 0;
  arrMessages.forEach(hint => {
    const leftWindow = 40;
    const rightWindow = leftWindow + 20;
    let evidence = hint.evidence;
    const line = hint.line;
    const col = hint.col;
    const evidenceCount = evidence.length;
    let leftCol = col > leftWindow + 1 ? col - leftWindow : 1;
    let rightCol = evidence.length > col + rightWindow ? col + rightWindow : evidenceCount;
    if (col < leftWindow + 1) {
      rightCol += leftWindow - col + 1;
    }
    evidence = evidence.replace(/\t/g, ' ').substring(leftCol - 1, rightCol);
    // add ...
    if (leftCol > 1) {
      evidence = `...${evidence}`;
      leftCol -= 3;
    }
    if (rightCol < evidenceCount) {
      evidence += '...';
    }
    // show evidence
    arrLogs.push(repeatStr(indent) + ('L' + line + ' |').white + evidence.gray);
    // show pointer & message
    let pointCol = col - leftCol;
    // add double byte character
    const match = evidence.substring(0, pointCol).match(/[^\u0000-\u00ff]/g);
    if (match !== null) {
      pointCol += match.length;
    }
    arrLogs.push(repeatStr(indent) + repeatStr(String(line).length + 3 + pointCol) + ('^ ' + hint.message).red + ' ( '.gray + 'Rule: '.white + hint.rule.id.bold.gray + ' )'.gray);
  });
  return arrLogs;
};

// repeat string
function repeatStr(n, str) {
  return new Array(n + 1).join(str || ' ');
}

export default VFHint;
