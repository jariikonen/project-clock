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

  function createTestFile(
    testFileDataObj: ProjectClockData,
    fileName = testFileName
  ) {
    const filePath = path.join(subDirPath, fileName);
    const fileJSON = JSON.stringify(testFileDataObj);
    fs.writeFileSync(filePath, fileJSON, { encoding: 'utf8' });
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
    });
  });

  describe('Starting and stopping the clock (when there is a timesheet)', () => {
    beforeEach(() => {
      execSync(
        `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`
      );
    });

    const taskName = 'testTask';

    describe('Starting the clock', () => {
      test('"Start" command without any arguments starts the clock with current timestamp as task subject', () => {
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch('created a new task');

        const newTimestamp = new Date();
        const timestampFromResponse = response.substring(20, 44);
        expect(timestampFromResponse.substring(0, 15)).toEqual(
          newTimestamp.toISOString().substring(0, 15)
        );

        const projectClockDataObj = getTestFileDataObj();
        const { subject, begin } = projectClockDataObj.tasks[0];
        expect(subject).toEqual(timestampFromResponse);
        expect(begin).toBeDefined();
        if (begin) {
          expect(begin.substring(0, 15)).toEqual(
            timestampFromResponse.substring(0, 15)
          );
        }
      });

      test('"Start" command with task descriptor as an argument starts the clock with correct subject', () => {
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start ${taskName}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(`created a new task '${taskName}'`);

        const newTimestamp = new Date();
        const projectClockDataObj = getTestFileDataObj();
        const { subject, begin } = projectClockDataObj.tasks[0];
        expect(subject).toEqual(taskName);
        expect(begin).toBeDefined();
        if (begin) {
          expect(begin.substring(0, 15)).toEqual(
            newTimestamp.toISOString().substring(0, 15)
          );
        }
      });

      test('An error is returned if the "start" command is run when the task has already been started', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: taskName,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        let error = '';
        try {
          execSync(
            `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start ${taskName}`,
            { stdio: 'pipe' }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch(
          `ERROR: task '${taskName}' has already been started`
        );
      });

      test('An error is returned if the "start" command is run with task descriptor that matches more than one task', () => {
        // initialize test environment
        createTestFile({
          projectName,
          tasks: [
            {
              subject: 'testTask',
              begin: new Date().toISOString(),
            },
            {
              subject: 'secondTask',
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        let error = '';
        const matcher = 'Task';
        try {
          execSync(
            `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start ${matcher}`,
            { stdio: 'pipe' }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch(
          'ERROR: more than one task matches the descriptor'
        );
      });
    });

    describe('Stopping the clock', () => {
      beforeEach(() => {
        execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js start ${taskName}`,
          { encoding: 'utf8' }
        );
      });

      test('"Stop" command without any arguments stops the clock of the only active (started but not stopped) task', () => {
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
              subject: taskName,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch("stopped task '");

        const projectClockDataObj = getTestFileDataObj();
        const testTask = projectClockDataObj.tasks[1];
        expect(testTask.subject).toMatch(taskName);
        expect(testTask.begin).toBeDefined();
        expect(testTask.end).toBeDefined();
        if (testTask.end) {
          expect(testTask.end).toMatch(new Date(testTask.end).toISOString());
        }
      });

      test('"Stop" command without any arguments returns an error if there are more than one active task', () => {
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
        let error = '';
        try {
          execSync(`cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop `, {
            stdio: 'pipe',
          });
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch('ERROR: more than one active task');
      });

      test('"Stop" command with task descriptor as an argument stops the clock for matching task', () => {
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
              subject: taskName,
              begin: new Date().toISOString(),
            },
          ],
        });

        // test
        const response = execSync(
          `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop ${taskName}`,
          { encoding: 'utf8' }
        );
        expect(response).toMatch(`stopped task '${taskName}'`);

        const projectClockDataObj = getTestFileDataObj();
        const testTask = projectClockDataObj.tasks[1];
        expect(testTask.subject).toMatch(taskName);
        expect(testTask.begin).toBeDefined();
        expect(testTask.end).toBeDefined();
        if (testTask.end) {
          expect(testTask.end).toMatch(new Date(testTask.end).toISOString());
        }
      });

      test('"Stop" command with task descriptor as an argument returns an error if there are more than one matching tasks', () => {
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
        let error = '';
        const matcher = 'active task';
        try {
          execSync(
            `cd ${subDirPath} && node ${rootDir}/bin/pclock.js stop ${matcher}`,
            {
              stdio: 'pipe',
            }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch(
          'ERROR: more than one task matches the descriptor'
        );
      });
    });
  });
});
