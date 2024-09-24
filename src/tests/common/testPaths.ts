import path from 'node:path';
import { ROOT_DIR, SUBDIR_NAME, TEST_FILE_NAME } from './constants';

/**
 * Returns often used test paths in an object based on a test directory name.
 * @param testDirName Name of the test directory.
 */
export function getTestPathsFromDirName(testDirName: string) {
  const testDirPath = path.join(ROOT_DIR, testDirName);
  const subdirPath = path.join(testDirPath, SUBDIR_NAME);
  const testFilePath = path.join(subdirPath, TEST_FILE_NAME);
  const editorPath =
    process.platform === 'win32'
      ? `${ROOT_DIR}/src/tests/common/executable/mockEditor.exe`
      : `${ROOT_DIR}/src/tests/common/executable/mockEditor.mjs`;
  return {
    testDirName,
    testDirPath,
    subdirPath,
    testFilePath,
    editorPath,
  };
}

/**
 * Returns often used test paths in an object based on the test suite name.
 * @param testSuiteName Unique name for the test suite. Used in the test
 *    directory name.
 */
export function getTestPaths(testSuiteName: string) {
  const testDirName = `testDir${testSuiteName.charAt(0).toUpperCase()}${testSuiteName.slice(1)}`;
  return getTestPathsFromDirName(testDirName);
}
