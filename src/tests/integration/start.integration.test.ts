import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import isValidTimestamp from '../common/timestamp';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import execute, { DOWN } from '../common/childProcessExecutor';
import { getTestTask, expectTaskMemberHasValue } from '../common/testTask';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'start';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Starting the clock', () => {
  const emptyTestFile = {
    projectName: PROJECT_NAME,
    tasks: [],
  };

  const singleTaskTestFile = {
    projectName: PROJECT_NAME,
    tasks: [
      {
        subject: 'completed task',
        begin: '2024-07-15T06:33:15.743Z',
        end: '2024-07-15T06:41:18.415Z',
      },
      {
        subject: TASK_SUBJECT,
      },
    ],
  };

  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function expectTaskIsStarted(index: number, subjectIsTimestamp = false) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const { subject, begin } = projectClockDataObj.tasks[index];
    const currentTimestamp = new Date().toISOString();
    if (subjectIsTimestamp) {
      expect(subject.substring(0, 15)).toEqual(
        currentTimestamp.substring(0, 15)
      );
    } else {
      expect(subject).toEqual(TASK_SUBJECT);
    }
    expect(begin).toBeDefined();
    if (begin) {
      expect(isValidTimestamp(begin)).toBeTruthy();
      expect(begin.substring(0, 15)).toEqual(currentTimestamp.substring(0, 15));
    }
  }

  function expectTaskIsNotStarted(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    expect(task?.begin).not.toBeDefined();
  }

  describe('User friendly error messages', () => {
    test('"Start" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      expect.hasAssertions();
      noTimesheetFile(testDirName, Command.Start);
    });

    test('"Start" command reports timesheet file errors in a user friendly manner; no permission', () => {
      expect.hasAssertions();
      noPermission(testDirName, Command.Start);
    });

    test('"Start" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
      expect.hasAssertions();
      moreThanOneTimesheetFile(testDirName, Command.Start);
    });

    test('"Start" command gives a user friendly error message when the command is force stopped with CTRL+C', async () => {
      expect.hasAssertions();
      await forceStopped(testDirName, Command.Start, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'startable task',
          },
          {
            subject: 'second startable task',
          },
        ],
      });
    });
  });

  describe('"Start" command without any arguments', () => {
    beforeEach(() => {
      createTestFile(emptyTestFile, testFilePath);
    });

    test('asks if user wants to create a new task (timesheet is empty)', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Do you want to create a new task?');
    });

    test('starts task correctly when default value (current timestamp as subject) is accepted', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['y\n', '\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Do you want to create a new task?');
      expect(response).toMatch('Enter subject for the task:');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(0, true);
    });

    test('starts task correctly when subject for the task is entered', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['y\n', `${TASK_SUBJECT}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Do you want to create a new task?');
      expect(response).toMatch('Enter subject for the task:');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(0);
    });

    test('does not create any tasks if user answers no (when timesheet is empty)', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Do you want to create a new task?');
      expect(response).toMatch('Nothing to start.');
      const testFileData = getTestFileDataObj(testFilePath);
      expect(testFileData).toEqual(emptyTestFile);
    });

    test('asks confirmation from user when there is a single unstarted task on the timesheet', async () => {
      // initialize test environment
      createTestFile(singleTaskTestFile, testFilePath);

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One unstarted task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Start this task?');
    });

    test('starts task correctly when the single unstarted task is confirmed to be correct', async () => {
      // initialize test environment
      createTestFile(singleTaskTestFile, testFilePath);

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One unstarted task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Start this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(1);
    });

    test('does not create any tasks when the user answers no (single task on timesheet)', async () => {
      // initialize test environment
      createTestFile(singleTaskTestFile, testFilePath);

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(`One unstarted task found: ${TASK_SUBJECT}`);
      expect(response).toMatch('Start this task?');
      expect(response).toMatch('Nothing to start.');
      const testFileData = getTestFileDataObj(testFilePath);
      expect(testFileData).toEqual(singleTaskTestFile);
    });

    test('asks which of the many unstarted tasks to start', () => {
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
            },
            {
              subject: 'other unstarted task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch('There are 2 unstarted tasks on the timesheet.');
      expect(response).toMatch('Select the task to start:');
    });

    test('there is correct number of options when the user is asked which of the many unstarted tasks found to start', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
            },
            {
              subject: 'first startable task',
            },
            {
              subject: 'second unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'third unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'second startable task',
            },
            {
              subject: 'fourth unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
            {
              subject: 'fifth unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
            {
              subject: 'sixth unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
              end: '2024-01-01T05:00:00.000Z',
            },
            {
              subject: 'seventh unstartable task',
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch('There are 2 unstarted tasks on the timesheet.');
      expect(response).toMatch('Select the task to start:');
      expect(response).toMatch('first startable task');
      expect(response).toMatch('second startable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unstartable task');
      expect(response).not.toMatch('second unstartable task');
      expect(response).not.toMatch('third unstartable task');
      expect(response).not.toMatch('fourth unstartable task');
      expect(response).not.toMatch('fifth unstartable task');
      expect(response).not.toMatch('sixth unstartable task');
      expect(response).not.toMatch('seventh unstartable task');
    });

    test('starts task correctly when the first of many unstarted tasks is selected', async () => {
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
            },
            {
              subject: 'other unstarted task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('There are 2 unstarted tasks on the timesheet.');
      expect(response).toMatch('Select the task to start:');
      expect(response).toMatch(`Started task '${TASK_SUBJECT}'.`);
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(1);
    });

    test('does not start a task when there are many unstarted tasks and the last option, "none", is selected', async () => {
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
            },
            {
              subject: 'other unstarted task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        [`${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('There are 2 unstarted tasks on the timesheet.');
      expect(response).toMatch('Select the task to start:');
      expect(response).toMatch('Nothing to start.');
      expectTaskIsNotStarted(TASK_SUBJECT);
    });

    test('does not create a new task when user tries to create a task that already exists', async () => {
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
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
          ['Y\n', `${TASK_SUBJECT}\n`],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `Cannot create a new task '${TASK_SUBJECT}'; the task already exists.`
      );
    });
  });

  describe('"Start" command with a task descriptor argument', () => {
    beforeEach(() => {
      createTestFile(emptyTestFile, testFilePath);
    });

    test('confirms whether a new task is created when timesheet is empty', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
    });

    test('creates task correctly when user answers yes and the timesheet is empty', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
      expect(response).toMatch(
        `Created and started a new task '${TASK_SUBJECT}'.`
      );
      const testFileData = getTestFileDataObj(testFilePath);
      expect(testFileData.tasks.length).toEqual(1);
      expect(testFileData.tasks[0].subject).toEqual(TASK_SUBJECT);
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(0);
    });

    test('does not create any tasks when user answers no and the timesheet is empty', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Timesheet is empty.');
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
      expect(response).toMatch('Nothing to start.');
      const testFileData = getTestFileDataObj(testFilePath);
      expect(testFileData).toEqual(emptyTestFile);
    });

    test('confirms whether a new task is created when matching task is not found', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: 'second task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
    });

    test('creates task correctly when matching task is not found and user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: 'second task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(2);
    });

    test('exits without creating a task when matching task is not found and user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: 'second task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch('Task descriptor argument received: Test task');
      expect(response).toMatch(
        'Do you want to create a new task with this task descriptor as its subject?'
      );
      const taskIsCreated = getTestTask(testFilePath);
      expect(taskIsCreated).toBeFalsy();
    });

    test('asks the user whether the single found unstarted task is the correct one', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: TASK_SUBJECT,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        `One matching unstarted task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Start this task?');
    });

    test('starts task correctly when single unstarted task is found and user answers yes', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: TASK_SUBJECT,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['y\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching unstarted task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Start this task?');
      expect(response).toMatch(`Project: ${PROJECT_NAME}`);
      expectTaskIsStarted(1);
    });

    test('exits without starting a task when single unstarted task is found and user answers no', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: TASK_SUBJECT,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      );
      expect(response).toMatch(
        `One matching unstarted task found: ${TASK_SUBJECT}`
      );
      expect(response).toMatch('Start this task?');
      expectTaskIsNotStarted(TASK_SUBJECT);
    });

    test('asks which of the many matching tasks to start', () => {
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
              subject: 'first matching task',
            },
            {
              subject: 'second matching task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "matching task"`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(
        'There are 2 matching unstarted tasks on the timesheet.'
      );
      expect(response).toMatch('Select the task to start:');
    });

    test('does not start a task if it is already started (and it has not been suspended)', () => {
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
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start "${TASK_SUBJECT}"`,
          { stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `Cannot start task '${TASK_SUBJECT}'; the task has already been started.`
      );
      expectTaskMemberHasValue(
        testFilePath,
        'begin',
        '2024-01-01T00:00:00.000Z'
      );
    });
  });
});
