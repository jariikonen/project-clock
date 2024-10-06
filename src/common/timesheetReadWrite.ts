import fs from 'node:fs';
import path from 'node:path';
import ProjectClockError from './ProjectClockError';
import {
  parseProjectClockData,
  ProjectClockData,
} from '../types/ProjectClockData';
import { outputError } from './outputFormatting';

/**
 * Returns timesheet file path based on the 'file' parameter.
 *
 * If 'file' is undefined, the function looks for a file with a name matching
 * the timesheet file naming convention (project_name.pclock.json) from the
 * current working directory. If 'file' is not an absolute path, a path
 * relative to the current working directory is returned.
 * @param file Timesheet file path.
 * @returns Absolute path to a timesheet file if such is found.
 * @throws ProjectClockError with a descriptive error message ('no timesheet
 *    file in the directory', 'more than one timesheet file in the directory',
 *    or `timesheet file 'FILE_PATH' does not exist`).
 */
export function getTimesheetPath(file = '') {
  let filePath = '';
  if (file) {
    if (path.isAbsolute(file)) {
      if (!fs.existsSync(file)) {
        throw new ProjectClockError(`timesheet file '${file}' does not exist`);
      }
      filePath = file;
    } else {
      filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new ProjectClockError(
          `timesheet file '${filePath}' does not exist`
        );
      }
    }
  } else {
    const dirContents = fs.readdirSync(process.cwd(), { encoding: 'utf8' });
    const timesheets = dirContents.filter((fileName) =>
      fileName.match('.pclock.json$')
    );
    if (timesheets.length === 0) {
      throw new ProjectClockError('no timesheet file in the directory');
    }
    if (timesheets.length > 1) {
      throw new ProjectClockError(
        'more than one timesheet file in the directory'
      );
    }
    filePath = path.join(process.cwd(), timesheets[0]);
  }
  return filePath;
}

/**
 * Returns ProjectClockData object parsed from the timesheet file. Uses path
 * given as argument to find the file or looks for a timesheet file from the
 * current directory, if no path is provided.
 * @throws ProjectClockError with a descriptive error message ('no timesheet
 *    file in the directory', 'more than one timesheet file in the directory',
 *    `timesheet file 'FILE_PATH' does not exist`, `reading of file 'FILE_PATH'
 *    denied (no permission)` or `no write permission to file 'FILE_PATH'`).
 */
export function getTimesheetData(file = '') {
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
  let fileObj: unknown;
  try {
    fileObj = JSON.parse(fileData);
  } catch (err) {
    const errorMessage = err instanceof Error ? ` (${err.message})` : '';
    throw new ProjectClockError(
      `${filePath} is not a valid JSON file${errorMessage}`
    );
  }
  return parseProjectClockData(fileObj);
}

/**
 * Returns ProjectClockData object parsed from the timesheet file. Uses path
 * given as argument to find the file or looks for a timesheet file from the
 * current directory, if no path is provided.
 *
 * Differs from getTimesheetData() by handling ProjectClockErrors. If a
 * ProjectClockError is catched the message is printed to std.error and the
 * process is exited with code 1.
 * @param file
 * @returns
 */
export function readTimesheet(file = '') {
  let timesheetData: ProjectClockData;
  try {
    timesheetData = getTimesheetData(file);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      outputError(
        `An error occurred while reading the timesheet file (${error.message}).`
      );
      process.exit(1);
    }
    throw error;
  }
  return timesheetData;
}

/**
 * Writes new data to the timesheet file.
 * @throws ProjectClockError with a descriptive error message ('no timesheet
 *    file in the directory', 'more than one timesheet file in the directory')
 *    or an fs error.
 */
export function writeTimesheet(data: ProjectClockData, file = '') {
  const filePath = getTimesheetPath(file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
}
