import fs from 'node:fs';
import path from 'node:path';
import input from '@inquirer/input';
import handleExitPrompError from '../common/handleExitPromptError';
import { outputError, outputSuccess } from '../common/outputFormatting';

function getPClockFileName(projectName: string) {
  return `${projectName.replace(/\s/g, '_')}.pclock.json`;
}

async function getProjectName() {
  const cwd = process.cwd();
  const defaultName = path.basename(cwd);
  const defaultPath = path.join(cwd, getPClockFileName(defaultName));
  const defaultNameToUse = !fs.existsSync(defaultPath)
    ? defaultName
    : undefined;
  let result = '';
  try {
    result = await input({
      message: 'Enter name for the project:',
      default: defaultNameToUse,
    });
  } catch (error) {
    handleExitPrompError(error);
  }
  return result;
}

/**
 * Creates a new timesheet file for a project.
 *
 * Prompts the user for a project name if projectName argument is not given.
 * The name of the current working directory is offered as the default value if
 * the file doesn't exist already.
 * @param projectName Name of the new project.
 */
export default async function newTimeSheet(projectName: string | undefined) {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const projectNameToUse = projectName || (await getProjectName());
  if (!projectNameToUse) {
    outputError('Exiting; no project name.');
    process.exit(1);
  }

  const projectFileName = getPClockFileName(projectNameToUse);
  const projectFilePath = path.join(process.cwd(), projectFileName);

  const newProjectClockData = {
    projectName: projectNameToUse,
    tasks: [],
  };

  try {
    fs.writeFileSync(
      projectFilePath,
      JSON.stringify(newProjectClockData, null, 2),
      {
        flag: 'wx',
      }
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('EEXIST')) {
      outputError(
        `Cannot create timesheet file '${projectFilePath}'; file already exists.`
      );
      process.exit(1);
    } else {
      reportError(err);
    }
  }
  outputSuccess(`Created a new timesheet '${projectFilePath}'.`);
}
