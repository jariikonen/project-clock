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
import execute from '../common/childProcessExecutor';

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
    expect(response).toMatch('Timesheet is empty.');
    expect(response).toMatch('Do you want to create a new task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Stop" command', async () => {
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
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js stop`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      )
    );
    expect(response).toMatch(`One active task found: ${TASK_SUBJECT}`);
    expect(response).toMatch('Stop this task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Suspend" command', async () => {
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
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js suspend`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      )
    );
    expect(response).toMatch(`One suspendable task found: ${TASK_SUBJECT}`);
    expect(response).toMatch('Suspend this task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Resume" command', async () => {
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
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      )
    );
    expect(response).toMatch(`One resumable task found: ${TASK_SUBJECT}`);
    expect(response).toMatch('Resume this task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Add" command', async () => {
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
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js add`,
        ['\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      )
    );
    expect(response).toMatch(
      'Enter subject for the new task (empty to exit without creating a task):'
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
    expect(response).toMatch(`Enter name for the project: (${SUBDIR_NAME})`);
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });

  test('"Show" command', async () => {
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
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        ['n\n'],
        { ...process.env, FORCE_COLOR: '0' },
        true
      )
    );
    expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
    expect(response).toMatch('Show this task?');
    expect(response).not.toMatch('</color>');
    expect(response).not.toMatch('</intensity>');
  });
});
