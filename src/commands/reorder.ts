import chalk from 'chalk';
import reorderListPrompt from 'inquirer-reorder-list';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import calculateTimes, {
  TaskStatusInformation,
} from '../common/calculateTimes';
import ProjectClockError from '../common/ProjectClockError';
import { consoleWidth, outputError } from '../common/outputFormatting';
import { getTaskListParts } from '../common/getTaskListStrings';

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
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('Exiting; user force closed the process.');
    } else {
      throw error;
    }
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
    if (error instanceof ProjectClockError) {
      outputError(
        `An error occurred while inspecting the timesheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
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
