/**
 * Created by sandeepkumar on 16/01/17.
 */
import common from '../util/common';

export default cli => {

  const help = new cli.help('Code - Review', cli);

  // retrieve command
  help.add('review', function() {
    this.line('review'.verbose);
    this.line('Review source code.'.input);
    this.line('  options:'.input);
    this.line('    -T, --type [type]                VF/APEX.'.input);
    this.line('    -D, --directory [directory]      Local directory path of the package.'.input);
    this.line('    -L, --list                       Show all of the rules available.'.input);
    this.line('    -R, --rule [name]                Comma separated list of rule names to use.'.input);
    this.line('    -I, --ignore [pattern]           Add pattern to exclude matches.'.input);
  });

  cli.program
    .option('-T, --type [type]', 'VF/APEX.')
    .option('-D, --directory [directory]', 'Local directory path of the package. ')
    .option('-L, --list', 'Show all of the rules available.')
    .option('-R, --rule [name]', 'Comma separated list of rule names to use.', common.parseList)
    .option('-I, --ignore [ignore]', 'Add pattern to exclude matches.')

  cli.program
    .command('review')
    .description('Review source code.')
    .on('--help', help.commands.review)
    .action(() => {
      cli.runCommand(cli.commands.codeReview.review, {
        type : cli.program.type,
        directory : cli.program.directory ? cli.program.directory : './',
        list : typeof cli.program.list === 'undefined' ? false : cli.program.list,
        rule : cli.program.rule,
        ignore: cli.program.ignore
      }, false);
    });

  return {
    base : 'codeReview',
    help
  };
};