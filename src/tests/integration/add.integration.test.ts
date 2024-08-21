import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { expectTaskEqualsTo } from '../common/testTask';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'add';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

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
    noTimesheetFile(testDirName, Command.Add);
  });

  test('"Add" command reports timesheet file errors in a user friendly manner; no permission', () => {
    noPermission(testDirName, Command.Add);
  });

  test('"Add" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    moreThanOneTimesheetFile(testDirName, Command.Add);
  });

  test('"Add" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
    forceStopped(testDirName, Command.Add, {
      projectName: PROJECT_NAME,
      tasks: [],
    });
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
