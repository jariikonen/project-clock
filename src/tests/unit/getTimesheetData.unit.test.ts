import fs from 'node:fs';
import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import getTimesheetData from '../../common/getTimesheetData';
import ProjectClockError from '../../common/ProjectClockError';
import { createTestFile } from '../common/testFile';

const testDirName = 'testDirGetTimesheetData';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('getTimesheetData()', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
    process.chdir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
    process.chdir(ROOT_DIR);
  });

  describe('No timesheet file exists', () => {
    test('getTimesheetData() without an argument and no timesheet file in the directory throws a ProjectClockError', () => {
      expect(() => getTimesheetData()).toThrow(ProjectClockError);
      expect(() => getTimesheetData()).toThrow(
        'no timesheet file in the directory'
      );
    });

    test('getTimesheetData() with an absolute path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const absolutePathToNonExistentFile = path.join(
        subdirPath,
        TEST_FILE_NAME
      );
      expect(() => getTimesheetData(absolutePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimesheetData(absolutePathToNonExistentFile)).toThrow(
        `timesheet file '${absolutePathToNonExistentFile}' does not exist`
      );
    });

    test('getTimesheetData() with a relative path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const relativePathToNonExistentFile = TEST_FILE_NAME;
      const absoluteTestPath = path.join(
        process.cwd(),
        relativePathToNonExistentFile
      );
      expect(() => getTimesheetData(relativePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimesheetData(relativePathToNonExistentFile)).toThrow(
        `timesheet file '${absoluteTestPath}' does not exist`
      );
    });
  });

  describe('Timesheet file exists', () => {
    const testFileDataObj = {
      projectName: PROJECT_NAME,
      tasks: [],
    };

    beforeEach(() => {
      createTestFile(testFileDataObj, testFilePath);
    });

    test('getTimesheetData() without an argument returns correct data', () => {
      expect(() => getTimesheetData()).not.toThrow();
      const response = getTimesheetData();
      expect(response).toEqual(testFileDataObj);
    });

    test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument returns correct data', () => {
      expect(() => getTimesheetData(testFilePath)).not.toThrow();
      const response = getTimesheetData(testFilePath);
      expect(response).toEqual(testFileDataObj);
    });

    test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument returns correct data', () => {
      expect(() => getTimesheetData(TEST_FILE_NAME)).not.toThrow();
      const response = getTimesheetData(testFilePath);
      expect(response).toEqual(testFileDataObj);
    });
  });

  describe('An inaccessable timesheet file exists', () => {
    const testFileDataObj = {
      projectName: PROJECT_NAME,
      tasks: [],
    };

    describe('No read permission', () => {
      beforeEach(() => {
        createTestFile(testFileDataObj, testFilePath);
        fs.chmodSync(testFilePath, '000');
      });

      test('getTimesheetData() without an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData()).toThrow(ProjectClockError);
        expect(() => getTimesheetData()).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });

      test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFilePath)).toThrow(ProjectClockError);
        expect(() => getTimesheetData(testFilePath)).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });

      test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(TEST_FILE_NAME)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(TEST_FILE_NAME)).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });
    });

    describe('No write permission', () => {
      beforeEach(() => {
        createTestFile(testFileDataObj, testFilePath);
        fs.chmodSync(testFilePath, '444');
      });

      test('getTimesheetData() without an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData()).toThrow(ProjectClockError);
        expect(() => getTimesheetData()).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });

      test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFilePath)).toThrow(ProjectClockError);
        expect(() => getTimesheetData(testFilePath)).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });

      test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(TEST_FILE_NAME)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(TEST_FILE_NAME)).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });
    });
  });

  describe('More than one timesheet file exists', () => {
    const testFileDataObj = {
      projectName: PROJECT_NAME,
      tasks: [],
    };

    const projectName2 = `${PROJECT_NAME}_2`;
    const testFileName2 = `${projectName2}.pclock.json`;
    const testFilePath2 = path.join(subdirPath, testFileName2);
    const testFileDataObj2 = {
      projectName: projectName2,
      tasks: [],
    };

    beforeEach(() => {
      createTestFile(testFileDataObj, testFilePath);
      createTestFile(testFileDataObj2, testFilePath2);
    });

    describe('The target file is accessible', () => {
      test('getTimesheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimesheetData()).toThrow(ProjectClockError);
        expect(() => getTimesheetData()).toThrow(
          'more than one timesheet file in the directory'
        );
      });

      test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument returns correct data', () => {
        expect(() => getTimesheetData(testFilePath2)).not.toThrow();
        const response = getTimesheetData(testFilePath2);
        expect(response).toEqual(testFileDataObj2);
      });

      test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument returns correct data', () => {
        expect(() => getTimesheetData(testFileName2)).not.toThrow();
        const response = getTimesheetData(testFilePath2);
        expect(response).toEqual(testFileDataObj2);
      });
    });

    describe('No read access to target file', () => {
      beforeEach(() => {
        fs.chmodSync(testFilePath, '000');
        fs.chmodSync(testFilePath2, '000');
      });

      test('getTimesheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimesheetData()).toThrow(ProjectClockError);
        expect(() => getTimesheetData()).toThrow(
          'more than one timesheet file in the directory'
        );
      });

      test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          `reading of file '${testFilePath2}' denied (no permission)`
        );
      });

      test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFileName2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          `reading of file '${testFilePath2}' denied (no permission)`
        );
      });
    });

    describe('No write access to target file', () => {
      beforeEach(() => {
        fs.chmodSync(testFilePath, '444');
        fs.chmodSync(testFilePath2, '444');
      });

      test('getTimesheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimesheetData()).toThrow(ProjectClockError);
        expect(() => getTimesheetData()).toThrow(
          'more than one timesheet file in the directory'
        );
      });

      test('getTimesheetData() with an absolute path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          `no write permission to file '${testFilePath2}'`
        );
      });

      test('getTimesheetData() with a relative path leading to an existing timesheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimesheetData(testFileName2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimesheetData(testFilePath2)).toThrow(
          `no write permission to file '${testFilePath2}'`
        );
      });
    });
  });
});
