import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TASK_SUBJECT,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import isValidTimestamp from '../common/timeStamp';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import execute, { DOWN } from '../common/childProcessExecutor';
import { getTestTask, testTaskMemberHasValue } from '../common/testTask';

const testDirName = 'testDirStart';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Starting the clock', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function testTaskIsStarted(index: number, subjectIsTimestamp = false) {
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

  function testTaskIsNotStarted(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    expect(task?.begin).not.toBeDefined();
  }

  test('"Start" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: TASK_SUBJECT,
          },
          {
            subject: 'second unstarted task',
          },
        ],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && printf '^C' | node ${ROOT_DIR}/bin/pclock.js start`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch('exiting; user force closed the process');
    expect(response).not.toMatch('throw');
    expect(response).not.toMatch('ProjectClockError');
  });

  test('"Start" command reports time sheet file errors in a user friendly manner; no time sheet file', () => {
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(
      'An error occurred while reading the time sheet file (no time sheet file in the directory)'
    );
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');
  });

  test('"Start" command reports time sheet file errors in a user friendly manner; no permission', () => {
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
    fs.chmodSync(testFilePath, '000');

    // test
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`, {
        stdio: 'pipe',
      });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(
      'An error occurred while reading the time sheet file'
    );
    expect(error).toMatch('no permission');
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');
  });

  describe('"Start" command without any arguments', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );
    });

    test('asks if user wants to create a new task (no tasks on the time sheet)', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch('do you want to create a new task?');
    });

    test('starts correct task when default value (current timestamp as subject) is accepted', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['y\n', '\n']
      );
      expect(response).toMatch('do you want to create a new task?');
      expect(response).toMatch('enter subject for the task:');

      testTaskIsStarted(0, true);
    });

    test('starts correct task when subject for the task is entered', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        ['y\n', `${TASK_SUBJECT}\n`]
      );
      expect(response).toMatch('do you want to create a new task?');
      expect(response).toMatch('enter subject for the task');
      testTaskIsStarted(0);
    });

    test('asks confirmation from user when there is a single unstarted task on the time sheet', () => {
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
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        `there is one unstarted task on the time sheet (${TASK_SUBJECT}); start this task`
      );
    });

    test('starts correct task when the single unstarted task is confirmed as desired', () => {
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
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        `there is one unstarted task on the time sheet (${TASK_SUBJECT}); start this task`
      );
      testTaskIsStarted(1);
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
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        'there are more than one unstarted task on the time sheet; select the task to'
      );
    });

    test('starts correct task when the first of many unstarted tasks is selected', () => {
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
        `cd ${subdirPath} && printf '\n' | node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        'there are more than one unstarted task on the time sheet; select the task to'
      );
      expect(response).toMatch(`started task '${TASK_SUBJECT}'`);
      testTaskIsStarted(1);
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
        [`${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one unstarted task on the time sheet; select the task to'
      );
      expect(response).toMatch('nothing to start');
      testTaskIsNotStarted(TASK_SUBJECT);
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
          ['Y\n', `${TASK_SUBJECT}\n`]
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't create new task '${TASK_SUBJECT}'; the task already exists`
      );
    });
  });

  describe('"Start" command with a task descriptor argument', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `no matching unstarted task found; create a new task, '${TASK_SUBJECT}'?`
      );
    });

    test('creates correct task when matching task is not found and user answers yes', () => {
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
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `no matching unstarted task found; create a new task, '${TASK_SUBJECT}'?`
      );
      testTaskIsStarted(2);
    });

    test('exits without creating a task when matching task is not found and user answers no', () => {
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
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `no matching unstarted task found; create a new task, '${TASK_SUBJECT}'?`
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching unstarted task on the time sheet (${TASK_SUBJECT}); start this`
      );
    });

    test('starts correct task when single unstarted task is found and user answers yes', () => {
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
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching unstarted task on the time sheet (${TASK_SUBJECT}); start this`
      );
      testTaskIsStarted(1);
    });

    test('exits without starting a task when single unstarted task is found and user answers no', () => {
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
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching unstarted task on the time sheet (${TASK_SUBJECT}); start this`
      );
      testTaskIsNotStarted(TASK_SUBJECT);
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start 'matching task'`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        'there are more than one matching unstarted task on the time sheet; select the'
      );
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start '${TASK_SUBJECT}'`,
          { stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't start task '${TASK_SUBJECT}'; the task has already been started`
      );
      testTaskMemberHasValue(testFilePath, 'begin', '2024-01-01T00:00:00.000Z');
    });
  });
});
