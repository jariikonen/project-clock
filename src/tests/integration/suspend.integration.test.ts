import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { expectTaskMemberHasValue, getTestTask } from '../common/testTask';
import execute, { DOWN } from '../common/childProcessExecutor';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'suspend';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Suspend command', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function expectTaskIsSuspended(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    expect(task?.end).not.toBeDefined();
    expect(task?.suspend).toBeDefined();
    if (task?.resume) {
      expect(task?.suspend?.length).toBeGreaterThan(task.resume.length);
    }
  }

  function expectTaskIsNotSuspended(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    if (task?.suspend && task?.resume && !task.end) {
      expect(task.suspend?.length).toEqual(task?.resume?.length);
    } else if (task && !task.end) {
      expect(task?.suspend).not.toBeDefined();
    }
  }

  describe('User friendly error messages', () => {
    test('"Suspend" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      expect.hasAssertions();
      noTimesheetFile(testDirName, Command.Suspend);
    });

    test('"Suspend" command reports timesheet file errors in a user friendly manner; no permission', () => {
      expect.hasAssertions();
      noPermission(testDirName, Command.Suspend);
    });

    test('"Suspend" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
      expect.hasAssertions();
      moreThanOneTimesheetFile(testDirName, Command.Suspend);
    });

    test('"Suspend" command gives a user friendly error message when the command is force stopped with CTRL+C', async () => {
      expect.hasAssertions();
      await forceStopped(testDirName, Command.Suspend, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'first suspendable task',
            begin: '2024-01-01T00:00:00.000Z',
          },
          {
            subject: 'second suspendable task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T01:00:00.000Z'],
            resume: ['2024-01-01T02:00:00.000Z'],
          },
        ],
      });
    });
  });

  describe('"Suspend" command without any arguments', () => {
    test('exits with an error when no suspendable tasks are found', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unsuspendable task',
            },
            {
              subject: 'second unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`, {
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('No suspendable tasks found; nothing to suspend.');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no suspendable tasks are found because the timesheet is empty', () => {
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
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`, {
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('Timesheet is empty, nothing to suspend.');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('confirms from the user whether the only suspendable task found is the one to suspend', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(`One suspendable task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Suspend this task?');
    });

    test('suspends the only suspendable task found correctly if the user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One suspendable task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Suspend this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended();
    });

    test('exits without suspending any task if user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One suspendable task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Suspend this task?');
      expectTaskIsNotSuspended();
    });

    test('asks from the user which of the many suspendable tasks found to suspend', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'There are 3 suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
    });

    test('there is correct amount of options when the user is asked which of the many tasks found to suspend', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'second unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'third unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'There are 3 suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch('first suspendable task');
      expect(response).toMatch('second suspendable task');
      expect(response).toMatch('third suspendable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unsuspendable task');
      expect(response).not.toMatch('second unsuspendable task');
      expect(response).not.toMatch('third unsuspendable task');
    });

    test('suspends the task correctly when the second of many suspendable tasks found is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        [`${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 3 suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended('second suspendable task');
    });

    test('does not suspend any tasks when option "none" is selected instead of one of the many suspendable tasks', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        [`${DOWN}${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 3 suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch('Nothing to suspend');
      expectTaskIsNotSuspended('first suspendable task');
      expectTaskIsNotSuspended('second suspendable task');
      expectTaskIsNotSuspended('third suspendable task');
    });
  });

  describe('"Suspend" command with a task descriptor argument', () => {
    test('exits with an error when no matching suspendable task is found', () => {
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
          { stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `Cannot suspend task '${TASK_SUBJECT}'; the task hasn't been started yet.`
      );
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('asks the user whether the single found suspendable task is the correct one', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
    });

    test('suspends the task correctly when a single matching suspendable task is found and the user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'another unsuspendable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended();
    });

    test('suspends the task correctly even when the single matching suspendable task is a bit more complicated resumed task', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
            {
              subject: 'another unsuspendable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended();
    });

    test('suspends the task correctly even when the single matching suspendable task is a simple stopped task', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
            {
              subject: 'another unsuspendable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended();
    });

    test('suspends the task correctly even when the single matching suspendable task is a bit more complex stopped task', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
              end: '2024-01-01T05:00:00.000Z',
            },
            {
              subject: 'another unsuspendable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended();
    });

    test('does not suspend any tasks when a single matching suspendable task is found and the user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'another unsuspendable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching suspendable task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Suspend this task?');
      expectTaskIsNotSuspended();
    });

    test('asks which of the many matching suspendable tasks to start', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unsuspendable task',
            },
            {
              subject: 'suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'another suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'suspendable task';
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${matcher}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'There are 2 matching suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
    });

    test('there is correct number of options when the user is asked which of the many tasks found to suspend', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'second unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'third unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'suspendable task';
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${matcher}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'There are 3 matching suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch('first suspendable task');
      expect(response).toMatch('second suspendable task');
      expect(response).toMatch('third suspendable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unsuspendable task');
      expect(response).not.toMatch('second unsuspendable task');
      expect(response).not.toMatch('third unsuspendable task');
    });

    test('suspends the task correctly when there are many matching suspendable tasks and user selects the third one', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'second unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'third unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'suspendable task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${matcher}"`,
        [`${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 3 matching suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsSuspended('third suspendable task');
    });

    test('does not suspend any tasks when there are many matching suspendable tasks and option "none" is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'first suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'second suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'second unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'third suspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'third unsuspendable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const matcher = 'suspendable task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${matcher}"`,
        [`${DOWN}${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        'There are 3 matching suspendable tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to suspend:');
      expect(response).toMatch('Nothing to suspend');
      expectTaskIsNotSuspended('first suspendable task');
      expectTaskIsNotSuspended('second suspendable task');
      expectTaskIsNotSuspended('third suspendable task');
      expectTaskMemberHasValue(
        testFilePath,
        'suspend',
        ['2024-01-01T01:00:00.000Z'],
        'first unsuspendable task'
      );
      expectTaskMemberHasValue(
        testFilePath,
        'suspend',
        ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
        'second unsuspendable task'
      );
      expectTaskMemberHasValue(
        testFilePath,
        'suspend',
        [
          '2024-01-01T01:00:00.000Z',
          '2024-01-01T03:00:00.000Z',
          '2024-01-01T05:00:00.000Z',
        ],
        'third unsuspendable task'
      );
    });

    test('does not suspend a task if it is already suspended', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
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
        `Cannot suspend task '${TASK_SUBJECT}'; the task has already been suspended.`
      );
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
      ]);
    });

    test('does not suspend a bit more complicated already suspended task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
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
        `Cannot suspend task '${TASK_SUBJECT}'; the task has already been suspended.`
      );
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
      ]);
    });

    test('does not suspend an even more complicated already suspended task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend "${TASK_SUBJECT}"`,
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
        `Cannot suspend task '${TASK_SUBJECT}'; the task has already been suspended.`
      );
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
        '2024-01-01T05:00:00.000Z',
      ]);
    });
  });
});
