import { execSync } from 'child_process';
import prettyAnsi from 'pretty-ansi';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
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

const testSuiteName = 'status';
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

describe('Status command', () => {
  describe('User friendly error messages', () => {
    test('"Status" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      expect.hasAssertions();
      noTimesheetFile(testDirName, Command.Status);
    });

    test('"Status" command reports timesheet file errors in a user friendly manner; no permission', () => {
      expect.hasAssertions();
      noPermission(testDirName, Command.Status);
    });

    test('"Status" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
      expect.hasAssertions();
      moreThanOneTimesheetFile(testDirName, Command.Status);
    });

    test('"Status" command with a faulty timesheet file returns a user friendly error message (no stack trace or source code paths)', async () => {
      expect.hasAssertions();
      await faultyTask(testDirName, Command.Status);
    });
  });

  describe('Correct output (FORCE_COLOR=0)', () => {
    test('"Status" command responds with correct output when there is a single timesheet file', () => {
      // initialize test environment
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
              subject: 'completed task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T04:00:00.000Z',
            },
            {
              subject: 'First active task',
              begin: twoHoursAgo,
            },
            {
              subject: 'Second active task',
              begin: twoHoursAgo,
            },
            {
              subject: 'Just a task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch('Tasks (complete/incomplete/total): 1/3/4');
      expect(response).toMatch('2 active tasks:');
      expect(response).toMatch(
        '  First active task                                    2h         started'
      );
      expect(response).toMatch(
        '  Second active task                                   2h         started'
      );
      expect(response).toMatch('Total time spent: 8h (1d, d=8h)');
    });

    test('"Status" command does not report active tasks or total time spent when there is neither', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch('Tasks (complete/incomplete/total): 0/1/1');
      expect(response).toMatch('No active tasks.');
      expect(response).not.toMatch(TASK_SUBJECT);
      expect(response).not.toMatch('total time spent:');
    });

    test('"Status" command does not print additional days-hours-and-minutes string when the total time spent is less than a day', () => {
      // initialize test environment
      const twoHoursAgo = new Date(
        new Date().getTime() - 120 * 60 * 1000
      ).toISOString();

      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T03:30:00.000Z',
            },
            {
              subject: 'First active task',
              begin: twoHoursAgo,
            },
            {
              subject: 'Second active task',
              begin: twoHoursAgo,
            },
            {
              subject: 'Just a task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch('Tasks (complete/incomplete/total): 1/3/4');
      expect(response).toMatch('2 active tasks:');
      expect(response).toMatch(
        '  First active task                                    2h         started'
      );
      expect(response).toMatch(
        '  Second active task                                   2h         started'
      );
      expect(response).toMatch('Total time spent: 7h 30min');
      expect(response).not.toMatch('Total time spent: 7h 30min (');
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
              subject: 'Started task',
              begin: twoHoursAgo,
            },
            {
              subject: 'Suspended task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'Resumed task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: [twoHoursAgo],
            },
          ],
        },
        testFilePath
      );
    });

    test('colors and stylings are displayed (FORCE_COLOR=1)', () => {
      const response = prettyAnsi(
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '1' },
        })
      );
      expect(response).toMatch(`<bold>Project:</intensity> '${PROJECT_NAME}'`);
      expect(response).toMatch(
        '<bold>Tasks (complete/incomplete/total):</intensity> 0/3/3'
      );
      expect(response).toMatch('<bold>3 active tasks:</intensity>');
      expect(response).toMatch(
        '<inverse><bold><green>Task                                                 </color></intensity></inverse><inverse><bold><green>Time       </color></intensity></inverse><inverse><bold><green>Status     </color></intensity></inverse>'
      );
    });

    test('correct status colors', () => {
      const response = prettyAnsi(
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '1' },
        })
      );
      expect(response).toMatch(
        '  Started task                                         <red>2h</color>         <red>started</color>'
      );
      expect(response).toMatch(
        '  Suspended task                                       <yellow>1h</color>         <yellow>suspended</color>'
      );
      expect(response).toMatch(
        '  Resumed task                                         <red>3h</color>         <red>resumed</color>'
      );
    });

    test('colors are not displayed when FORCE_COLOR=0', () => {
      const response = prettyAnsi(
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '0' },
        })
      );
      expect(response).not.toMatch('<bold>');
      expect(response).not.toMatch('</intensity>');
      expect(response).not.toMatch('<red>');
      expect(response).not.toMatch('<yellow>');
      expect(response).not.toMatch('</color>');
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch(
        '  Task                                                 Time       Status'
      );
    });
  });
});
