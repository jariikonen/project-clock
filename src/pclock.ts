#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import newTimeSheet from './commands/new';
import start from './commands/start';
import stop from './commands/stop';
import status from './commands/status';

const program = new Command();

program
  .name('pclock')
  .description('CLI app to clock time spent on a project')
  .version(version, '-V, --version', 'output the version number');

program.addHelpText('beforeAll', `pclock (Project Clock) v${version}\n`);

program
  .command('new')
  .description(
    'Create a new project time sheet. Requires the project name as an argument.'
  )
  .argument('<project_name>', 'name of the project')
  .action((projectName) => newTimeSheet(projectName));

program
  .command('start')
  .description(
    'Start the clock. Without any arguments the command creates a new task with current timestamp as both its "subject" and its "begin" value. If the task descriptor (regexp matcher) is passed as an argument, a task is created with this string as "subject" and current timestamp as the "begin" value. Command exits with an error if the task already exists.'
  )
  .argument('[task_name]', 'name of the task')
  .action((taskName) => start(taskName));

program
  .command('stop')
  .description(
    'Stop the clock. Without any arguments the command stops an active task (started but not stopped) if there is only one such task, by setting the "end" value of the task to current timestamp. With a task descriptor as argument the command stops a task with matching "subject". If the descriptor matches more than one task, command returns with an error.'
  )
  .argument('[task_name]', 'name of the task')
  .action((taskName) => stop(taskName));

program.option('-v, --verbose', 'The command prints more verbose output.');

program
  .command('status [-v]')
  .description('Output status information. ')
  .action(() => status(program.opts()));

program.parse();
