/**
 * Created by sandeepkumar on 16/01/17.
 */
export default cli => {
  const help = new cli.help('User', cli);

  // login command
  help.add('login', function() {
    this.line('login'.verbose);
    this.line('Log in to your salesforce account.'.input);
    this.line('  options:'.input);
    this.line('    --username      The username to log in with.'.input);
    this.line('    --password      The password to use when logging in.'.input);
    this.line('    -sandbox    Log in to sandbox org.'.input);
  });

  cli.program
    .option('-u, --username [value]', 'The username to log in with.')
    .option('-P, --password [value]', 'The password to use when logging in.')
    .option('-sandbox', 'Log in to sandbox org.');

  cli.program
    .command('login')
    .description('Log into an account.')
    .on('--help', help.commands.login)
    .action(() => {
      cli.runCommand(cli.commands.user.login, {
        username: cli.program.username,
        password: cli.program.password,
        isSandbox: typeof cli.program.sandbox === 'undefined' ? false : cli.program.sandbox
      });
    });

  // whoami command
  help.add('whoami', function() {
    this.line('whoami'.verbose);
    this.line('Know current logged in user information.'.input);
  });

  cli.program
    .command('whoami')
    .description('Know current logged in user information.')
    .on('--help', help.commands.whoami)
    .action(() => {
      cli.runCommand(cli.commands.user.whoami);
    });

  // logout command
  help.add('logout', function() {
    this.line('logout'.verbose);
    this.line('Log out of your current session.'.input);
  });

  cli.program
    .command('logout')
    .description('Log out of current account.')
    .on('--help', help.commands.logout)
    .action(() => {
      cli.runCommand(cli.commands.user.logout);
    });

  return {
    base : 'user',
    help
  };
};