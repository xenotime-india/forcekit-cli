const APEXHint = {};

// format messages

APEXHint.rules = [
  {
    name:'security',
    default: true,
    path: 'rulesets/apex/security.xml',
    description: 'These rules deal with different security problems that can occur within Apex.',
  },
  {
    name:'apexunit',
    default: true,
    path: 'rulesets/apex/apexunit.xml',
    description: 'These rules deal with different problems that can occur with Apex unit tests.',
  },
  {
    name:'complexity',
    default: true,
    path: 'rulesets/apex/complexity.xml',
    description: 'The Complexity ruleset contains rules that find problems related to code size or complexity.',
  },
  {
    name:'performance',
    default: true,
    path: 'rulesets/apex/performance.xml',
    description: 'The Performance ruleset contains a collection of good practices which should be followed.',
  },
  {
    name:'style',
    default: true,
    path: 'rulesets/apex/style.xml',
    description: 'The Style Ruleset contains rules regarding preferred usage of names and identifiers.',
  },
];

APEXHint.format = (arrMessages, options) => {
  options = options || {};
  const arrLogs = [];
  const indent = options.indent || 0;

  let lastFileName = null;

  arrMessages.forEach(hint => {
    const line = hint.Line;

    if(lastFileName !== hint.File) {
      arrLogs.push('');
      arrLogs.push('');
      arrLogs.push(repeatStr(2) + hint.File.gray);
      arrLogs.push('');
    }

    arrLogs.push(`${repeatStr(indent)}L${line}${line.toString().length > 2 ? ' ': line.toString().length > 1 ? '  ' :'   '} |  ${hint.Priority === '1' ? hint.Description.red : hint.Priority === '2' ? hint.Description.blue : hint.Description.yellow}${' ( '.gray}${'Rule: '.white}${hint.Rule.bold.gray}${', Priority: '.white}${(hint.Priority === '1' ? hint.Priority.red : hint.Priority === '2' ? hint.Priority.blue : hint.Priority.yellow).bold} )`);

    lastFileName = hint.File;
  });
  return arrLogs;
};

// repeat string
function repeatStr(n, str) {
  return new Array(n + 1).join(str || ' ');
}
export default APEXHint;
