import path from 'node:path';

/** The project directory root. */
export const ROOT_DIR = path.dirname(path.dirname(path.dirname(__dirname)));

/**
 * Name for the directory where the test files are inside the test directory.
 * Test directory is named uniquely for each test suite.
 */
export const SUBDIR_NAME = 'subdir';

/** This can be used for naming a test project/timesheet. */
export const PROJECT_NAME = 'testProject';

/** A timesheet file name that matches the PROJECT_NAME. */
export const TEST_FILE_NAME = `${PROJECT_NAME}.pclock.json`;

/** This can be used as a task subject. */
export const TASK_SUBJECT = 'Test task';
