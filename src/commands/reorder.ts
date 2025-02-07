import chalk from 'chalk';
import reorderListPrompt from 'inquirer-reorder-list';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import calculateTimes, {
  TaskStatusInformation,
} from '../common/calculateTimes';
import { consoleWidth, outputError } from '../common/outputFormatting';
import { getTaskListParts } from '../common/getTaskListStrings';
import handleExitPrompError from '../common/handleExitPromptError';
import handleProjectClockError from '../common/handleProjectClockError';
import { ERROR_MESSAGE_TIMESHEET_INSPECTION } from '../common/constants';

async function getListReordering(
  projectName: string,
  headerRow: string,
  contentRows: string[]
) {
  try {
    const result = await reorderListPrompt({
      message: `Arrange items of the ${projectName} project.`,
      pageSize: 7,
      loop: false,
      header: headerRow,
      choices: contentRows.map((row, index) => ({ name: row, value: index })),
      theme: {
        style: {
          highlight: (text: string) => chalk.bold(text),
        },
      },
    });
    return result;
  } catch (error) {
    handleExitPrompError(error);
  }
  return false;
}

/**
 * Reorders the tasks in the timesheet.
 */
export default async function reorder() {
  const timesheetData = readTimesheet();
  const { projectName, projectSettings, tasks } = timesheetData;

  if (tasks.length < 2) {
    outputError('There are not enough tasks to reorder.');
    process.exit(1);
  }

  let taskData: TaskStatusInformation[] = [];
  try {
    taskData = calculateTimes(tasks);
  } catch (error) {
    handleProjectClockError(error, ERROR_MESSAGE_TIMESHEET_INSPECTION);
  }

  const includeSeconds = false;
  const [headerRow, contentRows] = getTaskListParts(
    taskData,
    projectSettings?.timeParams,
    consoleWidth,
    includeSeconds,
    [0, 0],
    [3, 0]
  );

  const newOrder = await getListReordering(projectName, headerRow, contentRows);
  if (newOrder) {
    const newTasks = newOrder.map((index: number) => tasks[index]);
    timesheetData.tasks = newTasks;
    writeTimesheet(timesheetData);
  }
}
