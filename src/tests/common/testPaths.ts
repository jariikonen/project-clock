import path from 'node:path';
import { ROOT_DIR, SUBDIR_NAME, TEST_FILE_NAME } from './constants';

export function getTestPathsFromDirName(testDirName: string) {
  const testDirPath = path.join(ROOT_DIR, testDirName);
  const subdirPath = path.join(testDirPath, SUBDIR_NAME);
  const testFilePath = path.join(subdirPath, TEST_FILE_NAME);
  return {
    testDirName,
    testDirPath,
    subdirPath,
    testFilePath,
  };
}

export function getTestPaths(testSuiteName: string) {
  const testDirName = `testDir${testSuiteName.charAt(0).toUpperCase()}${testSuiteName.slice(1)}`;
  return getTestPathsFromDirName(testDirName);
}
