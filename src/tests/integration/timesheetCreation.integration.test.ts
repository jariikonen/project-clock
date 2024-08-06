import { execSync } from 'child_process';
import path from 'node:path';
import fs from 'node:fs';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { getTestFileDataObj } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';

const testDirName = 'testDirTimeSheetCreation';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Time sheet creation', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  test('New project time sheet can be created', () => {
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new ${PROJECT_NAME}`,
      { encoding: 'utf8' }
    );
    expect(response).toMatch(`created a new time sheet: ${testFilePath}`);

    const fileExists = fs.existsSync(testFilePath);
    expect(fileExists).toEqual(true);

    const projectClockDataObj = getTestFileDataObj(testFilePath);
    expect(projectClockDataObj.projectName).toEqual(PROJECT_NAME);
  });

  test('Time sheet creation returns with error if file already exists', () => {
    const testCommand = `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js new ${PROJECT_NAME}`;

    const response = execSync(testCommand, { encoding: 'utf8' });
    expect(response).toMatch(`created a new time sheet: ${testFilePath}`);

    const fileExists = fs.existsSync(testFilePath);
    expect(fileExists).toEqual(true);

    let error = '';
    try {
      execSync(testCommand, { stdio: 'pipe' });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch('time sheet file already exists');
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');
  });
});
