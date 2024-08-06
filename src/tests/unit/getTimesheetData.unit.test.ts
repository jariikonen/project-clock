import fs from 'node:fs';
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
import { getTimeSheetData } from '../../common/timeSheetReadWrite';

const testDirName = 'testDirGetTimeSheetData';
const testDirPath = path.join(ROOT_DIR, testDirName);
const subdirPath = path.join(testDirPath, SUBDIR_NAME);
const testFilePath = path.join(subdirPath, TEST_FILE_NAME);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('getTimeSheetData()', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
    process.chdir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
    process.chdir(ROOT_DIR);
  });

  describe('No time sheet file exists', () => {
    test('getTimeSheetData() without an argument and no time sheet file in the directory throws a ProjectClockError', () => {
      expect(() => getTimeSheetData()).toThrow(ProjectClockError);
      expect(() => getTimeSheetData()).toThrow(
        'no time sheet file in the directory'
      );
    });

    test('getTimeSheetData() with an absolute path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const absolutePathToNonExistentFile = path.join(
        subdirPath,
        TEST_FILE_NAME
      );
      expect(() => getTimeSheetData(absolutePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimeSheetData(absolutePathToNonExistentFile)).toThrow(
        `time sheet file '${absolutePathToNonExistentFile}' does not exist`
      );
    });

    test('getTimeSheetData() with a relative path leading to non-existent file as an argument throws a ProjectClockError', () => {
      const relativePathToNonExistentFile = TEST_FILE_NAME;
      const absoluteTestPath = path.join(
        process.cwd(),
        relativePathToNonExistentFile
      );
      expect(() => getTimeSheetData(relativePathToNonExistentFile)).toThrow(
        ProjectClockError
      );
      expect(() => getTimeSheetData(relativePathToNonExistentFile)).toThrow(
        `time sheet file '${absoluteTestPath}' does not exist`
      );
    });
  });

  describe('TimeSheet file exists', () => {
    const testFileDataObj = {
      projectName: PROJECT_NAME,
      tasks: [],
    };

    beforeEach(() => {
      createTestFile(testFileDataObj, testFilePath);
    });

    test('getTimeSheetData() without an argument returns correct data', () => {
      expect(() => getTimeSheetData()).not.toThrow();
      const response = getTimeSheetData();
      expect(response).toEqual(testFileDataObj);
    });

    test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument returns correct data', () => {
      expect(() => getTimeSheetData(testFilePath)).not.toThrow();
      const response = getTimeSheetData(testFilePath);
      expect(response).toEqual(testFileDataObj);
    });

    test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument returns correct data', () => {
      expect(() => getTimeSheetData(TEST_FILE_NAME)).not.toThrow();
      const response = getTimeSheetData(testFilePath);
      expect(response).toEqual(testFileDataObj);
    });
  });

  describe('An inaccessable time sheet file exists', () => {
    const testFileDataObj = {
      projectName: PROJECT_NAME,
      tasks: [],
    };

    describe('No read permission', () => {
      beforeEach(() => {
        createTestFile(testFileDataObj, testFilePath);
        fs.chmodSync(testFilePath, '000');
      });

      test('getTimeSheetData() without an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData()).toThrow(ProjectClockError);
        expect(() => getTimeSheetData()).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });

      test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFilePath)).toThrow(ProjectClockError);
        expect(() => getTimeSheetData(testFilePath)).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });

      test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(TEST_FILE_NAME)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(TEST_FILE_NAME)).toThrow(
          `reading of file '${testFilePath}' denied (no permission)`
        );
      });
    });

    describe('No write permission', () => {
      beforeEach(() => {
        createTestFile(testFileDataObj, testFilePath);
        fs.chmodSync(testFilePath, '444');
      });

      test('getTimeSheetData() without an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData()).toThrow(ProjectClockError);
        expect(() => getTimeSheetData()).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });

      test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFilePath)).toThrow(ProjectClockError);
        expect(() => getTimeSheetData(testFilePath)).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });

      test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(TEST_FILE_NAME)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(TEST_FILE_NAME)).toThrow(
          `no write permission to file '${testFilePath}'`
        );
      });
    });
  });

  describe('More than one time sheet file exists', () => {
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
      test('getTimeSheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimeSheetData()).toThrow(ProjectClockError);
        expect(() => getTimeSheetData()).toThrow(
          'more than one time sheet file in the directory'
        );
      });

      test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument returns correct data', () => {
        expect(() => getTimeSheetData(testFilePath2)).not.toThrow();
        const response = getTimeSheetData(testFilePath2);
        expect(response).toEqual(testFileDataObj2);
      });

      test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument returns correct data', () => {
        expect(() => getTimeSheetData(testFileName2)).not.toThrow();
        const response = getTimeSheetData(testFilePath2);
        expect(response).toEqual(testFileDataObj2);
      });
    });

    describe('No read access to target file', () => {
      beforeEach(() => {
        fs.chmodSync(testFilePath, '000');
        fs.chmodSync(testFilePath2, '000');
      });

      test('getTimeSheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimeSheetData()).toThrow(ProjectClockError);
        expect(() => getTimeSheetData()).toThrow(
          'more than one time sheet file in the directory'
        );
      });

      test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          `reading of file '${testFilePath2}' denied (no permission)`
        );
      });

      test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFileName2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          `reading of file '${testFilePath2}' denied (no permission)`
        );
      });
    });

    describe('No write access to target file', () => {
      beforeEach(() => {
        fs.chmodSync(testFilePath, '444');
        fs.chmodSync(testFilePath2, '444');
      });

      test('getTimeSheetData() without an argument throws a ProjectClockError', () => {
        expect(() => getTimeSheetData()).toThrow(ProjectClockError);
        expect(() => getTimeSheetData()).toThrow(
          'more than one time sheet file in the directory'
        );
      });

      test('getTimeSheetData() with an absolute path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          `no write permission to file '${testFilePath2}'`
        );
      });

      test('getTimeSheetData() with a relative path leading to an existing time sheet file as an argument throws ProjectClockError', () => {
        expect(() => getTimeSheetData(testFileName2)).toThrow(
          ProjectClockError
        );
        expect(() => getTimeSheetData(testFilePath2)).toThrow(
          `no write permission to file '${testFilePath2}'`
        );
      });
    });
  });
});
