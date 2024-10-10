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
import {
  edit as editCommand,
  editDescription,
  editNotes,
  editSubject,
} from './commands/edit';

const program = new Command();

program
  .name('pclock')
  .description('CLI app to clock time spent on a project')
  .version(version, '-V, --version', 'output the version number')
  .option('--no-color', 'turns off the color output');

program.addHelpText('beforeAll', `pclock (Project Clock) v${version}\n`);

const commandNew = program.command('new');
const commandStart = program.command('start');
const commandStop = program.command('stop');
const commandStatus = program.command('status');
const commandList = program.command('list');
const commandSuspend = program.command('suspend');
const commandResume = program.command('resume');
const commandAdd = program.command('add');
const commandShow = program.command('show');
const commandEdit = program.command('edit');

const subCommandEditSubject = commandEdit.command('subject');
const subCommandEditDescription = commandEdit.command('description');
const subCommandEditNotes = commandEdit.command('notes');

commandNew
  .description(
    'Create a new project timesheet. Prompts the user for a project name, if the project_name argument is not given.\n\n'
  )
  .argument('[project_name]', 'name of the project')
  .action((projectName) => newTimeSheet(projectName));

commandStart
  .description(
    'Start a task. If the command is called without the task descriptor argument, it will first look for any unstarted tasks. If a single such task is found, the user is asked if this is the one to be started. If more than one such task are found, user is asked which of the tasks to start. If no unstarted tasks are found, user is asked if a new task should be created. If user wants to create a new task, user is prompted for a subject for the new task and the current timestamp is provided as the default subject.\n\nIf task descriptor is provided, a task whose subject matches the descriptor is looked for. If such a task is found, the user is confirmed if it is the right task. If the task is correct, it is started. If such a task is not found, the user is confirmed whether to create a new task with the task descriptor as its subject. If many tasks match with the descriptor, user is prompted which of the tasks to start.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskName) => start(taskName));

commandStop
  .description(
    'Stop the clock. If the command is called without the task descriptor argument, it will look for active tasks (i.e., a task that is started but not stopped). If one such task is found, the user is confirmed whether this is the correct task. If it is, the task is stopped by setting the "end" value of the task to current timestamp. If more than one such task are found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits with an error.\n\nIf task descriptor is provided, a tasks whose subject matches the descriptor is looked for. If such a task is found the user is confirmed whether it is the correct task to stop. if it is, the task is stopped. If more than one such task is found, the user is prompted which one of the tasks to stop. If no such task is found, the command exits with an error.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskName) => stop(taskName));

commandStatus
  .option('-v, --verbose', 'more verbose output')
  .description('Output status information.\n\n')
  .action(() => status(commandStatus.opts()));

commandList
  .alias('ls')
  .description('List tasks on the timesheet.\n\n')
  .option('-a --active', 'list active tasks')
  .option('-c --complete', 'list completed tasks')
  .option('-i --incomplete', 'list incomplete tasks')
  .option('-u --unstarted', 'list unstarted tasks')
  .action(() => list(commandList.opts()));

commandSuspend
  .alias('pause')
  .description('Suspend a task.\n\n')
  .option(
    '-c --includeCompleted',
    'include completed tasks in search when called without arguments'
  )
  .option(
    '-s --includeStopped',
    'include stopped tasks in search when called without arguments (alias to -c)'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => suspend(taskDescriptor, commandSuspend.opts()));

commandResume
  .alias('unpause')
  .description('Resume a task.\n\n')
  .option(
    '-c --includeCompleted',
    'include completed tasks in search when called without arguments'
  )
  .option(
    '-s --includeStopped',
    'include stopped tasks in search when called without arguments (alias to -c)'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => resume(taskDescriptor, commandResume.opts()));

commandAdd
  .description(
    'Add a new task. Prompts the user for a task subject if the task_subject argument is not given.\n\n'
  )
  .argument(
    '[task_subject]',
    'task subject; a string defining the subject of the task'
  )
  .action((taskSubject) => add(taskSubject));

commandShow
  .description(
    'Display the full task data (subject, description, notes and time data). Prompts the user to select a task if the task_descriptor argument is not given.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => show(taskDescriptor));

commandEdit
  .description(
    'Edit task. Has three sub commands: "subject", "description" and "notes". "Subject" allows you to edit the subject, "description" to edit the description, and "notes" to edit the notes on the task indicated by the task_descriptor argument. Type "help edit" for more information.\n\n'
  )
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .action((taskDescriptor) => editCommand(taskDescriptor));

subCommandEditSubject
  .description('Edit task subject.')
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .argument('[new_subject]', 'a new subject for the task')
  .action((taskDescriptor, newSubject) =>
    editSubject(taskDescriptor, newSubject)
  );

subCommandEditDescription
  .description('Edit task description.')
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .argument('[new_description]', 'a new description for the task')
  .action((taskDescriptor, newDescription) =>
    editDescription(taskDescriptor, newDescription)
  );

subCommandEditNotes
  .description('Edit task notes.')
  .argument(
    '[task_descriptor]',
    'task descriptor; a string that is expected to match a task subject'
  )
  .argument('[new_note]', 'a new note to the task')
  .action((taskDescriptor, newNote) => editNotes(taskDescriptor, newNote));

program.parse();
