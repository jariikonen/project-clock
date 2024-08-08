import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile, createUnrestrictedTestFile } from '../common/testFile';
import { getTimeSheetData } from '../../common/timeSheetReadWrite';
import ProjectClockError from '../../common/ProjectClockError';

const testDirName = 'testDirTimeSheetReadWrite';
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

describe('Reading of time conversion parameters from the time sheet file', () => {
  test('Time unit conversion parameters can exist in a valid time sheet file', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        projectSettings: {
          timeParams: {
            day: 12,
            week: 6,
            month: 24,
            year: 312,
          },
        },
        tasks: [],
      },
      testFilePath
    );

    // test
    const timeSheetData = getTimeSheetData(testFilePath);
    expect(timeSheetData.projectSettings).toEqual({
      timeParams: {
        day: 12,
        week: 6,
        month: 24,
        year: 312,
      },
    });
  });

  test('getTimeSheetData() throws a ProjectClockError when the time sheet contains invalid timeParams', () => {
    // initialize test environment
    createUnrestrictedTestFile(
      {
        projectName: PROJECT_NAME,
        projectSettings: {
          timeParams: {
            day: 'week',
            week: 6,
            month: 24,
            year: 312,
          },
        },
        tasks: [],
      },
      testFilePath
    );

    // test
    expect(() => getTimeSheetData(testFilePath)).toThrow();
    expect(() => getTimeSheetData(testFilePath)).toThrow(ProjectClockError);
    expect(() => getTimeSheetData(testFilePath)).toThrow(
      'not a ProjectClockData object'
    );
  });
});
