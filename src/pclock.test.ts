import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import { version } from '../package.json';
import {
  parseProjectClockData,
  ProjectClockData,
} from './types/ProjectClockData';

const rootDir = path.dirname(__dirname);
const testDirName = 'testDir';
const subDirName = 'subdir';
const testDirPath = path.join(rootDir, testDirName);
const subDirPath = path.join(testDirPath, subDirName);

beforeAll(() => {
  fs.mkdirSync(testDirPath);
});

afterAll(() => {
  fs.rmSync(testDirPath, { recursive: true });
});

test('Output includes a name string and the current version when run without any arguments', () => {
  let error = '';
  try {
    // by default a commander app that receives no arguments exits with code 1
    // => { stdio: 'pipe' } is used to prevent the stderr to be printed on
    // screen
    execSync('node bin/pclock.js', { stdio: 'pipe' });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch(`pclock (Project Clock) v${version}\n`);
});

describe('Basic functions', () => {
  beforeEach(() => {
    fs.mkdirSync(subDirPath);
  });

  afterEach(() => {
    fs.rmSync(subDirPath, { recursive: true });
  });

  const projectName = 'testProject';
  const testFileName = `${projectName}.pclock.json`;
  const testFilePath = path.join(subDirPath, testFileName);

  /** Returns ProjectClockData object parsed from the test file. */
  function getTestFileDataObj() {
    const testFileData = fs.readFileSync(testFilePath, 'utf8');
    return parseProjectClockData(JSON.parse(testFileData));
  }

  /** Creates a JSON file out of ProjectClockDataObject. */
  function createTestFile(
    testFileDataObj: ProjectClockData,
    fileName = testFileName
  ) {
    const filePath = path.join(subDirPath, fileName);
    const fileJSON = JSON.stringify(testFileDataObj);
    fs.writeFileSync(filePath, fileJSON, { encoding: 'utf8' });
  }

  /** Checks if the provided timestamp is valid or not. */
  function isValidTimestamp(timestamp: string): boolean {
    return new Date(timestamp).toISOString() === timestamp;
  }

  describe('Timesheet creation', () => {
    test('New project timesheet can be created', () => {
      const response = execSync(
        `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(`created a new timesheet: ${testFilePath}`);

      const fileExists = fs.existsSync(testFilePath);
      expect(fileExists).toEqual(true);

      const projectClockDataObj = getTestFileDataObj();
      expect(projectClockDataObj.projectName).toEqual(projectName);
    });

    test('Timesheet creation returns with error if file already exists', () => {
      const testCommand = `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`;

      const response = execSync(testCommand, { encoding: 'utf8' });
      expect(response).toMatch(`created a new timesheet: ${testFilePath}`);

      const fileExists = fs.existsSync(testFilePath);
      expect(fileExists).toEqual(true);

      let error = '';
      try {
        execSync(testCommand, { stdio: 'pipe' });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('ERROR: timesheet file already exists');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });
  });

  describe('Starting and stopping the clock (when there is a timesheet)', () => {
    beforeEach(() => {
      execSync(
        `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`
      );
    });

    const taskSubject = 'Test task';

    function testTaskIsNotCreated(subject = taskSubject) {
      const projectClockDataObj = getTestFileDataObj();
      const found = projectClockDataObj.tasks.find(
        (task) => task.subject === subject
      );
      expect(found).toBeFalsy();
    }

    describe('Starting the clock', () => {
      function testTaskIsStarted(index: number, subjectIsTimestamp = false) {
        const currentTimestamp = new Date().toISOString();
        const projectClockDataObj = getTestFileDataObj();
        const { subject, begin } = projectClockDataObj.tasks[index];
        if (subjectIsTimestamp) {
          expect(subject.substring(0, 15)).toEqual(
            currentTimestamp.substring(0, 15)
          );
        } else {
          expect(subject).toEqual(taskSubject);
        }
        expect(begin).toBeDefined();
        if (begin) {
          expect(isValidTimestamp(begin)).toBeTruthy();
          expect(begin.substring(0, 15)).toEqual(
            currentTimestamp.substring(0, 15)
          );
        }
      }

      function testTaskIsNotStarted(subject = taskSubject) {
        const projectClockDataObj = getTestFileDataObj();
        const found = projectClockDataObj.tasks.find(
          (task) => task.subject === subject
        );
        expect(found?.subject).toEqual(subject);
        expect(found?.begin).not.toBeDefined();
      }

      test('"Start" command without any arguments asks user subject for the task (no tasks on the timesheet)', () => {
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch('enter subject for the task');
      });

      test('"Start" command without any arguments starts correct task when default value (current timestamp as subject) is accepted', () => {
        const response = execSync(
          `cd ${subDirPath} && printf '\n' | node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch('enter subject for the task');

        testTaskIsStarted(0, true);
      });

      test('"Start" command without any arguments starts correct task when subject for the task is entered', () => {
        const response = execSync(
          `cd ${subDirPath} && echo '${taskSubject}' | node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch('enter subject for the task');
        testTaskIsStarted(0);
      });

      test('"Start" command without any arguments asks confirmation from user when there is a single unstarted task on the timesheet', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-07-15T06:33:15.743Z',
              end: '2024-07-15T06:41:18.415Z',
            },
            {
              subject: taskSubject,
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          `there is one unstarted task on the timesheet (${taskSubject}); start this task`
        );
      });

      test('"Start" command without any arguments starts correct task when the single unstarted task is confirmed as desired', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-07-15T06:33:15.743Z',
              end: '2024-07-15T06:41:18.415Z',
            },
            {
              subject: taskSubject,
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'Y\n' | node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          `there is one unstarted task on the timesheet (${taskSubject}); start this task`
        );
        testTaskIsStarted(1);
      });

      test('"Start" command without any arguments asks which of the many unstarted tasks to start', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-07-15T06:33:15.743Z',
              end: '2024-07-15T06:41:18.415Z',
            },
            {
              subject: taskSubject,
            },
            {
              subject: 'other unstarted task',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          'there are more than one unstarted task on the timesheet; select the task to'
        );
      });

      test('"Start" command without any arguments starts correct task when the first of many unstarted tasks is selected', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'completed task',
              begin: '2024-07-15T06:33:15.743Z',
              end: '2024-07-15T06:41:18.415Z',
            },
            {
              subject: taskSubject,
            },
            {
              subject: 'other unstarted task',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf '\n' | node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          'there are more than one unstarted task on the timesheet; select the task to'
        );
        expect(response).toMatch(`started task '${taskSubject}'`);
        testTaskIsStarted(1);
      });

      test('"Start" command with task descriptor argument confirms whether a new task is created when matching task is not found', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `no matching unstarted task found; create a new task '${taskSubject}'`
        );
      });

      test('"Start" command with task descriptor argument creates correct task when matching task is not found and user answers yes', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'Y\n' | node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `no matching unstarted task found; create a new task '${taskSubject}'`
        );
        testTaskIsStarted(2);
      });

      test('"Start" command with task descriptor argument exits without creating a task when matching task is not found and user answers no', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'n\n' | node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `no matching unstarted task found; create a new task '${taskSubject}'`
        );
        testTaskIsNotCreated();
      });

      test('"Start" command with task descriptor argument asks the user whether the single found unstarted task is the correct one', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: taskSubject,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching unstarted task on the timesheet (${taskSubject}); start this`
        );
      });

      test('"Start" command with task descriptor argument starts correct task when single unstarted task is found and user answers yes', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: taskSubject,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'Y\n' | node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching unstarted task on the timesheet (${taskSubject}); start this`
        );
        testTaskIsStarted(1);
      });

      test('"Start" command with task descriptor argument exits without starting a task when single unstarted task is found and user answers no', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'first task',
              begin: '2024-07-13T10:55:59.727Z',
            },
            {
              subject: taskSubject,
            },
            {
              subject: 'third task',
              begin: '2024-07-13T10:56:32.416Z',
              end: '2024-07-13T10:56:55.224Z',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'n\n' | node ${rootDir}/bin/pclock.js start '${taskSubject}'`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching unstarted task on the timesheet (${taskSubject}); start this`
        );
        testTaskIsNotStarted(taskSubject);
      });

      test('"Start" command with task descriptor argument asks which of the many matching tasks to start', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start 'matching task'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          'there are more than one matching task on the timesheet; select the task to'
        );
      });

      test('"Start" command does not throw an exception with stack trace when command is force stopped with CTRL+C', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: taskSubject,
            },
            {
              subject: 'second unstarted task',
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf '^C' | node ${rootDir}/bin/pclock.js start`,
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
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start ${taskSubject}`,
          { encoding: 'utf8' }
        );
      });

      function testTaskIsStopped(subject = taskSubject) {
        const projectClockDataObj = getTestFileDataObj();
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

      function testTaskIsNotSopped(subject = taskSubject) {
        const projectClockDataObj = getTestFileDataObj();
        const found = projectClockDataObj.tasks.find(
          (task) => task.subject === subject
        );
        expect(found?.subject).toEqual(subject);
        expect(found?.end).not.toBeDefined();
      }

      test('"Stop" command without any arguments exits with an error when no active (started but not stopped) tasks are found', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
          ],
        });

        // test
        let error = '';
        try {
          execSync(`cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop`, {
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
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          `there is one active task on the timesheet (${taskSubject}); stop this`
        );
      });

      test('"Stop" command without any arguments stops the only active task if user answers yes', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'Y\n' | node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one active task on the timesheet (${taskSubject}); stop this`
        );
        testTaskIsStopped();
      });

      test('"Stop" command without any arguments exits without stopping any tasks if user answers no', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'n\n' | node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one active task on the timesheet (${taskSubject}); stop this`
        );
        testTaskIsNotSopped();
      });

      test('"Stop" command without any arguments asks which of the many active tasks to stop', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          'there are more than one active task on the timesheet; select the task to stop'
        );
      });

      test('"Stop" command without any arguments stops correct task when the first of many active tasks is selected', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'y\n' | node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        expect(response).toMatch(
          'there are more than one active task on the timesheet; select the task to stop'
        );
        testTaskIsStopped('first active task');
      });

      test('"Stop" command with task descriptor exits with an error when no matching active task is found', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
          ],
        });

        // test
        let error = '';
        try {
          execSync(
            `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop ${taskSubject}`,
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
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop ${taskSubject}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching active task on the timesheet (${taskSubject}); stop this`
        );
      });

      test('"Stop" command with task descriptor argument stops correct task when the user answers yes', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'y\n' | node ${rootDir}/bin/pclock.js stop ${taskSubject}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching active task on the timesheet (${taskSubject}); stop this`
        );
        testTaskIsStopped();
      });

      test('"Stop" command with task descriptor argument exits without stopping any task when the user answers no', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'closed task (i.e., started and stopped task)',
              begin: new Date().toISOString(),
              end: new Date().toISOString(),
            },
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf 'n\n' | node ${rootDir}/bin/pclock.js stop ${taskSubject}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          `there is one matching active task on the timesheet (${taskSubject}); stop this`
        );
        testTaskIsNotSopped();
      });

      test('"Stop" command with task descriptor argument asks which of many matching active tasks to stop', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const matcher = 'active task';
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop ${matcher}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(
          'there are more than one matching active task on the timesheet; select the task'
        );
      });

      test('"Stop" command with task descriptor argument stops correct task when first of many matching active tasks is selected', () => {
        // initialize test environment
        createTestFile({
          projectName,
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
        });

        // test
        const matcher = 'active task';
        const response = execSync(
          `cd ${subDirPath} && printf '\n' | node ${rootDir}/bin/pclock.js stop ${matcher}`,
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
        createTestFile({
          projectName,
          tasks: [
            {
              subject: taskSubject,
              begin: new Date().toISOString(),
            },
            {
              subject: 'second active task',
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && printf '^C' | node ${rootDir}/bin/pclock.js stop`,
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
});
