import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import getTimesheetPath from '../../common/getTimesheetPath';
import ProjectClockError from '../../common/ProjectClockError';
import { createTestFile } from '../common/testFile';

const testDirName = 'testDirGetTimesheetPath';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('getTimesheetPath', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
    process.chdir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
    process.chdir(ROOT_DIR);
  });

  describe('No timesheet file exists', () => {
    test('getTimesheetPath() without an argument and no timesheet file in the directory throws a ProjectClockError', () => {
      expect(() => getTimesheetPath()).toThrow(ProjectClockError);
      expect(() => getTimesheetPath()).toThrow(
        'no timesheet file in the directory'
      );
    });

    test('getTimesheetPath() with an absolute path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const absolutePathToNonExistentFile = path.join(
        subdirPath,
        TEST_FILE_NAME
      );
      expect(() => getTimesheetPath(absolutePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimesheetPath(absolutePathToNonExistentFile)).toThrow(
        `timesheet file '${absolutePathToNonExistentFile}' does not exist`
      );
    });

    test('getTimesheetPath() with a relative path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const relativePathToNonExistentFile = TEST_FILE_NAME;
      const absoluteTestPath = path.join(
        process.cwd(),
        relativePathToNonExistentFile
      );
      expect(() => getTimesheetPath(relativePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimesheetPath(relativePathToNonExistentFile)).toThrow(
        `timesheet file '${absoluteTestPath}' does not exist`
      );
    });
  });

  describe('Timesheet file exists', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );
    });

    test('getTimesheetPath() without an argument returns correct path', () => {
      expect(() => getTimesheetPath()).not.toThrow();
      const response = getTimesheetPath();
      expect(response).toMatch(testFilePath);
    });

    test('getTimesheetPath() with an absolute path leading to an existing timesheet file as an argument returns correct path', () => {
      expect(() => getTimesheetPath(testFilePath)).not.toThrow();
      const response = getTimesheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });

    test('getTimesheetPath() with a relative path leading to an existing timesheet file as an argument returns correct path', () => {
      expect(() => getTimesheetPath(TEST_FILE_NAME)).not.toThrow();
      const response = getTimesheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });
  });

  describe('More than one timesheet file exists', () => {
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

    test('getTimesheetPath() without an argument throws a ProjectClockError', () => {
      expect(() => getTimesheetPath()).toThrow(ProjectClockError);
      expect(() => getTimesheetPath()).toThrow(
        'more than one timesheet file in the directory'
      );
    });

    test('getTimesheetPath() with an absolute path leading to an existing timesheet file as an argument returns correct path', () => {
      expect(() => getTimesheetPath(testFilePath)).not.toThrow();
      const response = getTimesheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });

    test('getTimesheetPath() with a relative path leading to an existing timesheet file as an argument returns correct path', () => {
      expect(() => getTimesheetPath(TEST_FILE_NAME)).not.toThrow();
      const response = getTimesheetPath(testFilePath);
      expect(response).toMatch(testFilePath);
    });
  });
});
