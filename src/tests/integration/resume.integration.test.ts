import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import {
  expectTaskEqualsTo,
  expectTaskMemberHasValue,
  getTestTask,
} from '../common/testTask';
import execute, { DOWN } from '../common/childProcessExecutor';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFiles,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';

const testSuiteName = 'resume';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

const resumableTasks = [
  {
    subject: 'first resumable task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z'],
  },
  {
    subject: 'second resumable task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z'],
  },
  {
    subject: 'third resumable task',
    begin: '2024-01-01T00:00:00.000Z',
    end: '2024-01-01T01:00:00.000Z',
  },
];

const unresumableTasks = [
  {
    subject: 'first unresumable task',
  },
  {
    subject: 'second unresumable task',
    begin: '2024-01-01T00:00:00.000Z',
  },
  {
    subject: 'third unresumable task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z'],
    resume: ['2024-01-01T01:00:00.000Z'],
  },
];

beforeAll(() => {
  createTestDir(testDirPath);
});

afterAll(() => {
  removeTestDir(testDirPath);
});

describe('Resume command', () => {
  beforeEach(() => {
    createTestDir(subdirPath);
  });

  afterEach(() => {
    removeTestDir(subdirPath);
  });

  function expectTaskIsResumed(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    expect(task?.end).not.toBeDefined();
    expect(task?.resume).toBeDefined();
    if (task?.suspend) {
      expect(task?.resume?.length).toEqual(task.suspend.length);
    }
  }

  function expectTaskIsNotResumed(subject = TASK_SUBJECT) {
    const task = getTestTask(testFilePath, subject);
    expect(task?.subject).toEqual(subject);
    if (task?.suspend && task?.resume && !task.end) {
      expect(task.resume?.length).toBeLessThan(task?.suspend?.length);
    }
  }

  describe('User friendly error messages', () => {
    test('"Resume" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
      noTimesheetFile(testDirName, Command.Resume);
    });

    test('"Resume" command reports timesheet file errors in a user friendly manner; no permission', () => {
      noPermission(testDirName, Command.Resume);
    });

    test('"Resume" command reports timesheet file errors in a user friendly manner; more than one timesheet files', () => {
      moreThanOneTimesheetFiles(testDirName, Command.Resume);
    });

    test('"Resume" command gives a user friendly error message when the command is force stopped with CTRL+C', () => {
      forceStopped(testDirName, Command.Resume, {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'resumable task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T00:00:00.000Z'],
          },
          {
            subject: 'second resumable task',
            begin: '2024-01-01T00:00:00.000Z',
            suspend: ['2024-01-01T00:00:00.000Z'],
          },
        ],
      });
    });
  });

  describe('"Resume" command without any arguments', () => {
    test('exits with an error when no resumable tasks are found', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: unresumableTasks,
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('no resumable tasks found; nothing to resume');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no resumable tasks are found because the timesheet is empty', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('timesheet is empty, nothing to resume');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('confirms from the user whether the only resumable task found is the one to resume', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
    });

    test('resumes the only resumable task found if the user answers yes', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume this`
      );
      expectTaskIsResumed();
    });

    test('resumes the only resumable task found even if it is a bit more complicated suspended task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T02:00:00.000Z'],
              resume: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume this`
      );
      expectTaskIsResumed();
    });

    test('resumes the only resumable task correctly when it is stopped', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume this`
      );
      expectTaskIsResumed();
      const task = getTestTask(testFilePath);
      expect(task?.suspend).toBeDefined();
      expect(task?.suspend).toEqual(['2024-01-01T01:00:00.000Z']);
      expect(task?.resume).toBeDefined();
      expect(task?.resume?.length).toEqual(1);
      expect(task?.end).not.toBeDefined();
    });

    test('resumes the only resumable task correctly when it is stopped and it has been suspended and resumed before', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
              end: '2024-01-01T03:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume this`
      );
      expectTaskIsResumed();
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
      ]);
      const task = getTestTask(testFilePath, TASK_SUBJECT);
      expect(task?.resume?.length).toEqual(2);
    });

    test('exits without resuming any task if user answers no', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one resumable task on the timesheet (${TASK_SUBJECT}); resume this`
      );
      expectTaskEqualsTo(testFilePath, {
        subject: TASK_SUBJECT,
        begin: '2024-01-01T00:00:00.000Z',
        suspend: ['2024-01-01T01:00:00.000Z'],
      });
    });

    test('asks from the user which of the many resumable tasks found to resume', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: resumableTasks,
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one resumable task on the timesheet; select the task to'
      );
    });

    test('there is correct amount of options when the user is asked which of the many tasks found to resume', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one resumable task on the timesheet; select the task to'
      );
      expect(response).toMatch('first resumable task');
      expect(response).toMatch('second resumable task');
      expect(response).toMatch('third resumable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unresumable task');
      expect(response).not.toMatch('second unresumable task');
      expect(response).not.toMatch('third unresumable task');
    });

    test('resumes correct task when the second of many resumable tasks found is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        [`${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one resumable task on the timesheet; select the task to'
      );
      expectTaskIsResumed('second resumable task');
    });

    test('does not resume any tasks when option "none" is selected instead of one of the many resumable tasks', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume`,
        [`${DOWN}${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one resumable task on the timesheet; select the task to'
      );
      expect(response).toMatch('nothing to resume');
      expectTaskEqualsTo(
        testFilePath,
        resumableTasks[0],
        'first resumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        resumableTasks[1],
        'second resumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        resumableTasks[2],
        'third resumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[0],
        'first unresumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[1],
        'second unresumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[2],
        'third unresumable task'
      );
    });
  });

  describe('"Resume" command with a task descriptor argument', () => {
    test('exits with an error when no matching resumable task is found; unstarted task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          {
            stdio: 'pipe',
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task hasn't even been started yet`
      );
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no matching resumable task is found; started task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          {
            stdio: 'pipe',
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task has been started but not suspended`
      );
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('exits with an error when no matching resumable task is found; resumed task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          {
            stdio: 'pipe',
          }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task has already been resumed`
      );
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });

    test('asks the user whether the single found resumable task is the correct one', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
    });

    test('resumes the correct task when a single matching resumable task is found and the user answers yes', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unresumable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'another unresumable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
      expectTaskIsResumed();
    });

    test('resumes the task even when the single matching resumable task is a bit more complicated suspended task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unresumable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T02:00:00.000Z'],
              resume: ['2024-01-01T01:00:00.000Z'],
            },
            {
              subject: 'another unresumable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
      expectTaskIsResumed();
    });

    test('resumes the task correctly even when the single matching resumable task is a simple stopped task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unresumable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
            {
              subject: 'another unresumable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
      expectTaskIsResumed();
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
      ]);
      const task = getTestTask(testFilePath);
      expect(task?.resume).toBeDefined();
      expect(task?.resume?.length).toEqual(1);
      expect(task?.end).not.toBeDefined();
    });

    test('resumes the task even when the single matching resumable task is a bit more complex stopped task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unresumable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
              end: '2024-01-01T05:00:00.000Z',
            },
            {
              subject: 'another unresumable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'y\n' | node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
      expectTaskIsResumed();
      expectTaskMemberHasValue(testFilePath, 'suspend', [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
        '2024-01-01T05:00:00.000Z',
      ]);
      const task = getTestTask(testFilePath);
      expect(task?.resume).toBeDefined();
      expect(task?.resume?.length).toEqual(3);
      expect(task?.end).not.toBeDefined();
    });

    test('does not resume any tasks when a single matching resumable task is found and the user answers no', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'unresumable task',
            },
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              end: '2024-01-01T01:00:00.000Z',
            },
            {
              subject: 'another unresumable task',
            },
          ],
        },
        testFilePath
      );

      // test
      const response = execSync(
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js resume ${TASK_SUBJECT}`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        `there is one matching resumable task on the timesheet (${TASK_SUBJECT}); resume`
      );
      expectTaskIsNotResumed();
    });

    test('asks which of the many matching resumable tasks to start', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: resumableTasks,
        },
        testFilePath
      );

      // test
      const matcher = 'resumable task';
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${matcher}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one matching resumable task on the timesheet; select'
      );
    });

    test('there is correct amount of options when the user is asked which of the many tasks found to resume', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const matcher = 'resumable task';
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${matcher}'`,
        { encoding: 'utf8' }
      );
      expect(response).toMatch(
        'there are more than one matching resumable task on the timesheet; select'
      );
      expect(response).toMatch('first resumable task');
      expect(response).toMatch('second resumable task');
      expect(response).toMatch('third resumable task');
      expect(response).toMatch('none');
      expect(response).not.toMatch('first unresumable task');
      expect(response).not.toMatch('second unresumable task');
      expect(response).not.toMatch('third unresumable task');
    });

    test('resumes the correct task when there are many matching resumable tasks and user selects the third one', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const matcher = 'resumable task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${matcher}'`,
        [`${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one matching resumable task on the timesheet; select'
      );
      expectTaskIsResumed('third resumable task');
    });

    test('does not resume any tasks when there are many matching resumable tasks and option "none" is selected', async () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [...unresumableTasks, ...resumableTasks],
        },
        testFilePath
      );

      // test
      const matcher = 'resumable task';
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${matcher}'`,
        [`${DOWN}${DOWN}${DOWN}\n`]
      );
      expect(response).toMatch(
        'there are more than one matching resumable task on the timesheet; select'
      );
      expect(response).toMatch('nothing to resume');
      expectTaskIsNotResumed('first resumable task');
      expectTaskIsNotResumed('second resumable task');
      expectTaskIsNotResumed('third resumable task');
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[0],
        'first unresumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[1],
        'second unresumable task'
      );
      expectTaskEqualsTo(
        testFilePath,
        unresumableTasks[2],
        'third unresumable task'
      );
    });

    test('does not resume a task if it is already resumed', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task has already been resumed`
      );
      expectTaskEqualsTo(testFilePath, {
        subject: TASK_SUBJECT,
        begin: '2024-01-01T00:00:00.000Z',
        suspend: ['2024-01-01T01:00:00.000Z'],
        resume: ['2024-01-01T02:00:00.000Z'],
      });
    });

    test('does not resume a bit more complicated already resumed task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
              resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task has already been resumed`
      );
      expectTaskEqualsTo(testFilePath, {
        subject: TASK_SUBJECT,
        begin: '2024-01-01T00:00:00.000Z',
        suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
        resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
      });
    });

    test('does not resume an even more complicated already resumed task', () => {
      // initialize test environment
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: TASK_SUBJECT,
              begin: '2024-01-01T00:00:00.000Z',
              suspend: [
                '2024-01-01T01:00:00.000Z',
                '2024-01-01T03:00:00.000Z',
                '2024-01-01T05:00:00.000Z',
              ],
              resume: [
                '2024-01-01T02:00:00.000Z',
                '2024-01-01T04:00:00.000Z',
                '2024-01-01T06:00:00.000Z',
              ],
            },
          ],
        },
        testFilePath
      );

      // test
      let error = '';
      try {
        execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js resume '${TASK_SUBJECT}'`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }

      expect(error).toMatch(
        `can't resume task '${TASK_SUBJECT}'; the task has already been resumed`
      );
      expectTaskEqualsTo(testFilePath, {
        subject: TASK_SUBJECT,
        begin: '2024-01-01T00:00:00.000Z',
        suspend: [
          '2024-01-01T01:00:00.000Z',
          '2024-01-01T03:00:00.000Z',
          '2024-01-01T05:00:00.000Z',
        ],
        resume: [
          '2024-01-01T02:00:00.000Z',
          '2024-01-01T04:00:00.000Z',
          '2024-01-01T06:00:00.000Z',
        ],
      });
    });
  });
});
