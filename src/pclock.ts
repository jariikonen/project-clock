#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import newTimesheet from './functions/newTimesheet';

const program = new Command();

program
  .name('pclock')
  .description('CLI app to clock time spent on a project')
  .version(version, '-v, --version', 'output the version number');

program.addHelpText('beforeAll', `pclock (Project Clock) v${version}\n`);

program
  .command('new')
  .description('Create a new project timesheet')
  .argument('<project_name>', 'name of the project')
  .action((projectName) => newTimesheet(projectName));

program.parse();
