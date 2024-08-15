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
import { createTestFile } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { expectTaskMemberHasValue, getTestTask } from '../common/testTask';
import execute, { DOWN } from '../common/childProcessExecutor';

const testDirName = 'testDirSuspend';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

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

  test('"Suspend" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
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
        ],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && printf '^C' | node ${ROOT_DIR}/bin/pclock.js suspend`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch('exiting; user force closed the process');
    expect(response).not.toMatch('throw');
    expect(response).not.toMatch('ProjectClockError');
  });

  test('"Suspend" command reports time sheet file errors in a user friendly manner; no time sheet file', () => {
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`, {
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

  test('"Suspend" command reports time sheet file errors in a user friendly manner; no permission', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );
    fs.chmodSync(testFilePath, '000');

    // test
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`, {
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
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no suspendable tasks found; nothing to suspend');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no suspendable tasks are found because the time sheet is empty', () => {
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
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('time sheet is empty, nothing to suspend');
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
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        `there is one suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
    });

    test('suspends the only suspendable task found if the user answers yes', () => {
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
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js suspend`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one suspendable task on the time sheet (${TASK_SUBJECT}); suspend this`
      );
      expectTaskIsSuspended();
    });

    test('exits without suspending any task if user answers no', () => {
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
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js suspend`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one suspendable task on the time sheet (${TASK_SUBJECT}); suspend this`
      );
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
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one suspendable task on the time sheet; select the task to'
      );
    });

    test('there is correct amount of options when the user is asked which of the many suspendable tasks found to suspend', () => {
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
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one suspendable task on the time sheet; select the task to'
      );
      expect(response).toMatch('first suspendable task');
      expect(response).toMatch('second suspendable task');
      expect(response).toMatch('third suspendable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unsuspendable task');
      expect(response).not.toMatch('second unsuspendable task');
      expect(response).not.toMatch('third unsuspendable task');
    });

    test('suspends correct task when the second of many suspendable tasks found is selected', async () => {
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
        [`${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one suspendable task on the time sheet; select the task to'
      );
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
        [`${DOWN}${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one suspendable task on the time sheet; select the task to'
      );
      expect(response).toMatch('nothing to suspend');
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${TASK_SUBJECT}'`,
          {
            stdio: 'pipe',
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't suspend task '${TASK_SUBJECT}'; the task hasn't been started yet`
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
    });

    test('suspends the correct task when a single matching suspendable task is found and the user answers yes', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
      expectTaskIsSuspended();
    });

    test('suspends the task even when the single matching suspendable task is a bit more complicated resumed task', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
      expectTaskIsSuspended();
    });

    test('suspends the task even when the single matching suspendable task is a simple stopped task', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
      expectTaskIsSuspended();
    });

    test('suspends the task even when the single matching suspendable task is a bit more complex stopped task', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
      expectTaskIsSuspended();
    });

    test('does not suspend any tasks when a single matching suspendable task is found and the user answers no', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js suspend ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching suspendable task on the time sheet (${TASK_SUBJECT}); suspend`
      );
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${matcher}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one matching suspendable task on the time sheet; select'
      );
    });

    test('there is correct amount of options when the user is asked which of the many suspendable tasks found to suspend', () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${matcher}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one matching suspendable task on the time sheet; select'
      );
      expect(response).toMatch('first suspendable task');
      expect(response).toMatch('second suspendable task');
      expect(response).toMatch('third suspendable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unsuspendable task');
      expect(response).not.toMatch('second unsuspendable task');
      expect(response).not.toMatch('third unsuspendable task');
    });

    test('suspends the correct task when there are many matching suspendable tasks and user selects the third one', async () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${matcher}'`,
        [`${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one matching suspendable task on the time sheet; select'
      );
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${matcher}'`,
        [`${DOWN}${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one matching suspendable task on the time sheet; select'
      );
      expect(response).toMatch('nothing to suspend');
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't suspend task '${TASK_SUBJECT}'; the task has already been suspended`
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't suspend task '${TASK_SUBJECT}'; the task has already been suspended`
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't suspend task '${TASK_SUBJECT}'; the task has already been suspended`
      );
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
        '2024-01-01T05:00:00.000Z',
      ]);
    });
  });
});
