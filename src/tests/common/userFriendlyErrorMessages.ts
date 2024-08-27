/**
 * Functions that can be used for testing that different commands output user
 * friendly error messages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PROJECT_NAME, ROOT_DIR } from './constants';
import { createTestFile } from './testFile';
import { getTestPathsFromDirName } from './testPaths';
import { ProjectClockData } from '../../types/ProjectClockData';
import execute, { DOWN } from '../common/childProcessExecutor';
import { ERROR_MESSAGE_TIMESHEET_INSPECTION } from '../../common/constants';

/** Commands accepted by these functions. */
export enum Command {
  Add = 'add',
  List = 'list',
  Resume = 'resume',
  Start = 'start',
  Status = 'status',
  Stop = 'stop',
  Suspend = 'suspend',
  Show = 'show',
}

/**
 * Tests that command reports timesheet file errors in a user friendly manner,
 * when there is no timesheet file in the directory.
 * @param testDirName Name of the test directory.
 * @param command Command to test.
 */
export function noTimesheetFile(testDirName: string, command: Command) {
  const { subdirPath } = getTestPathsFromDirName(testDirName);
  let error = '';
  try {
    execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js ${command}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch(
    'An error occurred while reading the timesheet file (no timesheet file in the directory)'
  );
  expect(error).not.toMatch('throw');
  expect(error).not.toMatch('ProjectClockError');
}

/**
 * Tests that command reports timesheet file errors in a user friendly manner,
 * when the user has no permission to access the file.
 * @param testDirName Name of the test directory.
 * @param command Command to test.
 */
export function noPermission(testDirName: string, command: Command) {
  const { testFilePath, subdirPath } = getTestPathsFromDirName(testDirName);

  // initialize test environment
  createTestFile(
    {
      projectName: PROJECT_NAME,
      tasks: [],
    },
    testFilePath
  );
  fs.chmodSync(testFilePath, '000');

  // test
  let error = '';
  try {
    execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js ${command}`, {
      stdio: 'pipe',
    });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch('An error occurred while reading the timesheet file');
  expect(error).toMatch('no permission');
  expect(error).not.toMatch('throw');
  expect(error).not.toMatch('ProjectClockError');
}

/**
 * Tests that command reports timesheet file errors in a user friendly manner,
 * when there are more than one timesheet file in the directory.
 * @param testDirName Name of the test directory.
 * @param command Command to test.
 */
export function moreThanOneTimesheetFile(
  testDirName: string,
  command: Command
) {
  const { testFilePath, subdirPath } = getTestPathsFromDirName(testDirName);

  // initialize test environment
  const testFilePath2 = path.join(subdirPath, 'secondTestProject.pclock.json');
  createTestFile(
    {
      projectName: 'first test project',
      tasks: [],
    },
    testFilePath
  );
  createTestFile(
    {
      projectName: 'second test project',
      tasks: [],
    },
    testFilePath2
  );

  // test
  let error = '';
  try {
    execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js ${command}`, {
      stdio: 'pipe',
    });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch('An error occurred while reading the timesheet file');
  expect(error).toMatch('more than one timesheet file in the directory');
  expect(error).not.toMatch('throw');
  expect(error).not.toMatch('ProjectClockError');
}

/**
 * Tests that command reports in a user friendly manner when the command is
 * force stopped with ctrl + c during a prompt.
 * @param testDirName Name of the test directory.
 * @param command Command to test.
 * @param testFileDataObj A data object that is used for initializing the file
 *    used by the command. It has to be designed so that the command prompts
 *    the user for more information.
 */
export function forceStopped(
  testDirName: string,
  command: Command,
  testFileDataObj: ProjectClockData
) {
  const { testFilePath, subdirPath } = getTestPathsFromDirName(testDirName);

  // initialize test environment
  createTestFile(testFileDataObj, testFilePath);

  // test
  const response = execSync(
    `cd ${subdirPath} && printf '^C' | node ${ROOT_DIR}/bin/pclock.js ${command}`,
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  );
  expect(response).toMatch('exiting; user force closed the process');
  expect(response).not.toMatch('throw');
  expect(response).not.toMatch('ProjectClockError');
}

/**
 * Tests that command reports timesheet file errors in a user friendly manner,
 * when there is a faulty task in the timesheet file.
 * @param testDirName Name of the test directory.
 * @param command Command to test.
 */
export async function faultyTask(
  testDirName: string,
  command: Command,
  inputs: string[] = [],
  argument = ''
) {
  const { testFilePath, subdirPath } = getTestPathsFromDirName(testDirName);

  // initialize test environment
  createTestFile(
    {
      projectName: PROJECT_NAME,
      tasks: [
        {
          subject: 'faulty task',
          begin: '2024-01-01T01:00:00.000Z',
          end: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
    testFilePath
  );

  // test
  let error = '';
  try {
    await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js ${command} ${argument}`,
      inputs
    );
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch(ERROR_MESSAGE_TIMESHEET_INSPECTION);
  expect(error).toMatch(
    "invalid time period '2024-01-01T01:00:00.000Z' => '2024-01-01T00:00:00.000Z' (faulty task); start date is later than end date"
  );
  expect(error).not.toMatch('throw');
}
