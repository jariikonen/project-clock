import fs from 'node:fs';
import { parseProjectClockData } from '../types/ProjectClockData';
import getTimesheetPath from './getTimesheetPath';
import ProjectClockError from './ProjectClockError';

/**
 * Returns ProjectClockData object parsed from the timesheet file.
 * @throws ProjectClockError with a descriptive error message ('ERROR: no
 *    timesheet file in the directory', 'ERROR: more than one timesheet file in
 *    the directory', `ERROR: timesheet file 'FILE_PATH' does not exist`,
 *    `ERROR: reading of file 'FILE_PATH' denied (no permission)` or
 *    `ERROR: no write permission to file 'FILE_PATH'`).
 */
export default function readTimesheet(file = '') {
  const filePath = getTimesheetPath(file);
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    throw new ProjectClockError(
      `ERROR: reading of file '${filePath}' denied (no permission)`
    );
  }
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
  } catch (err) {
    throw new ProjectClockError(
      `ERROR: no write permission to file '${filePath}'`
    );
  }
  const fileData = fs.readFileSync(filePath, 'utf8');
  return parseProjectClockData(JSON.parse(fileData));
}
