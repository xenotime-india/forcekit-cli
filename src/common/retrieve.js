import fs from 'fs';
import fstream from 'fstream';
import path from 'path';
import stream from 'readable-stream';
import jsforce from 'jsforce';
import unzip from 'unzip';
import xml2js from 'xml2js';
import cli from '../cli';


const Promise = jsforce.Promise;

const RETRIEVE_OPTIONS =
  "apiVersion,packageNames,singlePackage,specificFiles,unpackaged".split(',');

/**
 *
 */
function retrieve(options, conn) {
  conn.metadata.pollTimeout = options.pollTimeout || 60*1000; // timeout in 60 sec by default
  conn.metadata.pollInterval = options.pollInterval || 5*1000; // polling interval to 5 sec by default
  const req = {};
  RETRIEVE_OPTIONS.forEach(prop => {
    if (typeof options[prop] !== 'undefined') { req[prop] = options[prop]; }
  });
  if (!req.apiVersion) {
    req.apiVersion = conn.version;
  }
  return conn.metadata.retrieve(req).complete({ details: true });
}

/**
 *
 */
function retrieveByTypes(typeList, options, conn) {
  const types = typeList.filter(p => p)
    .map(p => {
      const pair = p.split(/\s*:\s*/);
      const name = pair[0];
      const members = pair[1] ? pair[1].split(/\s*,\s*/) : ['*'];
      return { name, members };
    });
  options.unpackaged = { types };
  return retrieve(options, conn);
}

/**
 *
 */
function retrieveByPackageNames(packageNames, options, conn) {
  options.packageNames = packageNames;
  return retrieve(options, conn);
}

/**
 *
 */
function retrieveByPackageXML(xmlFilePath, options, conn) {
  return new Promise((resolve, reject) => {
    fs.readFile(xmlFilePath, 'utf-8', (err, data) => {
      if (err) { reject(err); } else { resolve(data); }
    });
  }).then(data => new Promise((resolve, reject) => {
    xml2js.parseString(data, { explicitArray: false }, (err, dom) => {
      if (err) { reject(err); } else { resolve(dom); }
    });
  })).then(dom => {
    delete dom.Package.$;
    options.unpackaged = dom.Package;
    return retrieve(options, conn);
  });
}


/**
 *
 */
function checkRetrieveStatus(processId, options, conn) {
  return connect(options).then(conn => {
    cli.io.print('Retrieving previous request result from server...');
    return conn.metadata.checkRetrieveStatus(processId, { details: true }, conn);
  });
}

/**
 *
 */
function reportRetrieveResult(res, verbose) {
  if(String(res.success) === 'true') {
    cli.io.success('Retrieve Succeeded.');
  } else if(String(res.done) === 'true') {
    cli.io.error('Retrieve Failed.');
  }
  else {
    cli.io.warning('Retrieve Not Completed Yet.');
  }

  if (res.errorMessage) {
    cli.io.error(res.errorMessage);
  }
  if (verbose) {
    reportRetreiveFileProperties(res.fileProperties);
  }
}

function asArray(arr) {
  if (!arr) { return []; }
  if (Object.prototype.toString.apply(arr) !== '[object Array]') { arr = [ arr ]; }
  return arr;
}

function reportRetreiveFileProperties(fileProperties) {
  fileProperties = asArray(fileProperties);
  if (fileProperties.length > 0) {
    console.log('');
    cli.io.print('Files:');
    fileProperties.forEach(f => {
      cli.io.log(` - [retreiving]${f.fileName}${f.type ? ' ['+f.type.magenta+']' : ''}`);
    });
  }
}

/**
 *
 */
function extractZipContents(zipFileContent, dirMapping, verbose) {
  cli.io.print('');
  return new Promise((resolve, reject) => {
    const waits = [];
    const zipStream = new stream.PassThrough();
    zipStream.end(new Buffer(zipFileContent, 'base64'));
    zipStream
      .pipe(unzip.Parse())
      .on('entry', entry => {
        const filePaths = entry.path.split('/');
        const packageName = filePaths[0];
        const directory = dirMapping[packageName] || dirMapping['*'];
        if (directory) {
          const restPath = filePaths.slice(1).join('/');
          const realPath = path.join(directory, restPath);
          waits.push(new Promise((rsv, rej) => {
            if(verbose) {
              cli.io.log(` - [extracting] ${realPath}`);
            }
            entry.pipe(
              fstream.Writer({
                type: entry.type,
                path: realPath
              })
            )
              .on('finish', rsv)
              .on('error', rej);
          }));
        } else {
          entry.autodrain();
        }
      })
      .on('finish', () => {
        setTimeout(() => {
          Promise.all(waits).then(resolve, reject);
        }, 1000);
      })
      .on('error', reject);
  });
}


/**
 *
 */
export default {
  retrieve,
  retrieveByTypes,
  retrieveByPackageNames,
  retrieveByPackageXML,
  checkRetrieveStatus,
  reportRetrieveResult,
  extractZipContents
};
