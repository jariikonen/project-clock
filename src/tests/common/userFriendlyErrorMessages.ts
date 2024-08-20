import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PROJECT_NAME, ROOT_DIR } from './constants';
import { createTestFile } from './testFile';
import { getTestPathsFromDirName } from './testPaths';
import { ProjectClockData } from '../../types/ProjectClockData';

export enum Command {
  Add = 'add',
  List = 'list',
  Resume = 'resume',
  Start = 'start',
  Status = 'status',
  Stop = 'stop',
  Suspend = 'suspend',
}

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

export function moreThanOneTimesheetFiles(
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

export function faultyTask(testDirName: string, command: Command) {
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
    execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js ${command}`, {
      stdio: 'pipe',
    });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch(
    'An error occurred while inspecting the timesheet file'
  );
  expect(error).toMatch(
    "invalid time period '2024-01-01T01:00:00.000Z' => '2024-01-01T00:00:00.000Z' (faulty task); start date is later than end date"
  );
  expect(error).not.toMatch('throw');
}
