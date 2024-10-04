import { platform } from 'os';
import { execSync } from 'child_process';
import { PROJECT_NAME, ROOT_DIR, TASK_SUBJECT } from '../common/constants';
import { createTestFile } from '../common/testFile';
import { createTestDir, removeTestDir } from '../common/testDirectory';
import { expectTaskEqualsTo } from '../common/testTask';
import {
  Command,
  forceStopped,
  moreThanOneTimesheetFile,
  noPermission,
  noTimesheetFile,
} from '../common/userFriendlyErrorMessages';
import { getTestPaths } from '../common/testPaths';
import execute, { DOWN } from '../common/childProcessExecutor';

const testSuiteName = 'edit';
const { testDirName, testDirPath, subdirPath, testFilePath, editorPath } =
  getTestPaths(testSuiteName);

function outputEditorMockDirections() {
  if (platform() === 'win32') {
    console.error(
      'Running test using the mockEditor in src/tests/common/executable failed. Make sure that the mockEditor.exe is built. You can use the powershell script buildMockEditor.ps1 to build the executable (cd src/tests/common/executable; .\buildMockEditor.ps1) or follow these instructions: https://nodejs.org/api/single-executable-applications.html.'
    );
  } else {
    console.error(
      'Running test using the mockEditor.js script failed. Make sure that the shebang path in src/tests/common/executable/mockEditor.js points to a recent enough Node.js binary that supports ESM imports, and that the file src/tests/common/executable/mockEditor.mjs is executable (chmod 755 mockEditor.mjs).'
    );
  }
}

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
  test('"Edit" command reports timesheet file errors in a user friendly manner; no timesheet file', () => {
    expect.hasAssertions();
    noTimesheetFile(testDirName, Command.Edit);
  });

  test('"Edit" command reports timesheet file errors in a user friendly manner; no permission', () => {
    expect.hasAssertions();
    noPermission(testDirName, Command.Edit);
  });

  test('"Edit" command reports timesheet file errors in a user friendly manner; more than one timesheet file', () => {
    expect.hasAssertions();
    moreThanOneTimesheetFile(testDirName, Command.Edit);
  });

  test('"Edit" command gives a user friendly error message when the command is force stopped with SIGINT', async () => {
    expect.hasAssertions();
    await forceStopped(testDirName, Command.Edit, {
      projectName: PROJECT_NAME,
      tasks: [{ subject: 'first task' }, { subject: 'second task' }],
    });
  });

  test('exits with a friendly error message when user kills the process in a later prompt', async () => {
    const testTasks = [{ subject: TASK_SUBJECT }];

    createTestFile(
      {
        projectName: PROJECT_NAME,
        tasks: testTasks,
      },
      testFilePath
    );

    let error = '';
    try {
      await execute(
        `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
        ['y\n', '^C'],
        { ...process.env, FORCE_COLOR: '0' }
      );
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch('Exiting; user force closed the process.');
    expect(error).not.toMatch('throw');
    expect(error).not.toMatch('ProjectClockError');
  });
});

describe('correct functioning', () => {
  describe.each(['subject', 'description', 'notes'])(
    'edit with sub command %s',
    (field) => {
      describe('no arguments, one task on timesheet', () => {
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

        test(`confirms from the user that the task is the one to edit (${field})`, () => {
          const response = execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
            {
              encoding: 'utf8',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
          expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
          expect(response).toMatch('Edit this task?');
        });

        test(`does not edit the ${field} of any task when no is selected`, async () => {
          const response = await execute(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
            ['n\n'],
            { ...process.env, FORCE_COLOR: '0' }
          );
          expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
          expect(response).toMatch('Edit this task?');
          expect(response).toMatch('Nothing to edit.');
          expectTaskEqualsTo(testFilePath, {
            subject: TASK_SUBJECT,
          });
        });

        test(`editing of the ${field} works correctly`, async () => {
          let response;
          try {
            response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
              ['Y\n', field],
              {
                ...process.env,
                FORCE_COLOR: '0',
                EDITOR: editorPath,
              },
              true
            );
          } catch (error) {
            outputEditorMockDirections();
            throw error;
          }
          expect.hasAssertions();
          switch (field) {
            case 'subject':
              expect(response).toMatch(`subject:     ${TASK_SUBJECT}${field}`);
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: `${TASK_SUBJECT}${field}`,
                },
                `${TASK_SUBJECT}subject`
              );
              break;
            case 'description':
              expect(response).toMatch(`description: ${field}`);
              expectTaskEqualsTo(testFilePath, {
                subject: `${TASK_SUBJECT}`,
                description: field,
              });
              break;
            case 'notes':
              expect(response).toMatch(`notes:       ${field}`);
              expectTaskEqualsTo(testFilePath, {
                subject: `${TASK_SUBJECT}`,
                notes: field,
              });
              break;
            default:
              throw new Error('switch ran out of options');
          }
        });
      });

      describe(`${field}, no arguments, many tasks on timesheet`, () => {
        const testTasks = [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
          },
        ];

        beforeEach(() => {
          createTestFile(
            {
              projectName: PROJECT_NAME,
              tasks: testTasks,
            },
            testFilePath
          );
        });

        test(`${field}, prompts user to select a task`, () => {
          const response = execSync(
            `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
            {
              encoding: 'utf8',
              env: { ...process.env, FORCE_COLOR: '0' },
            }
          );
          expect(response).toMatch('There are 2 tasks on the timesheet.');
          expect(response).toMatch('Select the task to edit:');
        });

        test(`editing of the ${field} works correctly when the first task is selected`, async () => {
          let response;
          try {
            response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
              ['\n', field],
              {
                ...process.env,
                FORCE_COLOR: '0',
                EDITOR: editorPath,
              },
              true
            );
          } catch (error) {
            outputEditorMockDirections();
            throw error;
          }
          expect.hasAssertions();
          switch (field) {
            case 'subject':
              expect(response).toMatch(`subject:     first task${field}`);
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'first tasksubject',
                },
                'first tasksubject'
              );
              expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
              break;
            case 'description':
              expect(response).toMatch('subject:     first task');
              expect(response).toMatch(`description: ${field}`);
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'first task',
                  description: 'description',
                },
                'first task'
              );
              expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
              break;
            case 'notes':
              expect(response).toMatch('subject:     first task');
              expect(response).toMatch(`notes:       ${field}`);
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'first task',
                  notes: 'notes',
                },
                'first task'
              );
              expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
              break;
            default:
              throw new Error('switch ran out of options');
          }
        });

        test(`editing of the ${field} works correctly when the second task is selected`, async () => {
          let response;
          try {
            response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
              [`${DOWN}\n`, field],
              {
                ...process.env,
                FORCE_COLOR: '0',
                EDITOR: editorPath,
              },
              true
            );
          } catch (error) {
            outputEditorMockDirections();
            throw error;
          }
          expect.hasAssertions();
          switch (field) {
            case 'subject':
              expect(response).toMatch(`subject:     second task${field}`);
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'second tasksubject',
                },
                'second tasksubject'
              );
              expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
              break;
            case 'description':
              expect(response).toMatch('subject:     second task');
              expect(response).toMatch(`description: ${field}`);
              expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'second task',
                  description: 'description',
                },
                'second task'
              );
              break;
            case 'notes':
              expect(response).toMatch('subject:     second task');
              expect(response).toMatch(`notes:       ${field}`);
              expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
              expectTaskEqualsTo(
                testFilePath,
                {
                  subject: 'second task',
                  notes: 'notes',
                },
                'second task'
              );
              break;
            default:
              throw new Error('switch ran out of options');
          }
        });

        test(`${field}, does not edit any task when none is selected`, async () => {
          let response;
          try {
            response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}"`,
              [`${DOWN}${DOWN}\n`, field],
              {
                ...process.env,
                FORCE_COLOR: '0',
                EDITOR: editorPath,
              }
            );
          } catch (error) {
            outputEditorMockDirections();
            throw error;
          }
          expect.hasAssertions();
          switch (field) {
            case 'subject':
            case 'description':
            case 'notes':
              expect(response).toMatch('Nothing to edit.');
              expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
              expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
              break;
            default:
              throw new Error('switch ran out of options');
          }
        });
      });
      describe(`${field}, taskDescriptor given, no new value argument (newSubject, newDescription, newNotes)`, () => {
        const testTasks = [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
          },
        ];

        beforeEach(() => {
          createTestFile(
            {
              projectName: PROJECT_NAME,
              tasks: testTasks,
            },
            testFilePath
          );
        });

        describe(`${field}, no matching tasks`, () => {
          test(`${field}, exits with an error`, () => {
            let error = '';
            try {
              execSync(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "${TASK_SUBJECT}"`,
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
            expect(error).toMatch(
              `No task(s) matching '${TASK_SUBJECT}' found.`
            );
          });
        });

        describe(`${field}, one matching task`, () => {
          test(`${field}, confirms from the user that the task is the one to edit`, () => {
            const response = execSync(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task"`,
              { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
          });

          test(`${field}, does not edit any task when no is selected`, async () => {
            const response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task"`,
              ['n\n'],
              { ...process.env, FORCE_COLOR: '0' },
              true
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
            expect(response).toMatch('Nothing to edit.');
            expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
            expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
          });

          test(`editing of the ${field} works correctly`, async () => {
            const response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task"`,
              ['y\n', field],
              {
                ...process.env,
                FORCE_COLOR: '0',
                EDITOR: editorPath,
              },
              true
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
            switch (field) {
              case 'subject':
                expect(response).toMatch('subject:     second tasksubject');
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second tasksubject',
                  },
                  'second tasksubject'
                );
                break;
              case 'description':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch('description: description');
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    description: 'description',
                  },
                  'second task'
                );
                break;
              case 'notes':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch('notes:       notes');
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    notes: 'notes',
                  },
                  'second task'
                );
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });
        });

        describe(`${field}, many matching tasks`, () => {
          test(`${field}, prompts user to select a task`, () => {
            const response = execSync(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task`,
              {
                encoding: 'utf8',
                env: { ...process.env, FORCE_COLOR: '0' },
              }
            );
            expect(response).toMatch(
              'There are 2 matching tasks on the timesheet.'
            );
            expect(response).toMatch('Select the task to edit:');
          });

          test(`${field}, editing of the subject works correctly when the first task is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task`,
                ['\n', field],
                {
                  ...process.env,
                  FORCE_COLOR: '0',
                  EDITOR: editorPath,
                },
                true
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
                expect(response).toMatch(`subject:     first task${field}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'first tasksubject',
                  },
                  'first tasksubject'
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              case 'description':
                expect(response).toMatch('subject:     first task');
                expect(response).toMatch(`description: ${field}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'first task',
                    description: 'description',
                  },
                  'first task'
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              case 'notes':
                expect(response).toMatch('subject:     first task');
                expect(response).toMatch(`notes:       ${field}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'first task',
                    notes: 'notes',
                  },
                  'first task'
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });

          test(`${field}, editing of the subject works correctly when the second task is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task`,
                [`${DOWN}\n`, field],
                {
                  ...process.env,
                  FORCE_COLOR: '0',
                  EDITOR: editorPath,
                },
                true
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
                expect(response).toMatch(`subject:     second task${field}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second tasksubject',
                  },
                  'second tasksubject'
                );
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                break;
              case 'description':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`description: ${field}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    description: 'description',
                  },
                  'second task'
                );
                break;
              case 'notes':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`notes:       ${field}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    notes: 'notes',
                  },
                  'second task'
                );
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });

          test(`${field}, does not edit any task when none is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task`,
                [`${DOWN}${DOWN}\n`, field],
                {
                  ...process.env,
                  FORCE_COLOR: '0',
                  EDITOR: editorPath,
                }
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
              case 'description':
              case 'notes':
                expect(response).toMatch('Nothing to edit.');
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });
        });
      });
      describe(`${field}, taskDescriptor given, new value argument given (newSubject, newDescription, newNotes)`, () => {
        const testTasks = [
          {
            subject: 'first task',
          },
          {
            subject: 'second task',
          },
        ];

        beforeEach(() => {
          createTestFile(
            {
              projectName: PROJECT_NAME,
              tasks: testTasks,
            },
            testFilePath
          );
        });

        const newValueArgument = 'new value';

        describe(`${field}, no matching tasks`, () => {
          test(`${field}, exits with an error`, () => {
            let error = '';
            try {
              execSync(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "${TASK_SUBJECT}" "${newValueArgument}"`,
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
            expect(error).toMatch(
              `No task(s) matching '${TASK_SUBJECT}' found.`
            );
          });
        });

        describe(`${field}, one matching task`, () => {
          test(`${field}, confirms from the user that the task is the one to edit`, () => {
            const response = execSync(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task" "${newValueArgument}"`,
              { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } }
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
          });

          test(`${field}, does not edit any task when no is selected`, async () => {
            const response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task" "${newValueArgument}"`,
              ['n\n'],
              { ...process.env, FORCE_COLOR: '0' },
              true
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
            expect(response).toMatch('Nothing to edit.');
            expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
            expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
          });

          test(`editing of the ${field} works correctly`, async () => {
            const response = await execute(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" "second task" "${newValueArgument}"`,
              ['y\n', 'y\n'],
              { ...process.env, FORCE_COLOR: '0' },
              true
            );
            expect(response).toMatch('One matching task found: second task');
            expect(response).toMatch('Edit this task?');
            switch (field) {
              case 'subject':
                expect(response).toMatch(`subject:     ${newValueArgument}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: newValueArgument,
                  },
                  newValueArgument
                );
                break;
              case 'description':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`description: ${newValueArgument}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    description: newValueArgument,
                  },
                  'second task'
                );
                break;
              case 'notes':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`notes:       ${newValueArgument}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    notes: newValueArgument,
                  },
                  'second task'
                );
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });
        });

        describe(`${field}, many matching tasks`, () => {
          test(`${field}, prompts user to select a task`, () => {
            const response = execSync(
              `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task "${newValueArgument}"`,
              {
                encoding: 'utf8',
                env: { ...process.env, FORCE_COLOR: '0' },
              }
            );
            expect(response).toMatch(
              'There are 2 matching tasks on the timesheet.'
            );
            expect(response).toMatch('Select the task to edit:');
          });

          test(`${field}, editing of the subject works correctly when the first task is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task "${newValueArgument}"`,
                ['\n', 'y\n'],
                { ...process.env, FORCE_COLOR: '0' },
                true
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
                expect(response).toMatch(`subject:     ${newValueArgument}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: newValueArgument,
                  },
                  newValueArgument
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              case 'description':
                expect(response).toMatch('subject:     first task');
                expect(response).toMatch(`description: ${newValueArgument}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'first task',
                    description: newValueArgument,
                  },
                  'first task'
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              case 'notes':
                expect(response).toMatch('subject:     first task');
                expect(response).toMatch(`notes:       ${newValueArgument}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'first task',
                    notes: newValueArgument,
                  },
                  'first task'
                );
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });

          test(`${field}, editing of the subject works correctly when the second task is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task "${newValueArgument}"`,
                [`${DOWN}\n`, 'Y\n'],
                { ...process.env, FORCE_COLOR: '0' },
                true
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
                expect(response).toMatch(`subject:     ${newValueArgument}`);
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: newValueArgument,
                  },
                  newValueArgument
                );
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                break;
              case 'description':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`description: ${newValueArgument}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    description: newValueArgument,
                  },
                  'second task'
                );
                break;
              case 'notes':
                expect(response).toMatch('subject:     second task');
                expect(response).toMatch(`notes:       ${newValueArgument}`);
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(
                  testFilePath,
                  {
                    subject: 'second task',
                    notes: newValueArgument,
                  },
                  'second task'
                );
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });

          test(`${field}, does not edit any task when none is selected`, async () => {
            let response;
            try {
              response = await execute(
                `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit "${field}" task "${newValueArgument}"`,
                [`${DOWN}${DOWN}\n`],
                { ...process.env, FORCE_COLOR: '0' }
              );
            } catch (error) {
              outputEditorMockDirections();
              throw error;
            }
            expect.hasAssertions();
            switch (field) {
              case 'subject':
              case 'description':
              case 'notes':
                expect(response).toMatch('Nothing to edit.');
                expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
                expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
                break;
              default:
                throw new Error('switch ran out of options');
            }
          });
        });
      });
    }
  );

  describe('edit without sub commands', () => {
    describe('one task on timesheet', () => {
      const testTasks = [{ subject: TASK_SUBJECT }];

      beforeEach(() => {
        createTestFile(
          {
            projectName: PROJECT_NAME,
            tasks: testTasks,
          },
          testFilePath
        );
      });

      test('confirms from the user that the task is the one to edit', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          {
            encoding: 'utf8',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
      });

      test('does not proceed when user answers no', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['n\n'],
          { ...process.env, FORCE_COLOR: '0' }
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Nothing to edit.');
      });

      test('prompts whether the user wishes to edit the subject, description or notes', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'n\n', 'n\n', 'n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
      });

      test('does not change anything when user answers no (subject, description, notes)', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'n\n', 'n\n', 'n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
        expect(response).toMatch('Do you want to edit the description?');
        expect(response).toMatch('Do you want to edit the notes?');
        expectTaskEqualsTo(testFilePath, testTasks[0]);
      });

      test('editing of the subject works correctly', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'y\n', 'subject', 'n\n', 'n\n'],
          {
            ...process.env,
            FORCE_COLOR: '0',
            EDITOR: editorPath,
          },
          true,
          ['Edit subject of task']
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
        expect(response).toMatch('Do you want to edit the description?');
        expect(response).toMatch('Do you want to edit the notes?');
        const newSubject = `${TASK_SUBJECT}subject`;
        expectTaskEqualsTo(testFilePath, { subject: newSubject }, newSubject);
      });

      test('editing of the description works correctly', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'n\n', 'y\n', 'description', 'n\n'],
          {
            ...process.env,
            FORCE_COLOR: '0',
            EDITOR: editorPath,
          },
          true,
          ['Edit description of task']
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
        expect(response).toMatch('Do you want to edit the description?');
        expect(response).toMatch('Do you want to edit the notes?');
        expectTaskEqualsTo(testFilePath, {
          subject: TASK_SUBJECT,
          description: 'description',
        });
      });

      test('editing of the notes works correctly', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'n\n', 'n\n', 'y\n', 'notes'],
          {
            ...process.env,
            FORCE_COLOR: '0',
            EDITOR: editorPath,
          },
          true,
          ['Edit notes of task']
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
        expect(response).toMatch('Do you want to edit the description?');
        expect(response).toMatch('Do you want to edit the notes?');
        expectTaskEqualsTo(testFilePath, {
          subject: TASK_SUBJECT,
          notes: 'notes',
        });
      });

      test('editing every field works correctly', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'y\n', 'subject', 'y\n', 'description', 'y\n', 'notes'],
          {
            ...process.env,
            FORCE_COLOR: '0',
            EDITOR: editorPath,
          },
          true,
          [
            'Edit subject of task',
            'Edit description of task',
            'Edit notes of task',
          ],
          10000
        );
        expect(response).toMatch(`One task found: ${TASK_SUBJECT}`);
        expect(response).toMatch('Edit this task?');
        expect(response).toMatch('Do you want to edit the subject?');
        expect(response).toMatch('Do you want to edit the description?');
        expect(response).toMatch('Do you want to edit the notes?');
        const newSubject = `${TASK_SUBJECT}subject`;
        expectTaskEqualsTo(
          testFilePath,
          {
            subject: newSubject,
            description: 'description',
            notes: 'notes',
          },
          newSubject
        );
      });
    });

    describe('many tasks on timesheet', () => {
      const testTasks = [{ subject: 'first task' }, { subject: 'second task' }];

      beforeEach(() => {
        createTestFile(
          {
            projectName: PROJECT_NAME,
            tasks: testTasks,
          },
          testFilePath
        );
      });

      test('prompts user to select a task', () => {
        const response = execSync(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          {
            encoding: 'utf8',
            env: { ...process.env, FORCE_COLOR: '0' },
          }
        );
        expect(response).toMatch('There are 2 tasks on the timesheet.');
        expect(response).toMatch('Select the task to edit:');
      });

      test('does not proceed when user selects option none', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          [`${DOWN}${DOWN}\n`],
          {
            ...process.env,
            FORCE_COLOR: '0',
            EDITOR: editorPath,
          }
        );
        expect(response).toMatch('There are 2 tasks on the timesheet.');
        expect(response).toMatch('Select the task to edit:');
        expect(response).toMatch('Nothing to edit.');
        expectTaskEqualsTo(testFilePath, testTasks[0], 'first task');
        expectTaskEqualsTo(testFilePath, testTasks[1], 'second task');
      });

      test('proceeds to asking about editing when user selects a task', async () => {
        const response = await execute(
          `cd ${subdirPath} && node ${ROOT_DIR}/bin/pclock.js edit`,
          ['y\n', 'n\n', 'n\n', 'n\n'],
          { ...process.env, FORCE_COLOR: '0' },
          true
        );
        expect(response).toMatch('There are 2 tasks on the timesheet.');
        expect(response).toMatch('Select the task to edit:');
        expect(response).toMatch('Do you want to edit the subject?');
      });
    });
  });
});
