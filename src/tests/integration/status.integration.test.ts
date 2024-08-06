import { execSync } from 'child_process';
import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TASK_SUBJECT,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile } from '../common/testFile';

const testDirName = 'testDirStatus';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

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
    test('"Status" command without a timesheet file returns a user friendly error message (no stack trace or source code paths)', () => {
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no timesheet file in the directory');
      expect(error).not.toMatch('throw');
    });

    test('"Status" command with more than one timesheet returns a user friendly error message (no stack trace or source code paths)', () => {
      // initialize test environment
      const testFilePath2 = path.join(
        subdirPath,
        'secondTestProject.pclock.json'
      );
      createTestFile(
        {
          projectName: 'first test project',
          tasks: [
            {
              subject: 'just a task',
            },
          ],
        },
        testFilePath
      );
      createTestFile(
        {
          projectName: 'second test project',
          tasks: [
            {
              subject: 'just a task',
            },
          ],
        },
        testFilePath2
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('more than one timesheet file in the directory');
      expect(error).not.toMatch('throw');
    });

    test('"Status" command with a faulty timesheet file returns a user friendly error message (no stack trace or source code paths)', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: 'first test project',
          tasks: [
            {
              subject: 'faulty task',
              begin: '2024-01-01T01:00:00.000Z',
              end: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js status`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        "An error occurred while inspecting the timesheet file (invalid time period '2024-01-01T01:00:00.000Z' => '2024-01-01T00:00:00.000Z' (faulty task); start date is later than end date)"
      );
      expect(error).not.toMatch('throw');
    });
  });

  describe('Correct output', () => {
    test('"Status" command responds with correct output when there is a single timesheet file', () => {
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
        { encoding: 'utf8' }
      );
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch('Tasks (complete/incomplete/total): 1/3/4');
      expect(response).toMatch('2 active tasks:');
      expect(response).toMatch('First active task2h');
      expect(response).toMatch('Second active task2h');
      expect(response).toMatch('total time spent: 8h (1d, d=8h)');
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
        { encoding: 'utf8' }
      );
      expect(response).toMatch(`Project: '${PROJECT_NAME}'`);
      expect(response).toMatch('Tasks (complete/incomplete/total): 0/1/1');
      expect(response).toMatch('no active tasks');
      expect(response).not.toMatch(TASK_SUBJECT);
      expect(response).not.toMatch('total time spent:');
    });
  });
});
