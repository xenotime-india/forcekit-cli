/**
 * Created by sandeepkumar on 16/01/17.
 */
import cli from '../cli';

import path from 'path';
import fs from 'fs';
import {vfHint as VFHint} from '../common/vfHint';
import APEXHint from '../common/apexHint/apexHint';
import LCHint from '../common/lcHint/lcHint';
import common from '../util/common';
const vfFormatter = require('../common/formatter')(VFHint);
import async from 'async';
import parseGlob from 'parse-glob';
import glob from "glob";
import ApexLint from './../common/apexHint/apexLint';
import LCLint from './../common/lcHint/lcLint';
import csv from 'csvtojson';

const codeReview = {};

codeReview.review = (options, cb) => {

  if (!options.directory && !options.list) {
    return cb('Please set --directory option to specify the source of retrieved metadata package.');
  }

  if (!options.type) {
    return cb('Please set --type option to specify the review type (VF/APEX/LC).');
  }

  switch (options.type.toLowerCase()) {
    case 'vf': {
      if(options.list) {
        var rules = VFHint.rules;
        var rule;
        cli.io.print('');
        cli.io.print('  All vf rules:'.verbose);
        cli.io.print('');
        for (const id in rules){
          rule = rules[id];
          cli.io.bullet(`     ${rule.id.bold} : ${rule.description}`);
        }
        cli.io.print('');
        cb();
      } else {
        hintTargets(vfFormatter, VFHint, options);
      }
      break;
    }
    case 'apex': {
      if (options.list) {
        var rules = APEXHint.rules;
        var rule;
        cli.io.print('');
        cli.io.print('  All apex rules:'.verbose);
        cli.io.print('');
        for (const rule of rules){
          cli.io.bullet(`     ${rule.name.bold} : ${rule.description} ${rule.default ? '(default)' : ''}`);
        }
        cli.io.print('');
        cb();
      } else {
        ApexLint(options.directory, options.rule)
          .then((result) => {
            const resultArray = [];
            result = result.join('\n');
            csv({trim:true})
              .fromString(result)
              .on('json', (json) => { //this func will be called 3 times

                resultArray.push(json);
              })
              .on('done', () => {

                printApexLog(resultArray);
                cb();
              })

          })
          .catch((err) => {
            cli.io.error(err);
            cb();
          })
      }
      break;
    }
    case 'lc': {
      if (options.list) {
        var rules = LCHint.rules;
        var rule;
        cli.io.print('');
        cli.io.print('  All Lightning JS rules:'.verbose);
        cli.io.print('');
        for (const rule of rules){
          cli.io.bullet(`     ${rule.name.bold} : ${rule.description} ${rule.default ? '(default)' : ''}`);
        }
        cli.io.print('');

        rules = VFHint.rules;
        cli.io.print('');
        cli.io.print('  All Lightning Component rules:'.verbose);
        cli.io.print('');
        for (const id in rules){
          rule = rules[id];
          cli.io.bullet(`     ${rule.id.bold} : ${rule.description}`);
        }
        cli.io.print('');

        cb();
      } else {
        LCLint(options.directory, options.rule)
          .then((result) => {
            printLCLog(JSON.parse(result.join('')));
            hintTargets(vfFormatter, VFHint, options);
          })
          .catch((err) => {
            cli.io.error(err);
            cb();
          })
      }
      break;
    }
    default : {
      return cb('Please set --type option to specify the review type (VF/APEX/LC).');
    }
  }
};

function printLCLog(logs) {
  const arrLogs = LCHint.format(logs, {
    colors: true,
    indent: 6
  });
  for(const l of arrLogs) {
    cli.io.print(l);
  }
}

function printApexLog(logs) {
  const arrLogs = APEXHint.format(logs, {
    colors: true,
    indent: 6
  });
  for(const l of arrLogs) {
    cli.io.print(l);
  }
}

function hintTargets(formatter, Hint, options) {
  let arrAllMessages = [];
  let allFileCount = 0;
  let allHintFileCount = 0;
  let allHintCount = 0;
  const startTime = new Date().getTime();

  // start hint
  formatter.emit('start');

  const arrTasks = [];
  arrTasks.push(next => {
    hintAllFiles(formatter, Hint, options.directory, options, result => {
      allFileCount += result.targetFileCount;
      allHintFileCount += result.targetHintFileCount;
      allHintCount += result.targetHintCount;
      arrAllMessages = arrAllMessages.concat(result.arrTargetMessages);
      next();
    });
  });
  async.series(arrTasks, () => {
    // end hint
    const spendTime = new Date().getTime() - startTime;
    formatter.emit('end', {
      arrAllMessages,
      allFileCount,
      allHintFileCount,
      allHintCount,
      time: spendTime
    });
    process.exit(allHintCount > 0 ? 1: 0);
  });
}

function hintAllFiles(formatter, Hint, target, options, onFinised){
  const globInfo = getGlobInfo(target, options);
  globInfo.ignore = options.ignore;

  // hint result
  let targetFileCount = 0;
  let targetHintFileCount = 0;
  let targetHintCount = 0;
  const arrTargetMessages = [];

  // init ruleset
  const ruleset = options.rule;

  // hint queue
  const hintQueue = async.queue((filepath, next) => {
    const startTime = new Date().getTime();
    hintNext(hintFile(Hint, filepath, ruleset));

    function hintNext(messages){
      const spendTime = new Date().getTime() - startTime;
      const hintCount = messages.length;
      if(hintCount > 0){
        formatter.emit('file', {
          'file': filepath,
          'messages': messages,
          'time': spendTime
        });
        arrTargetMessages.push({
          'file': filepath,
          'messages': messages,
          'time': spendTime
        });
        targetHintFileCount ++;
        targetHintCount += hintCount;
      }
      targetFileCount ++;
      setImmediate(next);
    }
  }, 10);
  // start hint
  let isWalkDone = false;
  let isHintDone = true;
  hintQueue.drain = () => {
    isHintDone = true;
    checkAllHinted();
  };
  function checkAllHinted(){
    if(isWalkDone && isHintDone){
      onFinised({
        targetFileCount,
        targetHintFileCount,
        targetHintCount,
        arrTargetMessages
      });
    }
  }
  if(target === 'stdin'){
    isWalkDone = true;
    hintQueue.push(target);
  }
  else if(/^https?:\/\//.test(target)){
    isWalkDone = true;
    hintQueue.push(target);
  }
  else{
    walkPath(globInfo, filepath => {
      isHintDone = false;
      hintQueue.push(filepath);
    }, () => {
      isWalkDone = true;
      checkAllHinted();
    });
  }
}

// split target to base & glob
function getGlobInfo(target, options){
  // fix windows sep
  target = target.replace(/\\/g, '/');
  const globInfo = parseGlob(target);
  let base = globInfo.base;
  base += /\/$/.test(base) ? '' : '/';
  let pattern = globInfo.glob;
  const globPath = globInfo.path;
  let defaultGlob = null;
  switch (options.type.toLowerCase()) {
    case 'vf' : {
      defaultGlob = '*.page';
      break;
    }
    case 'apex' : {
      defaultGlob = '*.cls';
      break;
    }
    case 'lc' : {
      defaultGlob = '*.cmp';
      break;
    }
  }
  if(globInfo.is.glob === true){
    // no basename
    if(globPath.basename === ''){
      pattern += defaultGlob;
    }
  }
  else{
    // no basename
    if(globPath.basename === ''){
      pattern += `**/${defaultGlob}`;
    }
    // detect directory
    else if(fs.existsSync(target) && fs.statSync(target).isDirectory()){
      base += `${globPath.basename}/`;
      pattern = `**/${defaultGlob}`;
    }
  }
  return {
    base,
    pattern
  };
}
function walkPath(globInfo, callback, onFinish) {
  let base = globInfo.base;
  const pattern = globInfo.pattern;
  const ignore = globInfo.ignore;
  const arrIgnores = ['**/node_modules/**'];
  if(ignore){
    ignore.split(',').forEach(pattern => {
      arrIgnores.push(pattern);
    });
  }
  const walk = glob(pattern, {
    'cwd': base,
    'dot': false,
    'ignore': arrIgnores,
    'nodir': true,
    'strict': false,
    'silent': true
  },() => {
    onFinish();
  });
  walk.on('match', file => {
    base = base.replace(/^.\//, '');
    callback(base + file);
  });
}

// hint file
function hintFile(Hint, filepath, ruleset){
  let content = '';
  try{
    content = fs.readFileSync(filepath, 'utf-8');
  }
  catch(e){}
  return Hint.verify(content, ruleset);
}

export default codeReview;