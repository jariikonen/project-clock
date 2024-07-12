import fs from 'node:fs';
import { parseProjectClockData } from '../types/ProjectClockData';
import getTimesheetPath from './getTimesheetPath';

/**
 * Returns ProjectClockData object parsed from the timesheet file.
 * @throws ProjectClockError with a descriptive error message ('ERROR: no
 *    timesheet file in the directory', 'ERROR: more than one timesheet file in
 *    the directory') or an fs error if file is not found.
 */
export default function readTimesheet(file = '') {
  const filePath = getTimesheetPath(file);
  const fileData = fs.readFileSync(filePath, 'utf8');
  return parseProjectClockData(JSON.parse(fileData));
}
