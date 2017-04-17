import vfHint from './vfHint';
require('./../reporter')(vfHint);

const normalizedPath = require("path").join(__dirname, "vf-rules");

require("fs").readdirSync(normalizedPath).forEach(file => {
  require(`./vf-rules/${file}`)(vfHint);
});

export default {
  vfHint
};