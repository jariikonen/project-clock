import fs from 'node:fs';
import getTimesheetPath from './getTimesheetPath';
import { ProjectClockData } from '../types/ProjectClockData';

/**
 * Writes new data to the timesheet file.
 * @throws ProjectClockError with a descriptive error message ('ERROR: no
 *    timesheet file in the directory', 'ERROR: more than one timesheet file in
 *    the directory') or an fs error.
 */
export default function writeTimesheet(data: ProjectClockData, file = '') {
  const filePath = getTimesheetPath(file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
}
