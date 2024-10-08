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
import execute from '../common/childProcessExecutor';

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
    expect.hasAssertions();
    noTimesheetFile(testDirName, Command.Add);
  });

  test('"Add" command reports timesheet file errors in a user friendly manner; no permission', () => {
    expect.hasAssertions();
    noPermission(testDirName, Command.Add);
  });

  test('"Add" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    expect.hasAssertions();
    moreThanOneTimesheetFile(testDirName, Command.Add);
  });

  test('"Add" command gives a user friendly error message when the command is force stopped with CTRL+C', async () => {
    expect.hasAssertions();
    await forceStopped(testDirName, Command.Add, {
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
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add "${TASK_SUBJECT}"`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Created a new task '${TASK_SUBJECT}'.`);
    expectTaskIsCreated();
  });

  test('"Add" command prompts for the task subject when the taskSubject argument is not passed', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(
      'Enter subject for the new task (empty to exit without creating a task):'
    );
  });

  test('"Add" command creates task correctly when the task subject is entered through the prompt', async () => {
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`,
      [`${TASK_SUBJECT}\n`],
      { ...process.env, FORCE_COLOR: '0' }
    );
    expect(response).toMatch(
      'Enter subject for the new task (empty to exit without creating a task):'
    );
    expect(response).toMatch(`Created a new task '${TASK_SUBJECT}'`);
    expectTaskIsCreated();
  });

  test('"Add" command does not create any tasks if the user enters an empty subject when prompted', async () => {
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`,
      ['\n'],
      { ...process.env, FORCE_COLOR: '0' },
      true
    );
    expect(response).toMatch(
      'Enter subject for the new task (empty to exit without creating a task):'
    );
    expect(response).toMatch('Nothing to create.');
    expectTaskIsNotCreated();
  });
});
