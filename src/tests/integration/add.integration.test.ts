import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'child_process';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TASK_SUBJECT,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { expectTaskEqualsTo } from '../common/testTask';

const testDirName = 'testDirAdd';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

beforeEach(() => {
  createTestDir(subdirPath);
});

afterEach(() => {
  removeTestDir(subdirPath);
});

describe('User friendly error messages', () => {
  test('"Add" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`, {
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
  });

  test('"Add" command reports timesheet file errors in a user friendly manner; no permission', () => {
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
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`, {
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
  });

  test('"Add" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && printf '^C' | node ${ROOT_DIR}/bin/pclock.js add`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch('exiting; user force closed the process');
    expect(response).not.toMatch('throw');
    expect(response).not.toMatch('ProjectClockError');
  });
});

describe('Correct functioning', () => {
  beforeEach(() => {
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );
  });

  function expectTaskIsCreated() {
    expectTaskEqualsTo(
      testFilePath,
      {
        subject: TASK_SUBJECT,
      },
      TASK_SUBJECT
    );
  }

  function expectTaskIsNotCreated() {
    const { tasks } = getTestFileDataObj(testFilePath);
    expect(tasks.length).toEqual(0);
  }

  test('"Add" command creates task correctly when the taskSubject argument is passed', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add '${TASK_SUBJECT}'`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch(`created a new task '${TASK_SUBJECT}'`);
    expectTaskIsCreated();
  });

  test('"Add" command prompts for the task subject when the taskSubject argument is not passed', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch(
      'enter subject for the new task (empty to exit without creating a task):'
    );
  });

  test('"Add" command creates task correctly when the task subject is entered through the prompt', () => {
    const response = execSync(
      `cd ${subdirPath} && printf "${TASK_SUBJECT}\n" | node ${ROOT_DIR}/bin/pclock.js add`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch(
      'enter subject for the new task (empty to exit without creating a task):'
    );
    expect(response).toMatch(`created a new task '${TASK_SUBJECT}'`);
    expectTaskIsCreated();
  });

  test('"Add" command does not create any tasks if the user enters an empty subject when prompted', () => {
    const response = execSync(
      `cd ${subdirPath} && printf "\n" | node ${ROOT_DIR}/bin/pclock.js add`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch(
      'enter subject for the new task (empty to exit without creating a task):'
    );
    expect(response).toMatch('exiting; no task to create');
    expectTaskIsNotCreated();
  });
});
