import path from 'node:path';
import {
  PROJECT_NAME,
  ROOT_DIR,
  SUBDIR_NAME,
  TEST_FILE_NAME,
} from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile, createUnrestrictedTestFile } from '../common/testFile';
import { getTimesheetData } from '../../common/timesheetReadWrite';
import ProjectClockError from '../../common/ProjectClockError';

const testDirName = 'testDirTimesheetReadWrite';
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

describe('Reading of time conversion parameters from the timesheet file', () => {
  test('Time unit conversion parameters can exist in a valid timesheet file', () => {
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
    const timeSheetData = getTimesheetData(testFilePath);
    expect(timeSheetData.projectSettings).toEqual({
      timeParams: {
        day: 12,
        week: 6,
        month: 24,
        year: 312,
      },
    });
  });

  test('getTimesheetData() throws a ProjectClockError when the timesheet contains invalid timeParams', () => {
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
    expect(() => getTimesheetData(testFilePath)).toThrow();
    expect(() => getTimesheetData(testFilePath)).toThrow(ProjectClockError);
    expect(() => getTimesheetData(testFilePath)).toThrow(
      'not a ProjectClockData object'
    );
  });
});
