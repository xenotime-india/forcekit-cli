import fs from 'fs';
import path from 'path';
import encrypter from 'object-encrypter';

const engine = encrypter('6E6F846E16A1FD877B17B42697B5E', {ttl: false});

const configFile = 'forcekit.json';
const homedir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
const defaultsFile = path.join(homedir, configFile);

class UserConfig {

  constructor() {

    if (!fs.existsSync(defaultsFile)) {
      fs.writeFileSync(defaultsFile, '', 'utf8');
    }
  }

  load() {
    if(fs.existsSync(defaultsFile)) {
      try {
        this.data = engine.decrypt(fs.readFileSync(defaultsFile, 'utf8'));
      } catch(e) {
        this.data = null;
      }
      return true;
    } else {
      return false;
    }
  };

  save(data) {
    fs.writeFileSync(defaultsFile, engine.encrypt(data), 'utf8');
    return true;
  };

  clearSession() {
    this.load();

    delete this.data.accessToken;
    delete this.data.userId;
    delete this.data.instanceUrl;
    delete this.data.username;
    delete this.data.password;
    delete this.data.isSandbox;

    this.save(this.data);

    return true;
  };
}
export default new UserConfig();