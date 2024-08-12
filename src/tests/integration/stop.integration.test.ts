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
import { testTaskMemberHasValue } from '../common/testTask';

const testDirName = 'testDirStop';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

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

  function testTaskIsStopped(subject = TASK_SUBJECT) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const found = projectClockDataObj.tasks.find(
      (task) => task.subject === subject
    );
    const currentTimestamp = new Date().toISOString();
    expect(found?.subject).toEqual(subject);
    expect(found?.end).toBeDefined();
    if (found?.end) {
      expect(isValidTimestamp(found.end)).toBeTruthy();
      expect(found.end.substring(0, 15)).toEqual(
        currentTimestamp.substring(0, 15)
      );
    }
  }

  function testTaskIsNotStopped(subject = TASK_SUBJECT) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const found = projectClockDataObj.tasks.find(
      (task) => task.subject === subject
    );
    expect(found?.subject).toEqual(subject);
    expect(found?.end).not.toBeDefined();
  }

  test('"Stop" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
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
          },
        ],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && printf '^C' | node ${ROOT_DIR}/bin/pclock.js stop`,
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    expect(response).toMatch('exiting; user force closed the process');
    expect(response).not.toMatch('throw');
    expect(response).not.toMatch('ProjectClockError');
  });

  test('"Stop" command reports time sheet file errors in a user friendly manner; no time sheet file', () => {
    let error = '';
    try {
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`, {
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

  test('"Stop" command reports time sheet file errors in a user friendly manner; no permission', () => {
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
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`, {
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

    test('exits with an error when no active (started but not stopped) tasks are found', () => {
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
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no active tasks found; nothing to stop');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('asks user whether the only active (started but not stopped) task is to be stopped', () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        `there is one active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
    });

    test('stops the only active task if user answers yes', () => {
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
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsStopped();
    });

    test('exits without stopping any tasks if user answers no', () => {
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
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsNotStopped();
    });

    test('asks which of the many active tasks to stop', () => {
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
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one active task on the time sheet; select the task to'
      );
    });

    test('stops correct task when the first of many active tasks is selected', () => {
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
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js stop`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        'there are more than one active task on the time sheet; select the task to'
      );
      testTaskIsStopped('first active task');
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
      expect(response).toMatch(
        'there are more than one active task on the time sheet; select the task to'
      );
      expect(response).toMatch('nothing to stop');
      testTaskIsNotStopped(TASK_SUBJECT);
      testTaskIsNotStopped('other unstarted task');
    });
  });

  describe('"Stop" command with a task descriptor argument', () => {
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop ${TASK_SUBJECT}`,
          {
            stdio: 'pipe',
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no matching active tasks found');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('confirms whether the only matching task is to be stopped', () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
    });

    test('stops correct task when the user answers yes', () => {
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
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js stop ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsStopped();
    });

    test('exits without stopping any task when the user answers no', () => {
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
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js stop ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching active task on the time sheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsNotStopped();
    });

    test('asks which of many matching active tasks to stop', () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop ${matcher}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one matching active task on the time sheet; select the'
      );
    });

    test('stops correct task when first of many matching active tasks is selected', () => {
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
        `cd ${subdirPath} && printf '\n' | node ${ROOT_DIR}/bin/pclock.js stop ${matcher}`,
        {
          encoding: 'utf8',
          stdio: 'pipe',
        }
      );
      expect(response).toMatch(
        'there are more than one matching active task on the time sheet; select the'
      );
      testTaskIsStopped('first active task');
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop ${matcher}`,
        [`${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one matching active task on the time sheet; select the'
      );
      testTaskIsNotStopped('first active task');
      testTaskIsNotStopped('second active task');
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't stop task '${TASK_SUBJECT}'; the task has already been stopped`
      );
      testTaskMemberHasValue(testFilePath, 'end', '2024-01-01T01:00:00.000Z');
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
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't stop task '${TASK_SUBJECT}'; the task hasn't been started yet`
      );
      testTaskMemberHasValue(testFilePath, 'end', undefined);
    });
  });
});
