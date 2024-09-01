import { execSync } from 'child_process';
import prettyAnsi from 'pretty-ansi';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TASK_SUBJECT,
} from '../common/constants';
import { createTestFile } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'inquirerColor';
const { testDirPath, subdirPath, testFilePath } = getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Functions using the inquirer library are not outputting colors when FORCE_COLOR=0', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  test('"Start" command', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );

    // test
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js start`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch('do you want to create a new task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Stop" command', () => {
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
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(
      `there is one active task on the timesheet (${TASK_SUBJECT}); stop this`
    );
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Suspend" command', () => {
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
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(
      `there is one suspendable task on the timesheet (${TASK_SUBJECT}); suspend`
    );
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Resume" command', () => {
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
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(
      `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume`
    );
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Add" command', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      testFilePath
    );

    // test
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(
      'enter subject for the new task (empty to exit without creating a task):'
    );
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"New" command', () => {
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(`enter name for the project: (${SUBDIR_NAME})`);
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Show" command', () => {
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
    const response = prettyAnsi(
      execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      })
    );
    expect(response).toMatch(
      `there is one task on the timesheet (${TASK_SUBJECT}); show this task?`
    );
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });
});
