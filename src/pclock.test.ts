import { execSync } from 'child_process';
import fs from 'node:fs';
import path from 'node:path';
import { version } from '../package.json';
import { parseProjectClockData } from './types/ProjectClockData';

const rootDir = path.dirname(__dirname);
const testDirName = 'testDir';
const subDirName = 'subdir';
const testDirPath = path.join(rootDir, testDirName);
const subDirPath = path.join(testDirPath, subDirName);

beforeAll(() => {
  fs.mkdirSync(testDirPath);
});

afterAll(() => {
  fs.rmSync(testDirPath, { recursive: true });
});

test('Output includes name string and the current version when run without any arguments', () => {
  let error = '';
  try {
    // by default a commander app that receives no arguments exits with code 1
    // => { stdio: 'pipe' } is used to prevent the stderr to be printed on
    // screen
    execSync('node bin/pclock.js', { stdio: 'pipe' });
  } catch (err) {
    const e = err as Error;
    error = e.message;
  }
  expect(error).toMatch(`pclock (Project Clock) v${version}\n`);
});

describe('Basic functions', () => {
  beforeEach(() => {
    fs.mkdirSync(subDirPath);
  });

  afterEach(() => {
    fs.rmSync(subDirPath, { recursive: true });
  });

  describe('Timesheet creation', () => {
    const projectName = 'testProject';
    const testFileName = `${projectName}.pclock.json`;
    const testFilePath = path.join(subDirPath, testFileName);

    test('New project timesheet can be created', () => {
      const buffer = execSync(
        `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`
      );
      expect(buffer.toString()).toMatch(
        `created a new timesheet: ${testFilePath}`
      );

      const fileExists = fs.existsSync(testFilePath);
      expect(fileExists).toEqual(true);

      const testFileData = fs.readFileSync(testFilePath, 'utf8');
      const projectClockDataObj = parseProjectClockData(
        JSON.parse(testFileData)
      );
      const nameFromTestFile = projectClockDataObj.projectName;
      expect(nameFromTestFile).toEqual(projectName);
    });

    test('Timesheet creation returns with error if file already exists', () => {
      const testCommand = `cd ${subDirPath} && node ${rootDir}/bin/pclock.js new ${projectName}`;

      const buffer1 = execSync(testCommand);
      expect(buffer1.toString()).toMatch(
        `created a new timesheet: ${testFilePath}`
      );

      const fileExists = fs.existsSync(testFilePath);
      expect(fileExists).toEqual(true);

      let error = '';
      try {
        execSync(testCommand, { stdio: 'pipe' });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('ERROR: timesheet file already exists');
    });
  });
});
