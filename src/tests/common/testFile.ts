import fs from 'node:fs';
import {
  parseProjectClockData,
  ProjectClockData,
} from '../../types/ProjectClockData';

/** Returns ProjectClockData object parsed from the test file. */
export function getTestFileDataObj(testFilePath: string) {
  const testFileData = fs.readFileSync(testFilePath, 'utf8');
  return parseProjectClockData(JSON.parse(testFileData));
}

/** Creates a JSON file out of ProjectClockDataObject. */
export function createTestFile(
  testFileDataObj: ProjectClockData,
  testFilePath: string
) {
  const fileJSON = JSON.stringify(testFileDataObj, null, '  ');
  fs.writeFileSync(testFilePath, fileJSON, { encoding: 'utf8' });
}

export function createUnrestrictedTestFile(
  testFileDataObj: object,
  testFilePath: string
) {
  const fileJSON = JSON.stringify(testFileDataObj, null, '  ');
  fs.writeFileSync(testFilePath, fileJSON, { encoding: 'utf8' });
}
