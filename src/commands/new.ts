import fs from 'node:fs';
import path from 'node:path';

/**
 * Creates a new timesheet file for a project.
 *
 * Requires the project name as an argument. Exits with an error if the
 * argument is not provided.
 * @param projectName Name of the new project.
 */
export default function newTimeSheet(projectName: string) {
  const projectFileName = `${projectName}.pclock.json`;
  const projectFilePath = path.join(process.cwd(), projectFileName);

  const newProjectClockData = {
    projectName,
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
      console.error('ERROR: timesheet file already exists');
      process.exit(1);
    } else {
      reportError(err);
    }
  }
  console.log(`created a new timesheet: ${projectFilePath}`);
}
