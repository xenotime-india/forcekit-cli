import colors from './common/colors';
const cli     = module.exports;
import pkg from '../package.json';
import updateNotifier from 'update-notifier';

cli.version = pkg.version;

cli.program = require('commander-plus');
cli.program.Settings.autoHelp = false;

cli.io = require('./common/io');

cli.printHeader = () => {
  cli.io.print('');
  cli.io.print('     https://github.com/xenotime-india/forcekit'.verbose);
  cli.io.print('');
};

cli.commands         = {};
cli.commands.user    = require('./commands/user');
cli.commands.deployment    = require('./commands/deployment');
cli.commands.codeReview    = require('./commands/codeReview');

const done = err => {
  if (err) {
    cli.io.error(err);
    process.exit(1);
  } else {
    process.exit();
  }
};

cli.runCommand = (command, options, authRequired) => {
  //cli.io.print('Welcome to ' + 'sfdc cli'.magenta);

  updateNotifier({pkg}).notify();

  if (updateNotifier({pkg}).update) {
    cli.io.warning(`Your version ${diff.current.verbose} is behind the latest release ${diff.latest.verbose}.`);
    cli.io.print('Please update using "npm update -g forcekit"');
  }

  function go(conn) {
    const args = [options];
    if(conn) {
      args.push(conn);
    }
    args.push(done);
    command.apply(cli, args);
  }

  if (authRequired) {
    cli.commands.user.isAuthenticated((err, result) => {
      if (!result.status) {
        cli.io.error('Need to be logged in to execute this command.');
        cli.io.print('Please log in with "forcekit login" command.');
        return done();
      } else {
        go(result.conn);
      }
    });
  } else {
    go();
  }
};

cli.program.version(cli.version);

//Include the help object
cli.help = require('./common/help');

// Include routes
cli.routes = [
  require('./routes/user')(cli),
  require('./routes/deployment')(cli),
  require('./routes/codeReview')(cli),
];

// The full help concats the route helps
cli.printHelp = () => {
  cli.printHeader();
  cli.io.print('     Usage: forcekit <command> <param1> <param2> ...');
  cli.io.print('     Help format:'.input);
  cli.io.print('     <command> (<alias>)'.input);
  cli.io.print('     <description>'.input);
  cli.io.print('');

  for (let r = 0; r < cli.routes.length; r++) {
    cli.routes[r].help.pad = 5;
    cli.routes[r].help.print();
  }
};

// Help commands
cli.program.on('noCommand', cli.printHelp);
cli.program
  .command('help')
  .description('Print help for all commands.')
  .on('--help', cli.printHelp)
  .action(cli.printHelp);

cli.program
  .command('*')
  .action(() => {
    cli.io.print('Command not found.');
  });

cli.program.parse(process.argv);