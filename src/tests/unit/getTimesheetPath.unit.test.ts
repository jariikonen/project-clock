import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import ProjectClockError from '../../common/ProjectClockError';
import { createTestFile } from '../common/testFile';
import { getTimeSheetPath } from '../../common/timeSheetReadWrite';

const testDirName = 'testDirGetTimeSheetPath';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('getTimeSheetPath', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
    process.chdir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
    process.chdir(ROOT_DIR);
  });

  describe('No time sheet file exists', () => {
    test('getTimeSheetPath() without an argument and no time sheet file in the directory throws a ProjectClockError', () => {
      expect(() => getTimeSheetPath()).toThrow(ProjectClockError);
      expect(() => getTimeSheetPath()).toThrow(
        'no time sheet file in the directory'
      );
    });

    test('getTimeSheetPath() with an absolute path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const absolutePathToNonExistentFile = path.join(
        subdirPath,
        TEST_FILE_NAME
      );
      expect(() => getTimeSheetPath(absolutePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimeSheetPath(absolutePathToNonExistentFile)).toThrow(
        `time sheet file '${absolutePathToNonExistentFile}' does not exist`
      );
    });

    test('getTimeSheetPath() with a relative path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const relativePathToNonExistentFile = TEST_FILE_NAME;
      const absoluteTestPath = path.join(
        process.cwd(),
        relativePathToNonExistentFile
      );
      expect(() => getTimeSheetPath(relativePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimeSheetPath(relativePathToNonExistentFile)).toThrow(
        `time sheet file '${absoluteTestPath}' does not exist`
      );
    });
  });

  describe('Time sheet file exists', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );
    });

    test('getTimeSheetPath() without an argument returns correct path', () => {
      expect(() => getTimeSheetPath()).not.toThrow();
      const response = getTimeSheetPath();
      expect(response).toMatch(testFilePath);
    });

    test('getTimeSheetPath() with an absolute path leading to an existing time sheet file as an argument returns correct path', () => {
      expect(() => getTimeSheetPath(testFilePath)).not.toThrow();
      const response = getTimeSheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });

    test('getTimeSheetPath() with a relative path leading to an existing time sheet file as an argument returns correct path', () => {
      expect(() => getTimeSheetPath(TEST_FILE_NAME)).not.toThrow();
      const response = getTimeSheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });
  });

  describe('More than one time sheet file exists', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );
      const projectName2 = `${PROJECT_NAME}_2`;
      const testFileName2 = `${projectName2}.pclock.json`;
      const testFilePath2 = path.join(subdirPath, testFileName2);
      createTestFile(
        {
          projectName: projectName2,
          tasks: [],
        },
        testFilePath2
      );
    });

    test('getTimeSheetPath() without an argument throws a ProjectClockError', () => {
      expect(() => getTimeSheetPath()).toThrow(ProjectClockError);
      expect(() => getTimeSheetPath()).toThrow(
        'more than one time sheet file in the directory'
      );
    });

    test('getTimeSheetPath() with an absolute path leading to an existing time sheet file as an argument returns correct path', () => {
      expect(() => getTimeSheetPath(testFilePath)).not.toThrow();
      const response = getTimeSheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });

    test('getTimeSheetPath() with a relative path leading to an existing time sheet file as an argument returns correct path', () => {
      expect(() => getTimeSheetPath(TEST_FILE_NAME)).not.toThrow();
      const response = getTimeSheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });
  });
});
