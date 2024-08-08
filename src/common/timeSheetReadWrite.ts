import fs from 'node:fs';
import path from 'node:path';
import ProjectClockError from './ProjectClockError';
import {
  parseProjectClockData,
  ProjectClockData,
} from '../types/ProjectClockData';

/**
 * Returns time sheet file path based on the 'file' parameter.
 *
 * If 'file' is undefined, the function looks for a file with a name matching
 * the time sheet file naming convention (project_name.pclock.json) from the
 * current working directory. If 'file' is not an absolute path, a path
 * relative to the current working directory is returned.
 * @param file TimeSheet file path.
 * @returns Absolute path to a time sheet file if such is found.
 * @throws ProjectClockError with a descriptive error message ('no time sheet
 *    file in the directory', 'more than one time sheet file in the directory',
 *    or `time sheet file 'FILE_PATH' does not exist`).
 */
export function getTimeSheetPath(file = '') {
  let filePath = '';
  if (file) {
    if (path.isAbsolute(file)) {
      if (!fs.existsSync(file)) {
        throw new ProjectClockError(`time sheet file '${file}' does not exist`);
      }
      filePath = file;
    } else {
      filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new ProjectClockError(
          `time sheet file '${filePath}' does not exist`
        );
      }
    }
  } else {
    const dirContents = fs.readdirSync(process.cwd(), { encoding: 'utf8' });
    const timeSheets = dirContents.filter((fileName) =>
      fileName.match('.pclock.json$')
    );
    if (timeSheets.length === 0) {
      throw new ProjectClockError('no time sheet file in the directory');
    }
    if (timeSheets.length > 1) {
      throw new ProjectClockError(
        'more than one time sheet file in the directory'
      );
    }
    filePath = path.join(process.cwd(), timeSheets[0]);
  }
  return filePath;
}

/**
 * Returns ProjectClockData object parsed from the time sheet file. Uses path
 * given as argument to find the file or looks for a time sheet file from the
 * current directory, if no path is provided.
 * @throws ProjectClockError with a descriptive error message ('no time sheet
 *    file in the directory', 'more than one time sheet file in the directory',
 *    `time sheet file 'FILE_PATH' does not exist`, `reading of file 'FILE_PATH'
 *    denied (no permission)` or `no write permission to file 'FILE_PATH'`).
 */
export function getTimeSheetData(file = '') {
  const filePath = getTimeSheetPath(file);
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
 * Returns ProjectClockData object parsed from the time sheet file. Uses path
 * given as argument to find the file or looks for a time sheet file from the
 * current directory, if no path is provided.
 *
 * Differs from getTimeSheetData() by handling ProjectClockErrors. If a
 * ProjectClockError is catched the message is printed to std.error and the
 * process is exited with code 1.
 * @param file
 * @returns
 */
export function readTimeSheet(file = '') {
  let timeSheetData: ProjectClockData;
  try {
    timeSheetData = getTimeSheetData(file);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(
        `An error occurred while reading the time sheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
  }
  return timeSheetData;
}

/**
 * Writes new data to the time sheet file.
 * @throws ProjectClockError with a descriptive error message ('no time sheet
 *    file in the directory', 'more than one time sheet file in the directory')
 *    or an fs error.
 */
export function writeTimeSheet(data: ProjectClockData, file = '') {
  const filePath = getTimeSheetPath(file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
}
