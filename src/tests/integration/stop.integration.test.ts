import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile } from '../common/testFile';
import isValidTimestamp from '../common/timestamp';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import execute, { DOWN } from '../common/childProcessExecutor';
import { expectTaskMemberHasValue, getTestTask } from '../common/testTask';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'stop';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Stopping the clock', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function expectTaskIsStopped(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    const currentTimestamp = new Date().toISOString();
    expect(task?.subject).toEqual(subject);
    expect(task?.end).toBeDefined();
    if (task?.end) {
      expect(isValidTimestamp(task.end)).toBeTruthy();
      expect(task.end.substring(0, 15)).toEqual(
        currentTimestamp.substring(0, 15)
      );
    }
  }

  function expectTaskIsNotStopped(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    expect(task?.end).not.toBeDefined();
  }

  describe('User friendly error messages', () => {
    test('"Stop" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      expect.hasAssertions();
      noTimesheetFile(testDirName, Command.Stop);
    });

    test('"Stop" command reports timesheet file errors in a user friendly manner; no permission', () => {
      expect.hasAssertions();
      noPermission(testDirName, Command.Stop);
    });

    test('"Stop" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
      expect.hasAssertions();
      moreThanOneTimesheetFile(testDirName, Command.Stop);
    });

    test('"Stop" command gives a user friendly error message when the command is force stopped with CTRL+C', async () => {
      expect.hasAssertions();
      await forceStopped(testDirName, Command.Stop, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'stoppable task',
            begin: '2024-01-01T00:00:00.000Z',
          },
          {
            subject: 'second stoppable task',
            begin: '2024-01-01T00:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('"Stop" command without any arguments', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );
    });

    test('exits with an error when no active tasks are found', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`, {
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no active tasks found; nothing to stop');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no active tasks are found because the timesheet is empty', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`, {
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('timesheet is empty, nothing to stop');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('asks user whether the only active (started but not stopped) task is to be stopped', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One active task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Stop this task?');
    });

    test('stops the only active task if user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One active task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Stop this task?');
      expectTaskIsStopped();
    });

    test('exits without stopping any tasks if user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One active task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Stop this task?');
      expectTaskIsNotStopped();
    });

    test('asks which of the many active tasks to stop', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'third stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch('There are 3 active tasks on the timesheet.');
      expect(response).toMatch('Select the task to stop:');
    });

    test('there is correct number of options when the user is asked which of the many active tasks found to stop', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'first unstoppable task',
            },
            {
              subject: 'second stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'second unstoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
              end: '2024-01-01T05:00:00.000Z',
            },
            {
              subject: 'third stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'fourth stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'fifth stoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
            {
              subject: 'third unstoppable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch('There are 5 active tasks on the timesheet.');
      expect(response).toMatch('Select the task to stop:');
      expect(response).toMatch('first stoppable task');
      expect(response).toMatch('second stoppable task');
      expect(response).toMatch('third stoppable task');
      expect(response).toMatch('fourth stoppable task');
      expect(response).toMatch('fifth stoppable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unstoppable task');
      expect(response).not.toMatch('second unstoppable task');
      expect(response).not.toMatch('third unstoppable task');
    });

    test('stops correct task when first of many active tasks is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first active task',
              begin: new Date().toISOString(),
            },
            {
              subject: 'second active task',
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        ['\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('There are 2 active tasks on the timesheet.');
      expect(response).toMatch('Select the task to stop:');
      expectTaskIsStopped('first active task');
    });

    test('does not stop any tasks when option "none" is selected instead of one of the many active tasks', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-07-15T06:33:15.743Z',
              end: '2024-07-15T06:41:18.415Z',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'other unstarted task',
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        [`${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch('There are 2 active tasks on the timesheet.');
      expect(response).toMatch('Select the task to stop:');
      expect(response).toMatch('Nothing to stop');
      expectTaskIsNotStopped(TASK_SUBJECT);
      expectTaskIsNotStopped('other unstarted task');
    });
  });

  describe('"Stop" command with a task descriptor argument', () => {
    test('exits with an error when no matching active task is found', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
          { stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no matching active tasks found');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('confirms whether the only matching task is to be stopped', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        `One matching active task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Stop this task?');
    });

    test('stops the correct task when the user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching active task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Stop this task?');
      expectTaskIsStopped();
    });

    test('exits without stopping any task when the user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: TASK_SUBJECT,
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching active task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Stop this task?');
      expectTaskIsNotStopped();
    });

    test('asks which of the many matching active tasks to stop', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: 'first active task',
              begin: new Date().toISOString(),
            },
            {
              subject: 'second active task',
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'active task';
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${matcher}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'There are 2 matching active tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to stop:');
    });

    test('stops correct task when first of many matching active tasks is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: 'first active task',
              begin: new Date().toISOString(),
            },
            {
              subject: 'second active task',
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'active task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${matcher}"`,
        ['\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 2 matching active tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to stop:');
      expectTaskIsStopped('first active task');
    });

    test('does not stop any tasks when option "none" is selected instead of one of the active tasks', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: 'first active task',
              begin: new Date().toISOString(),
            },
            {
              subject: 'second active task',
              begin: new Date().toISOString(),
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'active task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${matcher}"`,
        [`${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 2 matching active tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to stop:');
      expectTaskIsNotStopped('first active task');
      expectTaskIsNotStopped('second active task');
    });

    test('does not stop an already stopped task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `cannot stop task '${TASK_SUBJECT}'; the task has already been stopped`
      );
      expectTaskMemberHasValue(testFilePath, 'end', '2024-01-01T01:00:00.000Z');
    });

    test('does not stop a task that has not been started yet', () => {
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
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop "${TASK_SUBJECT}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `cannot stop task '${TASK_SUBJECT}'; the task hasn't been started yet`
      );
      expectTaskMemberHasValue(testFilePath, 'end', undefined);
    });
  });
});
