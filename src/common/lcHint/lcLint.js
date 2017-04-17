import childprocess from 'child_process';
import Path from 'path';
import readline from 'readline';
import ILHint from './lcHint';

export default (directory, rules) => {
  function isEmpty(obj) {
    for(var key in obj) {
      if(obj.hasOwnProperty(key))
        return false;
    }
    return true;
  }
  return new Promise((resolve, reject) => {

    const applyRule = {};

    if(rules && typeof rules === 'object') {
      for (const rule of rules) {
        for (const baseRule of ILHint.rules) {
          if (baseRule.name === rule.toLowerCase()) {
            applyRule[baseRule.name] = baseRule.type;
          }
        }
      }
    }

    if(isEmpty(applyRule)) {
      for(const baseRule of ILHint.rules) {
        applyRule[baseRule.name] = baseRule.type;
      }
    }

    const child = childprocess.spawn('node', [Path.join(__dirname, '..', '..', '..','node_modules','.bin','eslint'),directory,'--rule',JSON.stringify(applyRule),'-f','json']);
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
      return reject(err);
    });

    child.on('exit', (code) => {
      console.log(stdout);
      return resolve(stdout);
    });
  });
};