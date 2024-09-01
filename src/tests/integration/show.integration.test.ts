import { execSync } from 'child_process';
import prettyAnsi from 'pretty-ansi';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { createTestFile } from '../common/testFile';
import {
  Command,
  faultyTask,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';
import execute, { DOWN } from '../common/childProcessExecutor';

const testSuiteName = 'show';
const { testDirName, testDirPath, subdirPath, testFilePath } =
  getTestPaths(testSuiteName);

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

describe('User friendly error messages', () => {
  test('"Show" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
    expect.hasAssertions();
    noTimesheetFile(testDirName, Command.Show);
  });

  test('"Show" command reports timesheet file errors in a user friendly manner; no permission', () => {
    expect.hasAssertions();
    noPermission(testDirName, Command.Show);
  });

  test('"Show" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    expect.hasAssertions();
    moreThanOneTimesheetFile(testDirName, Command.Show);
  });

  test('"Show" command reports timesheet file errors in a user friendly manner; when the command is force stopped with CTRL+C', () => {
    expect.hasAssertions();
    forceStopped(testDirName, Command.Show, {
      projectName: PROJECT_NAME,
      tasks: [
        {
          subject: 'task',
        },
      ],
    });
  });

  test('"Show" command with a faulty timesheet file returns a user friendly error message (no stack trace or source code paths)', async () => {
    await faultyTask(testDirName, Command.Show, ['\n']);
  });
});

describe('Correct functioning, no task descriptor argument given', () => {
  describe('time sheet is empty', () => {
    test('exits with an error when the timesheet is empty', () => {
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
        execSync(`cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`, {
          stdio: 'pipe',
        });
      } catch (err) {
        const e = err as Error;
        error = e.message;
      }
      expect(error).toMatch('timesheet is empty, no task to show');
      expect(error).not.toMatch('throw');
      expect(error).not.toMatch('ProjectClockError');
    });
  });

  describe('when there is only one task on the timesheet, color and stylings OFF', () => {
    beforeEach(() => {
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
    });

    test('prompts for confirmation ', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
      expect(response).toMatch(
        `there is one task on the timesheet (${TASK_SUBJECT}); show this task?`
      );
    });

    test('displays correct output when the prompt is answered yes', () => {
      const response = execSync(
        `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js show`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        `there is one task on the timesheet (${TASK_SUBJECT}); show this task?`
      );
      expect(response).toMatch('subject:     Test task');
      expect(response).toMatch('status:      unstarted');
    });

    test('displays correct output when the prompt is answered no', () => {
      const response = execSync(
        `cd ${subdirPath} && printf 'n\n' | node ${ROOT_DIR}/bin/pclock.js show`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        `there is one task on the timesheet (${TASK_SUBJECT}); show this task?`
      );
      expect(response).toMatch('nothing to show');
    });
  });

  describe('when there is only one task on the timesheet, color and stylings ON', () => {
    beforeEach(() => {
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
    });

    test('displays correct output when the prompt is answered yes', () => {
      const response = prettyAnsi(
        execSync(
          `cd ${subdirPath} && printf 'Y\n' | node ${ROOT_DIR}/bin/pclock.js show`,
          { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '1' } }
        )
      );
      expect(response).toMatch(
        `there is one task on the timesheet (${TASK_SUBJECT}); show this task?`
      );
      expect(response).toMatch('<bold>subject:</intensity>     Test task');
      expect(response).toMatch(
        '<bold>status:</intensity> <blue>     unstarted</color>'
      );
    });
  });

  describe('there are more than one task on the timesheet, color and stylings OFF', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
            },
            {
              subject: 'second task',
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );
    });

    test('prompts to select a task when there is more than one task on the timesheet', () => {
      const response = execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
    });

    test('displays correct output when the first one is selected', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        ['\n'],
        { ...process.env, FORCE_COLOR: '0' }
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
      expect(response).toMatch('subject:     first task');
      expect(response).toMatch('status:      unstarted');
    });

    test('displays correct output when the second one is selected', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        [`${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' }
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
      expect(response).toMatch('subject:     second task');
      expect(response).toMatch('status:      started');
    });

    test('displays correct output when option "none" is selected', async () => {
      const response = await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
        [`${DOWN}${DOWN}\n`],
        { ...process.env, FORCE_COLOR: '0' }
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
      expect(response).toMatch('nothing to show');
    });
  });

  describe('there are more than one task on the timesheet, color and stylings ON', () => {
    beforeEach(() => {
      createTestFile(
        {
          projectName: PROJECT_NAME,
          tasks: [
            {
              subject: 'first task',
            },
            {
              subject: 'second task',
              begin: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
        testFilePath
      );
    });

    test('displays correct output when the first one is selected', async () => {
      const response = prettyAnsi(
        await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
          ['\n'],
          { ...process.env, FORCE_COLOR: '1' }
        )
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
      expect(response).toMatch('<bold>subject:</intensity>     first task');
      expect(response).toMatch(
        '<bold>status:</intensity> <blue>     unstarted</color>'
      );
    });

    test('displays correct output when the second one is selected', async () => {
      const response = prettyAnsi(
        await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show`,
          [`${DOWN}\n`],
          { ...process.env, FORCE_COLOR: '1' }
        )
      );
      expect(response).toMatch(
        'there are more than one task on the timesheet; select the task to show:'
      );
      expect(response).toMatch('<bold>subject:</intensity>     second task');
      expect(response).toMatch(
        '<bold>status:</intensity> <red>     started</color>'
      );
    });
  });
});

describe('Correct functioning, task descriptor argument given, color and stylings OFF', () => {
  test('exits with an error when a matching task is not found', () => {
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
    const taskSubject = 'another task';
    let error = '';
    try {
      execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show '${taskSubject}' found`,
        {
          stdio: 'pipe',
          env: { ...process.env, FORCE_COLOR: '0' },
        }
      );
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(`no task(s) matching '${taskSubject}' found`);
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');
  });

  test('displays correct information when only one matching task is found', () => {
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
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show '${TASK_SUBJECT}'`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch(`subject:     ${TASK_SUBJECT}`);
    expect(response).toMatch('status:      unstarted');
  });

  test('displays correct information when many matching tasks are found', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
            begin: '2024-01-01T00:00:00.000Z',
            end: '2024-01-01T01:00:00.000Z',
          },
        ],
      },
      testFilePath
    );

    // test
    const response = execSync(
      `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show 'task'`,
      {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    );
    expect(response).toMatch('subject:     first task');
    expect(response).toMatch('status:      unstarted');
    expect(response).toMatch('subject:     second task');
    expect(response).toMatch('status:      completed');
    expect(response).toMatch('time spent:  1h');
  });
});

describe('Correct functioning, task descriptor argument given, color and stylings ON', () => {
  test('displays correct information when only one matching task is found', () => {
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
    const response = prettyAnsi(
      execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show '${TASK_SUBJECT}'`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '1' },
        }
      )
    );
    expect(response).toMatch(`<bold>subject:</intensity>     ${TASK_SUBJECT}`);
    expect(response).toMatch(
      '<bold>status:</intensity> <blue>     unstarted</color>'
    );
  });

  test('displays correct information when many matching tasks are found', () => {
    // initialize test environment
    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
            begin: '2024-01-01T00:00:00.000Z',
            end: '2024-01-01T01:00:00.000Z',
          },
        ],
      },
      testFilePath
    );

    // test
    const response = prettyAnsi(
      execSync(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js show 'task'`,
        {
          encoding: 'utf8',
          env: { ...process.env, FORCE_COLOR: '1' },
        }
      )
    );
    expect(response).toMatch('<bold>subject:</intensity>     first task');
    expect(response).toMatch(
      '<bold>status:</intensity> <blue>     unstarted</color>'
    );
    expect(response).toMatch('<bold>subject:</intensity>     second task');
    expect(response).toMatch(
      '<bold>status:</intensity> <green>     completed</color>'
    );
    expect(response).toMatch('<bold>time spent:</intensity>  1h');
  });
});
