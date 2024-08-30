import { execSync } from 'child_process';
import prettyAnsi from 'pretty-ansi';
import { PROJECT_NAME, ROOT_DIR } from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile } from '../common/testFile';
import {
  Command,
  faultyTask,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'list';
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
  test('"List" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
    expect.hasAssertions();
    noTimesheetFile(testDirName, Command.List);
  });

  test('"List" command reports timesheet file errors in a user friendly manner; no permission', () => {
    expect.hasAssertions();
    noPermission(testDirName, Command.List);
  });

  test('"List" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    expect.hasAssertions();
    moreThanOneTimesheetFile(testDirName, Command.List);
  });

  test('"List" command reports timesheet file errors in a user friendly manner; faulty task', async () => {
    expect.hasAssertions();
    await faultyTask(testDirName, Command.List);
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
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First completed task1hcompleted');
    expect(response).toMatch('Second completed task2hcompleted');
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task1h 30minsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch('First incomplete but not active task-unstarted');
    expect(response).toMatch('6 tasks, total time spent: 7h 30min');
    expect(response).not.toMatch('6 tasks, total time spent: 7h 30min (');
  });

  test('"List" command without -v flag does not print seconds', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).not.toMatch(/\d+s{/);
  });

  test('"List" command with -a parameter lists just the active tasks', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -a`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
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
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
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
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task1h 30minsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch('First incomplete but not active task-unstarted');
    expect(response).toMatch('4 tasks, total time spent: 4h 30min');
    expect(response).not.toMatch('4 tasks, total time spent: 4h 30min (');
  });

  test('"List" command with -n flag prints just the task that has not been started', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list -n`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First incomplete but not active task-unstarted');
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
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('First completed task1hcompleted');
    expect(response).toMatch('Second completed task2hcompleted');
    expect(response).toMatch('First active task1hsuspended');
    expect(response).toMatch('Second active task2hsuspended');
    expect(response).toMatch('Third active task2hstarted');
    expect(response).toMatch('First incomplete but not active task-unstarted');
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
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('no tasks to list');
  });
});

describe('Colors and stylings', () => {
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
            subject: 'Unstarted task',
          },
          {
            subject: 'Started task',
            begin: twoHoursAgo,
          },
          {
            subject: 'Completed task',
            begin: '2024-01-01T00:00:00.000Z',
            end: '2024-01-01T01:00:00.000Z',
          },
          {
            subject: 'Suspended task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T01:00:00.000Z'],
          },
          {
            subject: 'Resumed task',
            begin: '2024-01-01T01:00:00.000Z',
            suspend: ['2024-01-01T02:00:00.000Z'],
            resume: [twoHoursAgo],
          },
        ],
      },
      testFilePath
    );
  });

  test('colors are displayed (FORCE_COLOR=1)', () => {
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '1' },
      })
    );
    expect(response).toMatch(`<bold>Project:</intensity> '${PROJECT_NAME}'`);
    expect(response).toMatch(
      '<inverse><bold><green>Task</color></intensity></inverse><inverse><bold><green>Time</color></intensity></inverse><inverse><bold><green>Status</color></intensity></inverse>'
    );
  });

  test('correct status colors', () => {
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '1' },
      })
    );
    expect(response).toMatch(
      'Unstarted task<blue>-</color><blue>unstarted</color>'
    );
    expect(response).toMatch('Started task<red>2h</color><red>started</color>');
    expect(response).toMatch(
      'Completed task<green>1h</color><green>completed</color>'
    );
    expect(response).toMatch(
      'Suspended task<yellow>1h</color><yellow>suspended</color>'
    );
    expect(response).toMatch('Resumed task<red>3h</color><red>resumed</color>');
  });

  test('colors are not displayed when FORCE_COLOR=0', () => {
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js list`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).not.toMatch('<bold>');
    expect(response).not.toMatch('</intensity>');
    expect(response).not.toMatch('<red>');
    expect(response).not.toMatch('<green>');
    expect(response).not.toMatch('<yellow>');
    expect(response).not.toMatch('<blue>');
    expect(response).not.toMatch('</color>');
    expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
    expect(response).toMatch('TaskTimeStatus');
  });
});
