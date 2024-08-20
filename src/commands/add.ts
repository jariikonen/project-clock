import input from '@inquirer/input';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import handleExitPrompError from '../common/handleExitPromptError';

async function getTaskSubject(): Promise<string> {
  let result = '';
  try {
    result = await input({
      message:
        'enter subject for the new task (empty to exit without creating a task):',
    });
  } catch (error) {
    handleExitPrompError(error);
  }
  return result;
}

/**
 * Adds a new task to the timesheet.
 *
 * If the taskSubject argument is not provided, prompts the user for a subject
 * for the task.
 * @param taskSubject Subject for the task.
 */
export default async function add(taskSubject: string | undefined) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const taskSubjectToUse = taskSubject || (await getTaskSubject());

  const alreadyExists = tasks.find((task) => task.subject === taskSubjectToUse);
  if (alreadyExists) {
    console.error(`cannot create task '${taskSubject}'; task already exists`);
    process.exit(1);
  }

  if (!taskSubjectToUse) {
    console.log('exiting; no task to create');
    process.exit(0);
  }

  tasks.push({ subject: taskSubjectToUse });
  writeTimesheet(timesheetData);
  console.log(`created a new task '${taskSubjectToUse}'`);
}
