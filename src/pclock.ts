#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import fs from 'node:fs';
import path from 'node:path';
import { version } from '../package.json';

const program = new Command();

program
  .name('pclock')
  .description('CLI app to clock time spent on a project')
  .version(version);

program.addHelpText('beforeAll', `pclock (Project Clock) v${version}\n`);

program
  .command('new')
  .description('Create a new project timesheet')
  .argument('<project_name>', 'name of the project')
  .action((projectName) => {
    const projectFileName = `${projectName}.pclock.json`;
    const projectFilePath = path.join(process.cwd(), projectFileName);

    const pd = {
      projectName,
      tasks: [],
    };

    try {
      fs.writeFileSync(projectFilePath, JSON.stringify(pd, null, 2), {
        flag: 'wx',
      });
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('EEXIST')) {
        console.error('ERROR: timesheet file already exists');
        process.exit(1);
      } else {
        reportError(err);
      }
    }
    console.log(`created a new timesheet: ${projectFilePath}`);
  });

program.parse();
