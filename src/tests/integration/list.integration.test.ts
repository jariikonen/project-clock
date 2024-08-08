import { execSync } from 'child_process';
import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile } from '../common/testFile';

const testDirName = 'testDirList';
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
  test('"List" command without a time sheet file returns a user friendly error message (no stack trace or source code paths)', () => {
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        stdio: 'pipe',
      });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch('no time sheet file in the directory');
    expect(error).not.toMatch('throw');
  });

  test('"List" command with more than one time sheet returns a user friendly error message (no stack trace or source code paths)', () => {
    // initialize test environment
    const testFilePath2 = path.join(
      subdirPath,
      'secondTestProject.pclock.json'
    );
    createTestFile(
      {
        projectName: 'first test project',
        tasks: [
          {
            subject: 'just a task',
          },
        ],
      },
      testFilePath
    );
    createTestFile(
      {
        projectName: 'second test project',
        tasks: [
          {
            subject: 'just a task',
          },
        ],
      },
      testFilePath2
    );

    // test
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        stdio: 'pipe',
      });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch('more than one time sheet file in the directory');
    expect(error).not.toMatch('throw');
  });

  test('"List" command with a faulty time sheet file returns a user friendly error message (no stack trace or source code paths)', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: 'first test project',
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
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        stdio: 'pipe',
      });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(
      "An error occurred while inspecting the time sheet file (invalid time period '2024-01-01T01:00:00.000Z' => '2024-01-01T00:00:00.000Z' (faulty task); start date is later than end date)"
    );
    expect(error).not.toMatch('throw');
  });
});

describe('Correct output; many tasks, total time less than a day', () => {
  beforeEach(() => {
    const twoHoursAgo = new Date(
      new Date().getTime() - 120 * 60 * 1000
    ).toISOString();

    createTestFile(
      {
        projectName: PROJECT_NAME,
        projectSettings: {
          timeParams: {
            day: 8,
            week: 5,
            month: 20,
            year: 260,
          },
        },
        tasks: [
          {
            subject: 'First completed task',
            begin: '2024-01-01T00:00:00.000Z',
            end: '2024-01-01T01:00:00.000Z',
          },
          {
            subject: 'Second completed task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T01:00:00.000Z'],
            resume: ['2024-01-01T02:00:00.000Z'],
            end: '2024-01-01T03:00:00.000Z',
          },
          {
            subject: 'First active task',
            begin: '2024-01-01T01:00:00.000Z',
            suspend: ['2024-01-01T02:00:00.000Z'],
          },
          {
            subject: 'Second active task',
            begin: '2024-01-01T02:00:00.000Z',
            suspend: ['2024-01-01T03:00:00.000Z', '2024-01-01T04:30:00.000Z'],
            resume: ['2024-01-01T04:00:00.000Z'],
          },
          {
            subject: 'Third active task',
            begin: twoHoursAgo,
          },
          {
            subject: 'First incomplete but not active task',
          },
        ],
      },
      testFilePath
    );
  });

  test('"List" command with no arguments prints correct output', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First completed task1hcompleted');
    expect(response).toMatch('Second completed task2hcompleted');
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task1h 30minsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch(
      'First incomplete but not active task-not started'
    );
    expect(response).toMatch('6 tasks, total time spent: 7h 30min');
    expect(response).not.toMatch('6 tasks, total time spent: 7h 30min (');
  });

  test('"List" command without -v flag does not print seconds', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`,
      { encoding: 'utf8' }
    );
    expect(response).not.toMatch(/\d+s{/);
  });

  test('"List" command with -a parameter lists just the active tasks', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -a`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task1h 30minsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch('3 tasks, total time spent: 4h 30min');
    expect(response).not.toMatch('3 tasks, total time spent: 4h 30min (');
  });

  test('"List" command with -c flag lists just the completed tasks', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -c`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First completed task1hcompleted');
    expect(response).toMatch('Second completed task2hcompleted');
    expect(response).toMatch('2 tasks, total time spent: 3h');
    expect(response).not.toMatch('2 tasks, total time spent: 3h (');
  });

  test('"List" command with -i flag prints just the incomplete tasks', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -i`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task1h 30minsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch(
      'First incomplete but not active task-not started'
    );
    expect(response).toMatch('4 tasks, total time spent: 4h 30min');
    expect(response).not.toMatch('4 tasks, total time spent: 4h 30min (');
  });

  test('"List" command with -n flag prints just the task that has not been started', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -n`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch(
      'First incomplete but not active task-not started'
    );
    expect(response).toMatch('1 task, total time spent: -');
    expect(response).not.toMatch('1 task, total time spent: - (');
  });
});

describe('Correct output; many tasks, total time more than a day', () => {
  beforeEach(() => {
    const twoHoursAgo = new Date(
      new Date().getTime() - 120 * 60 * 1000
    ).toISOString();

    createTestFile(
      {
        projectName: PROJECT_NAME,
        projectSettings: {
          timeParams: {
            day: 8,
            week: 5,
            month: 20,
            year: 260,
          },
        },
        tasks: [
          {
            subject: 'First completed task',
            begin: '2024-01-01T00:00:00.000Z',
            end: '2024-01-01T01:00:00.000Z',
          },
          {
            subject: 'Second completed task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T01:00:00.000Z'],
            resume: ['2024-01-01T02:00:00.000Z'],
            end: '2024-01-01T03:00:00.000Z',
          },
          {
            subject: 'First active task',
            begin: '2024-01-01T01:00:00.000Z',
            suspend: ['2024-01-01T02:00:00.000Z'],
          },
          {
            subject: 'Second active task',
            begin: '2024-01-01T02:00:00.000Z',
            suspend: ['2024-01-01T03:00:00.000Z', '2024-01-01T05:00:00.000Z'],
            resume: ['2024-01-01T04:00:00.000Z'],
          },
          {
            subject: 'Third active task',
            begin: twoHoursAgo,
          },
          {
            subject: 'First incomplete but not active task',
          },
        ],
      },
      testFilePath
    );
  });

  test('"List" command with no arguments prints correct output', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First completed task1hcompleted');
    expect(response).toMatch('Second completed task2hcompleted');
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task2hsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch(
      'First incomplete but not active task-not started'
    );
    expect(response).toMatch('6 tasks, total time spent: 8h (1d, d=8h)');
  });
});

describe('Correct output; no tasks to list', () => {
  test('"List" command with no arguments prints correct output', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        projectSettings: {
          timeParams: {
            day: 8,
            week: 5,
            month: 20,
            year: 260,
          },
        },
        tasks: [],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('no tasks to list');
  });
});
