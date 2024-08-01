import { execSync } from 'child_process';
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

const testDirName = 'testDirStartingAndStopping';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Starting and stopping the clock (when there is a timesheet)', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function testTaskIsNotCreated(subject = TASK_SUBJECT) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const found = projectClockDataObj.tasks.find(
      (task) => task.subject === subject
    );
    expect(found).toBeFalsy();
  }

  describe('Starting the clock', () => {
    function testTaskIsStarted(index: number, subjectIsTimestamp = false) {
      const currentTimestamp = new Date().toISOString();
      const projectClockDataObj = getTestFileDataObj(testFilePath);
      const { subject, begin } = projectClockDataObj.tasks[index];
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
        expect(begin.substring(0, 15)).toEqual(
          currentTimestamp.substring(0, 15)
        );
      }
    }

    function testTaskIsNotStarted(subject = TASK_SUBJECT) {
      const projectClockDataObj = getTestFileDataObj(testFilePath);
      const found = projectClockDataObj.tasks.find(
        (task) => task.subject === subject
      );
      expect(found?.subject).toEqual(subject);
      expect(found?.begin).not.toBeDefined();
    }

    test('"Start" command without any arguments asks user subject for the task (no tasks on the timesheet)', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch('enter subject for the task');
    });

    test('"Start" command without any arguments starts correct task when default value (current timestamp as subject) is accepted', () => {
      const response = execSync(
        `cd ${subdirPath} && printf '\n' | node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch('enter subject for the task');

      testTaskIsStarted(0, true);
    });

    test('"Start" command without any arguments starts correct task when subject for the task is entered', () => {
      const response = execSync(
        `cd ${subdirPath} && echo '${TASK_SUBJECT}' | node ${ROOT_DIR}/bin/pclock.js start`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch('enter subject for the task');
      testTaskIsStarted(0);
    });

    test('"Start" command without any arguments asks confirmation from user when there is a single unstarted task on the timesheet', () => {
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
        `there is one unstarted task on the timesheet (${TASK_SUBJECT}); start this task`
      );
    });

    test('"Start" command without any arguments starts correct task when the single unstarted task is confirmed as desired', () => {
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
        `there is one unstarted task on the timesheet (${TASK_SUBJECT}); start this task`
      );
      testTaskIsStarted(1);
    });

    test('"Start" command without any arguments asks which of the many unstarted tasks to start', () => {
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
        'there are more than one unstarted task on the timesheet; select the task to'
      );
    });

    test('"Start" command without any arguments starts correct task when the first of many unstarted tasks is selected', () => {
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
        'there are more than one unstarted task on the timesheet; select the task to'
      );
      expect(response).toMatch(`started task '${TASK_SUBJECT}'`);
      testTaskIsStarted(1);
    });

    test('"Start" command with task descriptor argument confirms whether a new task is created when matching task is not found', () => {
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
        `no matching unstarted task found; create a new task '${TASK_SUBJECT}'`
      );
    });

    test('"Start" command with task descriptor argument creates correct task when matching task is not found and user answers yes', () => {
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
        `no matching unstarted task found; create a new task '${TASK_SUBJECT}'`
      );
      testTaskIsStarted(2);
    });

    test('"Start" command with a task descriptor argument exits without creating a task when matching task is not found and user answers no', () => {
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
        `no matching unstarted task found; create a new task '${TASK_SUBJECT}'`
      );
      testTaskIsNotCreated();
    });

    test('"Start" command with a task descriptor argument asks the user whether the single found unstarted task is the correct one', () => {
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
        `there is one matching unstarted task on the timesheet (${TASK_SUBJECT}); start this`
      );
    });

    test('"Start" command with a task descriptor argument starts correct task when single unstarted task is found and user answers yes', () => {
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
        `there is one matching unstarted task on the timesheet (${TASK_SUBJECT}); start this`
      );
      testTaskIsStarted(1);
    });

    test('"Start" command with a task descriptor argument exits without starting a task when single unstarted task is found and user answers no', () => {
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
        `there is one matching unstarted task on the timesheet (${TASK_SUBJECT}); start this`
      );
      testTaskIsNotStarted(TASK_SUBJECT);
    });

    test('"Start" command with a task descriptor argument asks which of the many matching tasks to start', () => {
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
        'there are more than one matching task on the timesheet; select the task to'
      );
    });

    test('"Start" command does not throw an exception with stack trace when command is force stopped with CTRL+C', () => {
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
  });

  describe('Stopping the clock', () => {
    beforeEach(() => {
      execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
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

    function testTaskIsNotSopped(subject = TASK_SUBJECT) {
      const projectClockDataObj = getTestFileDataObj(testFilePath);
      const found = projectClockDataObj.tasks.find(
        (task) => task.subject === subject
      );
      expect(found?.subject).toEqual(subject);
      expect(found?.end).not.toBeDefined();
    }

    test('"Stop" command without any arguments exits with an error when no active (started but not stopped) tasks are found', () => {
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
      expect(error).toMatch('ERROR: no active tasks found; nothing to stop');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('"Stop" command without any arguments asks user whether the only active (started but not stopped) task is to be stopped', () => {
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
        `there is one active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
    });

    test('"Stop" command without any arguments stops the only active task if user answers yes', () => {
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
        `there is one active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsStopped();
    });

    test('"Stop" command without any arguments exits without stopping any tasks if user answers no', () => {
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
        `there is one active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsNotSopped();
    });

    test('"Stop" command without any arguments asks which of the many active tasks to stop', () => {
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
        'there are more than one active task on the timesheet; select the task to stop'
      );
    });

    test('"Stop" command without any arguments stops correct task when the first of many active tasks is selected', () => {
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
        'there are more than one active task on the timesheet; select the task to stop'
      );
      testTaskIsStopped('first active task');
    });

    test('"Stop" command with task descriptor exits with an error when no matching active task is found', () => {
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
      expect(error).toMatch('ERROR: no matching active tasks found');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('"Stop" command with task descriptor argument confirms whether the only matching task is to be stopped', () => {
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
        `there is one matching active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
    });

    test('"Stop" command with task descriptor argument stops correct task when the user answers yes', () => {
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
        `there is one matching active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsStopped();
    });

    test('"Stop" command with task descriptor argument exits without stopping any task when the user answers no', () => {
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
        `there is one matching active task on the timesheet (${TASK_SUBJECT}); stop this`
      );
      testTaskIsNotSopped();
    });

    test('"Stop" command with task descriptor argument asks which of many matching active tasks to stop', () => {
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
        'there are more than one matching active task on the timesheet; select the task'
      );
    });

    test('"Stop" command with task descriptor argument stops correct task when first of many matching active tasks is selected', () => {
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
        'there are more than one matching active task on the timesheet; select the task'
      );
      testTaskIsStopped('first active task');
    });

    test('"Stop" command does not throw an exception with stack trace when command is force stopped with CTRL+C', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
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
  });
});
