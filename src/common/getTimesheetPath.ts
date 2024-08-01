import fs from 'node:fs';
import path from 'node:path';
import ProjectClockError from './ProjectClockError';

/**
 * Returns timesheet file path based on the 'file' parameter.
 *
 * If 'file' is undefined, the function looks for a file with a name matching
 * the timesheet file naming convention (project_name.pclock.json) from the
 * current working directory. If 'file' is not an absolute path, a path
 * relative to the current working directory is returned.
 * @param file Timesheet file path.
 * @returns Absolute path to a timesheet file if such is found.
 * @throws ProjectClockError with a descriptive error message ('ERROR: no
 *    timesheet file in the directory', 'ERROR: more than one timesheet file in
 *    the directory', or `ERROR: timesheet file 'FILE_PATH' does not exist`).
 */
export default function getTimesheetPath(file = '') {
  let filePath = '';
  if (file) {
    if (path.isAbsolute(file)) {
      if (!fs.existsSync(file)) {
        throw new ProjectClockError(
          `ERROR: timesheet file '${file}' does not exist`
        );
      }
      filePath = file;
    } else {
      filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new ProjectClockError(
          `ERROR: timesheet file '${filePath}' does not exist`
        );
      }
    }
  } else {
    const dirContents = fs.readdirSync(process.cwd(), { encoding: 'utf8' });
    const timesheets = dirContents.filter((fileName) =>
      fileName.match('.pclock.json$')
    );
    if (timesheets.length === 0) {
      throw new ProjectClockError('ERROR: no timesheet file in the directory');
    }
    if (timesheets.length > 1) {
      throw new ProjectClockError(
        'ERROR: more than one timesheet file in the directory'
      );
    }
    filePath = path.join(process.cwd(), timesheets[0]);
  }
  return filePath;
}
