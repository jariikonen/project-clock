import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TASK_SUBJECT,
} from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { getTestPaths } from '../common/testPaths';
import execute from '../common/childProcessExecutor';

const testSuiteName = 'new';
const { testDirPath, subdirPath, testFilePath } = getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Timesheet creation', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  test('Command "new" creates a new timesheet file correctly', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new "${PROJECT_NAME}"`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`created a new timesheet '${testFilePath}'`);
    expect(fs.existsSync(testFilePath)).toEqual(true);

    const projectClockDataObj = getTestFileDataObj(testFilePath);
    expect(projectClockDataObj.projectName).toEqual(PROJECT_NAME);
  });

  test('Command "new" returns with error if file already exists, and command does not change the file', () => {
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
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new "${PROJECT_NAME}"`,
        { stdio: 'pipe' }
      );
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(
      `cannot create timesheet file '${testFilePath}'; file already exists`
    );
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');

    // command didn't create new files
    const testDirContents = fs.readdirSync(subdirPath, { encoding: 'utf8' });
    expect(testDirContents.length).toEqual(1);

    // command didn't change the file
    const { tasks } = getTestFileDataObj(testFilePath);
    expect(tasks.length).toEqual(1);
  });

  test('Command "new" prompts the user for a project name if projectName argument is not given', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch('enter name for the project:');
    expect(response).toMatch(`(${SUBDIR_NAME})`);
  });

  test('Command "new" creates a timesheet file correctly if default value is accepted in the prompt', async () => {
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`,
      ['\n']
    );
    const expectedFilePath = path.join(
      subdirPath,
      `${SUBDIR_NAME}.pclock.json`
    );
    expect(response).toMatch('enter name for the project:');
    expect(response).toMatch(`created a new timesheet '${expectedFilePath}'`);
  });

  test('Command "new" does not offer a default value in the prompt if the default timesheet file already exists', () => {
    // initialize test environment
    const defaultFilePath = path.join(subdirPath, `${SUBDIR_NAME}.pclock.json`);
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      defaultFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch('enter name for the project:');
    expect(response).not.toMatch(SUBDIR_NAME);
  });

  test('Command "new" does not create a new timesheet file if an empty project name is given', async () => {
    // empty project name can only be given when file with the default name already exists
    // initialize test environment
    const defaultFilePath = path.join(subdirPath, `${SUBDIR_NAME}.pclock.json`);
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [],
      },
      defaultFilePath
    );

    // test
    let error = '';
    try {
      await execute(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`, [
        '\n',
      ]);
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch('exiting; no project name');

    const testDirContents = fs.readdirSync(subdirPath, { encoding: 'utf8' });
    expect(testDirContents.length).toEqual(1);
  });

  test('Command "new" creates a timesheet file correctly if a project name is entered through the prompt', async () => {
    const response = await execute(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new`,
      [`${PROJECT_NAME}\n`]
    );
    expect(response).toMatch('enter name for the project:');
    expect(response).toMatch(`created a new timesheet '${testFilePath}'`);
  });
});
