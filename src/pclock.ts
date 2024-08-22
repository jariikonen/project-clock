#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import newTimeSheet from './commands/new';
import start from './commands/start';
import stop from './commands/stop';
import status from './commands/status';
import list from './commands/list';
import suspend from './commands/suspend';
import resume from './commands/resume';
import add from './commands/add';
import show from './commands/show';

const program = new Command();

program
  .name('pclock')
  .description('CLI app to clock time spent on a project')
  .version(version, '-V, --version', 'output the version number');

program.addHelpText('beforeAll', `pclock (Project Clock) v${version}\n`);

program
  .command('new')
  .description(
    'Create a new project timesheet. Prompts the user for a project name, if the project_name argument is not given.\n\n'
  )
  .argument('[project_name]', 'name of the project')
  .action((projectName) => newTimeSheet(projectName));

program
  .command('start')
  .description(
    'Start a task. If the command is called without the task descriptor argument, it will first look for any unstarted tasks. If a single such task is found, the user is asked if this is the one to be started. If more than one such task are found, user is asked which of the tasks to start. If no unstarted tasks are found, user is asked if a new task should be created. If user wants to create a new task, user is prompted for a subject for the new task and the current timestamp is provided as the default subject.\n\nIf task descriptor is provided, a task whose subject matches the descriptor is looked for. If such a task is found, the user is confirmed if it is the right task. If the task is correct, it is started. If such a task is not found, the user is confirmed whether to create a new task with the task descriptor as its subject. If many tasks match with the descriptor, user is prompted which of the tasks to start.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskName) => start(taskName));

program
  .command('stop')
  .description(
    'Stop the clock. If the command is called without the task descriptor argument, it will look for active tasks (i.e., a task that is started but not stopped). If one such task is found, the user is confirmed whether this is the correct task. If it is, the task is stopped by setting the "end" value of the task to current timestamp. If more than one such task are found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits with an error.\n\nIf task descriptor is provided, a tasks whose subject matches the descriptor is looked for. If such a task is found the user is confirmed whether it is the correct task to stop. if it is, the task is stopped. If more than one such task is found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits with an error.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskName) => stop(taskName));

program.option('-v, --verbose', 'print more verbose output');
program
  .command('status [-v]')
  .description('Output status information.\n\n')
  .action(() => status(program.opts()));

program.option('-a --active', 'list just the active tasks');
program.option('-c --complete', 'list just the completed tasks');
program.option('-i --incomplete', 'list just the incomplete tasks');
program.option(
  '-n --not-started',
  'list just the tasks that have not been started'
);
program
  .command('list [-acinv]')
  .alias('ls')
  .description('List tasks on the timesheet.\n\n')
  .action(() => list(program.opts()));

program
  .command('suspend')
  .alias('pause')
  .description('Suspend a task.\n\n')
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => suspend(taskDescriptor));

program
  .command('resume')
  .alias('unpause')
  .description('Resume a task.\n\n')
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => resume(taskDescriptor));

program
  .command('add')
  .description(
    'Add a new task. Prompts the user for a task subject if the task_subject argument is not given.\n\n'
  )
  .argument(
    '[task_subject]',
    'task subject; a string defining the subject of the task'
  )
  .action((taskSubject) => add(taskSubject));

program
  .command('show')
  .description(
    'Display the full task data (subject, description, notes and time data). Prompts the user to select a task if the task_descriptor argument is not given.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => show(taskDescriptor));

program.parse();
