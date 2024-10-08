import input from '@inquirer/input';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import handleExitPrompError from '../common/handleExitPromptError';
import {
  messageWithTruncatedPart,
  outputError,
  outputSuccess,
} from '../common/outputFormatting';
import exitWithNothingToDo from '../common/exitWithNothingToDo';

async function getTaskSubject(): Promise<string> {
  let result = '';
  try {
    result = await input({
      message:
        'Enter subject for the new task (empty to exit without creating a task):',
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
    outputError(
      messageWithTruncatedPart(
        ["Cannot create task '", taskSubject, "'; task already exists."],
        1
      )
    );
    process.exit(1);
  }

  if (!taskSubjectToUse) {
    exitWithNothingToDo('create');
  }

  tasks.push({ subject: taskSubjectToUse });
  writeTimesheet(timesheetData);
  outputSuccess(
    messageWithTruncatedPart(
      ["Created a new task '", taskSubjectToUse, "'."],
      1
    )
  );
}
