import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile, getTestFileDataObj } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import execute, { DOWN } from '../common/childProcessExecutor';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'remove';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Removing tasks', () => {
  const emptyTestFile = {
    projectName: PROJECT_NAME,
    tasks: [],
  };

  const singleTaskTestFile = {
    projectName: PROJECT_NAME,
    tasks: [
      {
        subject: TASK_SUBJECT,
      },
    ],
  };

  const TASK_SUBJECT_1 = 'first';
  const TASK_SUBJECT_2 = 'second task';
  const TASK_SUBJECT_3 = 'third task';
  const MATCHES_TWO = 'task';

  const manyTaskTestFile = {
    projectName: PROJECT_NAME,
    tasks: [
      {
        subject: TASK_SUBJECT_1,
      },
      {
        subject: TASK_SUBJECT_2,
      },
      {
        subject: TASK_SUBJECT_3,
      },
    ],
  };

  function expectTimesheetIsEmpty() {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    expect(projectClockDataObj.tasks.length).toEqual(0);
  }

  function expectTaskExists(subject = TASK_SUBJECT) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const searchResult = projectClockDataObj.tasks.filter(
      (task) => task.subject === subject
    );
    expect(searchResult.length).toEqual(1);
  }

  function expectTaskDoesNotExist(subject = TASK_SUBJECT) {
    const projectClockDataObj = getTestFileDataObj(testFilePath);
    const searchResult = projectClockDataObj.tasks.filter(
      (task) => task.subject === subject
    );
    expect(searchResult.length).toEqual(0);
  }

  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  describe('User friendly error messages', () => {
    test('"Remove" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      expect.hasAssertions();
      noTimesheetFile(testDirName, Command.Remove);
    });

    test('"Remove" command reports timesheet file errors in a user friendly manner; no permission', () => {
      expect.hasAssertions();
      noPermission(testDirName, Command.Remove);
    });

    test('"Remove" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
      expect.hasAssertions();
      moreThanOneTimesheetFile(testDirName, Command.Remove);
    });

    test('"Remove" command gives a user friendly error message when the command is force stopped in confirmation prompt (one task on timesheet)', async () => {
      expect.hasAssertions();
      await forceStopped(testDirName, Command.Remove, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'first task',
          },
        ],
      });
    });

    test('"Remove" command gives a user friendly error message when the command is force stopped in selection prompt', async () => {
      expect.hasAssertions();
      await forceStopped(testDirName, Command.Remove, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
          },
        ],
      });
    });

    test('"Remove" command gives a user friendly error message when the command is force stopped in confirmation prompt (task selected)', async () => {
      expect.hasAssertions();
      await forceStopped(
        testDirName,
        Command.Remove,
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
            },
            {
              subject: 'second task',
            },
          ],
        },
        [' \n']
      );
    });
  });

  describe('"Remove" command without any arguments', () => {
    describe('no tasks on the timesheet', () => {
      beforeEach(() => {
        createTestFile(emptyTestFile, testFilePath);
      });

      test('command exits with error stating that the timesheet is empty', () => {
        let error = '';
        try {
          execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
            {
              encoding: 'utf8',
              stdio: 'pipe',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch('Timesheet is empty, nothing to remove.');
      });
    });

    describe('one task on the timesheet', () => {
      beforeEach(() => {
        createTestFile(singleTaskTestFile, testFilePath);
      });

      test('the only task is offered to be removed', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          {
            encoding: 'utf8',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch(
          'There is only one task on the timesheet and it is about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT}`);
        expect(response).toMatch('Are you sure you want to continue?');
      });

      test('the only task is removed if the user answers yes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          ['y\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Removed 1 task.');
        expect.assertions(2);
        expectTimesheetIsEmpty();
      });

      test('nothing is removed if the user answers no', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          ['n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Nothing to remove.');
        expect(response).not.toMatch('Removed');
        expect.assertions(3);
        expectTaskExists();
      });
    });

    describe('many tasks on the timesheet', () => {
      beforeEach(() => {
        createTestFile(manyTaskTestFile, testFilePath);
      });

      test('the user is presented a correct list of tasks from which to choose', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          {
            encoding: 'utf8',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch('Select the tasks to remove:');
        expect(response).toMatch(TASK_SUBJECT_1);
        expect(response).toMatch(TASK_SUBJECT_2);
        expect(response).toMatch(TASK_SUBJECT_3);
      });

      test('the correct tasks are removed when user selects some of them', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          [`${DOWN} ${DOWN} \n`, '\n'], // two last tasks are selected
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('You are about to remove these 2 tasks:');
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Are you sure you want to continue?');
      });

      test('nothing is removed when the user does not select anything', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove`,
          [`${DOWN} ${DOWN} \n`, 'y\n'], // two last tasks are selected
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Removed 2 tasks.');
        expect(response).toMatch(`Project: ${PROJECT_NAME}`);
        expect.assertions(5);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskDoesNotExist(TASK_SUBJECT_2);
        expectTaskDoesNotExist(TASK_SUBJECT_3);
      });
    });
  });

  describe('"Remove" command with a task descriptor argument', () => {
    describe('no tasks on the timesheet', () => {
      beforeEach(() => {
        createTestFile(emptyTestFile, testFilePath);
      });

      test('command exits with error stating that the timesheet is empty', () => {
        let error = '';
        try {
          execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT}"`,
            {
              encoding: 'utf8',
              stdio: 'pipe',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch('Timesheet is empty, nothing to remove.');
      });
    });

    describe('one task on the timesheet', () => {
      beforeEach(() => {
        createTestFile(singleTaskTestFile, testFilePath);
      });

      test('nothing is removed if the task descriptor does not match the task on the timesheet', () => {
        let error = '';
        try {
          execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove 'Does not match'`,
            {
              encoding: 'utf8',
              stdio: 'pipe',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch('Nothing to remove.');
        expectTaskExists(TASK_SUBJECT);
      });

      test('the user is confirmed if the matching task is the correct task to remove', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch(
          'This task matches the task descriptor and it is about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT}`);
        expect(response).toMatch('Are you sure you want to remove this task?');
      });

      test('the matching task is removed if user answers yes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT}"`,
          ['y\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Removed 1 task.');
        expect.assertions(2);
        expectTaskDoesNotExist(TASK_SUBJECT);
      });

      test('nothing is removed if the user answers no', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT}"`,
          ['n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Nothing to remove.');
        expect.assertions(2);
        expectTaskExists(TASK_SUBJECT);
      });
    });

    describe('many tasks on the timesheet', () => {
      beforeEach(() => {
        createTestFile(manyTaskTestFile, testFilePath);
      });

      test('nothing is removed if the task descriptor does not match the task on the timesheet', () => {
        let error = '';
        try {
          execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove 'Does not match'`,
            {
              encoding: 'utf8',
              stdio: 'pipe',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
        } catch (err) {
          const e = err as Error;
          error = e.message;
        }
        expect(error).toMatch('Nothing to remove.');
        expect.assertions(4);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('the user is confirmed if the matching task is the task to be removed when only one task matches the descriptor', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT_2}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch(
          'This task matches the task descriptor and it is about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch('Are you sure you want to remove this task?');
      });

      test('the correct task is removed if user answers yes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT_2}"`,
          ['y\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Removed 1 task.');
        expect(response).toMatch(`Project: ${PROJECT_NAME}`);
        expect.assertions(5);
        expectTaskDoesNotExist(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('nothing is removed when the user answers no', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${TASK_SUBJECT_2}"`,
          ['n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('Nothing to remove.');
        expect.assertions(4);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('the user is asked if they wish to modify the selection if more than one task matches the descriptor', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
      });

      test('the user is confirmed whether to remove the tasks if they answer no and nothing is removed if the user then declines', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          ['n\n', 'n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
        expect(response).toMatch(
          'Are you sure you want to remove these 2 tasks?'
        );
        expect(response).toMatch('Nothing to remove.');
        expect.assertions(9);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('correct tasks are removed if the user answers yes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          ['n\n', 'y\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
        expect(response).toMatch(
          'Are you sure you want to remove these 2 tasks?'
        );
        expect(response).toMatch('Removed 2 tasks.');
        expect(response).toMatch(`Project: ${PROJECT_NAME}`);
        expect.assertions(10);
        expectTaskDoesNotExist(TASK_SUBJECT_2);
        expectTaskDoesNotExist(TASK_SUBJECT_3);
        expectTaskExists(TASK_SUBJECT_1);
      });

      test('the user is presented a correct list of tasks if they wish to modify the selection and nothing is removed if nothing is selected', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          ['y\n', '\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
        expect(response).toMatch('Select the tasks to remove:');
        expect(response).toMatch('Nothing to remove.');
        expect.assertions(9);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('user is confirmed whether to remove correct tasks if user selects one of them and nothing is removed if user answers no', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          ['y\n', ' \n', 'n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
        expect(response).toMatch('Select the tasks to remove:');
        expect(response).toMatch('You are about to remove this task:');
        expect(response).toMatch('Are you sure you want to continue?');
        expect(response).toMatch('Nothing to remove.');
        expect.assertions(11);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskExists(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });

      test('correct tasks are removed if the user answers yes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js remove "${MATCHES_TWO}"`,
          ['y\n', ' \n', 'y\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(
          'These 2 tasks match the task descriptor and they are about to be removed:'
        );
        expect(response).toMatch(`  ${TASK_SUBJECT_2}`);
        expect(response).toMatch(`  ${TASK_SUBJECT_3}`);
        expect(response).toMatch('Do you want to modify the selection?');
        expect(response).toMatch('Select the tasks to remove:');
        expect(response).toMatch('You are about to remove this task:');
        expect(response).toMatch('Are you sure you want to continue?');
        expect(response).toMatch('Removed 1 task.');
        expect.assertions(11);
        expectTaskExists(TASK_SUBJECT_1);
        expectTaskDoesNotExist(TASK_SUBJECT_2);
        expectTaskExists(TASK_SUBJECT_3);
      });
    });
  });
});
