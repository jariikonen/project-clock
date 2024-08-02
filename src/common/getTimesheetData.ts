import fs from 'node:fs';
import { parseProjectClockData } from '../types/ProjectClockData';
import getTimesheetPath from './getTimesheetPath';
import ProjectClockError from './ProjectClockError';

/**
 * Returns ProjectClockData object parsed from the timesheet file.
 * @throws ProjectClockError with a descriptive error message ('no timesheet
 *    file in the directory', 'more than one timesheet file in the directory',
 *    `timesheet file 'FILE_PATH' does not exist`, `reading of file 'FILE_PATH'
 *    denied (no permission)` or `no write permission to file 'FILE_PATH'`).
 */
export default function readTimesheet(file = '') {
  const filePath = getTimesheetPath(file);
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    throw new ProjectClockError(
      `reading of file '${filePath}' denied (no permission)`
    );
  }
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
  } catch (err) {
    throw new ProjectClockError(`no write permission to file '${filePath}'`);
  }
  const fileData = fs.readFileSync(filePath, 'utf8');
  return parseProjectClockData(JSON.parse(fileData));
}
