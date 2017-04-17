import childprocess from 'child_process';
import Path from 'path';
import readline from 'readline';
import APEXHint from './apexHint';

export default (directory, rules) => {
  return new Promise((resolve, reject) => {

    const applyRule = [];

    if(rules) {
      for (const rule of rules) {
        for (const baseRule of APEXHint.rules) {
          if (baseRule.name === rule.toLowerCase()) {
            applyRule.push(baseRule.path);
          }
        }
      }
    }

    if(applyRule.length == 0) {
      for(const baseRule of APEXHint.rules) {
        applyRule.push(baseRule.path);
      }
    }

    const child = childprocess.spawn(Path.join(__dirname,'..','..','..','external','pmd','bin','run.sh'), ['pmd','-d',directory,'-f','csv','-R',applyRule.join(','),'-language','apex']);
    const stdout = [];
    const stderr = [];

    readline.createInterface({
      input     : child.stdout,
      terminal  : false
    }).on('line', line => {
      stdout.push(line)
    });


    child.stderr.on('data', (data) => {
      stderr.push(data);
    });

    child.on('error', (err) => {
      console.log(err);
      return reject(err);
    });

    child.on('exit', (code) => {
      return resolve(stdout);
    });
  });
};