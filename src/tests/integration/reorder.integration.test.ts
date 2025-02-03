import prettyAnsi from 'pretty-ansi';
import { PROJECT_NAME, ROOT_DIR } from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile } from '../common/testFile';
import {
  Command,
  emptyTimesheetFile,
  faultyTask,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';
import execute, {
  DOWN,
  SHIFT_AND_DOWN,
  SHIFT_AND_UP,
  SPACE,
  UP,
} from '../common/childProcessExecutor';

const testSuiteName = 'reorder';
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
  test('"Reorder" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
    expect.hasAssertions();
    noTimesheetFile(testDirName, Command.Reorder);
  });

  test('"Reorder" command reports timesheet file errors in a user friendly manner; no permission', () => {
    expect.hasAssertions();
    noPermission(testDirName, Command.Reorder);
  });

  test('"Reorder" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    expect.hasAssertions();
    moreThanOneTimesheetFile(testDirName, Command.Reorder);
  });

  test('"Reorder" command reports timesheet file errors in a user friendly manner; faulty task', async () => {
    expect.hasAssertions();
    await faultyTask(testDirName, Command.Reorder);
  });

  test('"Reorder" command gives a user friendly error message when the command is force stopped with CTRL+C', async () => {
    expect.hasAssertions();
    await forceStopped(testDirName, Command.Reorder, {
      projectName: PROJECT_NAME,
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
      ],
    });
  });

  test('"Reorder" command reports timesheet file errors in a user friendly manner; timesheet file is empty', async () => {
    expect.hasAssertions();
    emptyTimesheetFile(testDirName, Command.Reorder);
  });
});

describe('"Reorder" command', () => {
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

  test('displays correct items', async () => {
    expect.hasAssertions();
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js reorder`,
      ['\n'],
      { ...process.env, FORCE_COLOR: '0' }
    );

    expect(prettyAnsi(response)).toMatchSnapshot();
  });

  test('reorders tasks correctly', async () => {
    expect.hasAssertions();
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js reorder`,
      [
        SHIFT_AND_DOWN,
        DOWN,
        DOWN,
        SHIFT_AND_UP,
        UP,
        SPACE,
        UP,
        SPACE,
        'b',
        'm',
        '\n',
      ],
      { ...process.env, FORCE_COLOR: '0' }
    );

    expect(prettyAnsi(response)).toMatchSnapshot();
  });
});
