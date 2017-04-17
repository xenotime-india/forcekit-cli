/**
 * Created by sandeepkumar on 16/01/17.
 */
import cli from '../cli';
import userConfig from '../common/userConfig';
import util from 'util';
import jsforce from 'jsforce';
import error from './../util/errors';

const user = {};

user.authenticate = (username, password, isSandbox, cb) => {
  const conn = new jsforce.Connection({
    loginUrl : isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
  });
  conn.login(username, password, (err, userInfo) => {
    if (err) {
      return cb(err.message);
    }

    const udata = {
        username,
        password,
        userId : userInfo.id,
        isSandbox,
        accessToken : conn.accessToken,
        instanceUrl: conn.instanceUrl,
      };

    userConfig.save(udata);
    cli.io.success(`Signed in as user ${username}`);
    return cb(null, conn);
  });
};

user.isAuthenticated = callback => {
  userConfig.load();
  if(userConfig.data && userConfig.data.userId) {

    const conn = new jsforce.Connection({
      instanceUrl : userConfig.data.instanceUrl,
      accessToken : userConfig.data.accessToken,
    });
    conn.identity((err, res) => {
      if (err) {
        user.authenticate.call(user, userConfig.data.username, userConfig.data.password, userConfig.data.isSandbox , (err, conn) => {
          if(!err) {
            callback(null, {status:true,conn});
          }
        });
      } else {
        cli.io.print(`You are logged in as ${res.display_name}`);
        callback(null, {status:true,conn});
      }
    });
  } else {
    callback(new Error('NOT_AUTHENTICATED'))
  }
};

user.login = (options, cb) => {
  let login = options.username;
  let pass = options.password;
  let isSandbox = options.isSandbox;
  const prompt = [];

  if(typeof login !== 'string' || login.length < 1) {
    prompt.push({
      name: 'login',
      description: 'Enter your username or email:',
      required: true
    });

    login = undefined;
  }

  if(typeof pass !== 'string' || pass.length < 1) {
    prompt.push({
      name: 'password',
      description: 'Enter your password:',
      hidden: true,
      required: true
    });

    pass = undefined;
  }

  if(prompt.length > 0) {
    prompt.push({
      name: 'isSandbox',
      description: 'Is this a sandbox org (Y/N):',
      pattern: /^(?:Y|N|y|n)$/,
      hidden: false,
      required: true
    });

    isSandbox = undefined;

    cli.io.prompt.get(prompt, (err, result) => {
      if(err) {
        cli.io.print('');
        cli.io.print('CLI terminated....');
        cli.io.error(error.handlePromptError(err));
        cb();
      }
      user.authenticate.call(user, login || result.login, pass || result.password, (result.isSandbox == 'Y' || result.isSandbox == 'y'), cb);
    });
  }
  else {
    user.authenticate.call(user, login, options.password, isSandbox , cb);
  }
};

user.logout = () => {
  userConfig.load();
  let userName = null;
  if(userConfig.data && userConfig.data.userId) {
    userName = userConfig.data.username;

    userConfig.clearSession();
    cli.io.success(`You have signed out of ${userName}`);
  } else {
    cli.io.error('No login data saved in your local machine.');
  }
};

user.whoami = () => {
  userConfig.load();
  let userName = null;
  if(userConfig.data && userConfig.data.userId) {
    userName = userConfig.data.username;
    cli.io.success(`You have logged in with ${userName}`);
  } else {
    cli.io.error('No login data saved in your local machine.');
  }
};

export default user;