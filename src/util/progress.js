/**
 * Created by sandeepkumar on 16/01/17.
 */
const Progress = {};

Progress.indeterminate = function(fmt, opts={}) {
  this.fmt = fmt;
  this.width = opts.width || 20;
  this.animateTime = opts.animateTime || 250;
  this.timeout = null;
  this.curr = 0;
  this.rl = require('readline').createInterface({
    input: process.stdin,
    output: opts.stream || process.stdout
  });
  this.rl.setPrompt('', 0);
};

Progress.indeterminate.prototype.start = function() {

  this.curr = 0;
  this.tick();
};

Progress.indeterminate.prototype.stop = function() {
  clearTimeout(this.timeout);
  this.rl.resume();
  this.rl.close();
};

Progress.indeterminate.prototype.tick = function() {
  let pstr = Array(this.width).join(' ');
  pstr = `${pstr.substring(0,this.curr)}=${pstr.substring(this.curr)}`;
  const str = this.fmt.replace(':bar', pstr);
  this.rl.write(null, {ctrl: true, name: 'u'});
  this.rl.write(str);
  this.curr = (this.curr + 1) % this.width;
  const self = this;
  this.timeout = setTimeout(() => {
    self.tick();
  }, this.animateTime);
};

export default Progress;