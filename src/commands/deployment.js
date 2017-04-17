/**
 * Created by sandeepkumar on 16/01/17.
 */
import cli from '../cli';

import userConfig from '../common/userConfig';
import path from 'path';
import retrieve from '../common/retrieve';
import deploy from '../common/deploy';
import fs from 'fs';
import jsforce from 'jsforce';

const deployment = {};

deployment.retrieve = (options, conn, cb) => {

  if (!options.directory && !options.zipFile) {
    return cb('Please set --directory or --zipFile option to specify the destination of retrieved metadata package.');
  }
  if (options.packageNames && options.directory && options.packageNames.length !== options.directory.length) {
    return cb('Please set output directory paths in --directory option, corresponding to entiries in packageNames option.');
  }
  if (!options.pid && !options.memberTypes && !options.packageNames && !options.packageXML &&
    (!options.directory || options.directory.length !== 1)) {
    return cb('Please set --packageNames or --memberTypes in options, or speclify package.xml file path in --packageXML option');
  }

  (
    options.pid ? retrieve.checkRetrieveStatus(options.pid, options, conn) :
      options.memberTypes ? retrieve.retrieveByTypes(options.memberTypes, options, conn) :
        options.packageNames ? retrieve.retrieveByPackageNames(options.packageNames, options, conn) :
          options.packageXML ? retrieve.retrieveByPackageXML(options.packageXML, options, conn) :
            options.directory && options.directory.length === 1 ? retrieve.retrieveByPackageXML(path.join(options.directory[0], 'package.xml'), options, conn) :
              Promise.reject(new Error('Invalid option'))
  )
    .then(res => {
      console.log('');
      retrieve.reportRetrieveResult(res, options.verbose);
      if (!res.success) {
        console.log('');
        cli.io.warning('No output files generated.');
        return false;
      } else if (options.zipFile) {
        fs.writeFileSync(options.zipFile, new Buffer(res.zipFile, 'base64'));
        console.log('');
        cli.io.print(`Retrieved metadata files are saved in a ZIP archive: ${options.zipFile.magenta}`);
        return true;
      } else if (options.directory) {
        const dirMapping = {};
        if (options.packageNames) {
          for (let i=0; i<options.packageNames.length; i++) {
            dirMapping[options.packageNames[i]] = options.directory[i];
          }
        } else {
          dirMapping['*'] = options.directory[0];
        }
        return retrieve.extractZipContents(res.zipFile, dirMapping, options.verbose)
          .then(() => {
            console.log('');
            cli.io.print('Retrieved metadata files are saved under the directory: ');
            options.directory.forEach(dir => { cli.io.print(`  ${dir.magenta}`); });
            return true;
          });
      } else {
        return false;
      }
    })
    .then(success => {
      cb();
    })
    .catch(err => cb(err.message));
};

deployment.validateTargetUser = (username, password, env, cb) => {
  const conn = new jsforce.Connection({
    loginUrl : 'https://login.salesforce.com'
  });
  conn.login(username, password, (err, userInfo) => {
    if (err) {
      return cb(err);
    }

    cli.io.success(`Signed in as user ${username}`);
    return cb(null, conn);
  });
}

deployment.executeDeployment = (options, conn, cb) => {
  (
    options.zipFile ? deploy.deployFromZipStream(fs.createReadStream(options.zipFile), options, conn) :
      options.directory ? deploy.deployFromDirectory(options.directory, options, conn) :
        options.pid ? deploy.checkDeployStatus(options.pid, options, conn) :
          Promise.reject(new Error('Invalid Options'))
  )
    .then(res => {
      console.log('');
      deploy.reportDeployResult(res, console, options.verbose);
      cb();
    })
    .catch(err => cb(err.message));
}

deployment.deploy = (options, cb) => {
  if (!options.zipFile && !options.directory && !options.pid) {
    return cb('Please set --directory or --zipFile option to specify deploying package content, or set --pid for previous deployment process ID.');
  }

  let login = options.username;
  let pass = options.password;
  const prompt = [];

  if(typeof login !== 'string' || login.length < 1) {
    prompt.push({
      name: 'login',
      description: 'Enter your username [target]:',
      required: true
    });

    login = undefined;
  }

  if(typeof pass !== 'string' || pass.length < 1) {
    prompt.push({
      name: 'password',
      description: 'Enter your password [target]:',
      hidden: true,
      required: true
    });

    pass = undefined;
  }

  if(prompt.length > 0) {
    cli.io.prompt.get(prompt, (err, result) => {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      deployment.validateTargetUser.call(deployment, login || result.login, pass || result.password, null, (err, conn) => {
        if(err) {
          return cb(err.message);
        }
        deployment.executeDeployment(options, conn, cb);
      });
    });
  }
  else {
    deployment.validateTargetUser.call(deployment, login , pass, null, (err, conn) => {
      if(err) {
        return cb(err.message);
      }
      deployment.executeDeployment(options, conn, cb);
    });
  }
};

export default deployment;