import calculateTimes from '../common/calculateTimes';
import { ERROR_MESSAGE_TIMESHEET_INSPECTION } from '../common/constants';
import handleExitPromptError from '../common/handleExitPromptError';
import handleProjectClockError from '../common/handleProjectClockError';
import {
  consoleWidth,
  createSeparatedSectionsStr,
  messageWithTruncatedPart,
  outputError,
  outputPlain,
  sideHeadingTextMultiple,
} from '../common/outputFormatting';
import ProjectClockError from '../common/ProjectClockError';
import promptToConfirmOrSelectTask from '../common/promptToConfirmOrSelectTask';
import { styleTaskStatus } from '../common/styling';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import { readTimesheet } from '../common/timesheetReadWrite';
import { ProjectClockSettings, Task } from '../types/ProjectClockData';

async function promptTask(tasks: Task[]): Promise<Task> {
  try {
    return await promptToConfirmOrSelectTask(tasks, '', 'show');
  } catch (error) {
    handleExitPromptError(error);
  }
  throw new ProjectClockError('Internal error: this should not have happened.');
}

function createTaskDataStr(task: Task, timeParams: TimeParams | undefined) {
  const paddingRight = 1;
  const taskStatus = calculateTimes([task])[0];
  const timeSpent = new TimePeriod(taskStatus.timeSpent, timeParams);
  const daysHoursAndMinutesStr = timeSpent.days
    ? ` (${timeSpent.daysHoursAndMinutesStr()}, ${timeSpent.conversionRateDayStr()})`
    : '';
  return sideHeadingTextMultiple(
    {
      subject: task.subject,
      description: task.description,
      notes: task.notes,
      status: taskStatus.status,
      'time spent': `${timeSpent.hoursAndMinutesStr()}${daysHoursAndMinutesStr}`,
    },
    true,
    consoleWidth,
    false,
    paddingRight,
    true,
    { status: styleTaskStatus(taskStatus.status) }
  );
}

/**
 * Prints full task data to stdout.
 * @param tasks Array of tasks to print.
 * @param projectSettings The ProjectClockSettings object to use.
 */
export function outputTaskData(
  tasks: Task[],
  projectSettings: ProjectClockSettings | undefined
): void {
  const taskStrings: string[] = [];
  tasks.forEach((task) => {
    taskStrings.push(createTaskDataStr(task, projectSettings?.timeParams));
  });
  // If Node.js property process.stdout.columns is not set, the consoleWidth
  // is given a default value of 80.
  const separatorStr = `${'-'.repeat(consoleWidth)}`;
  outputPlain(createSeparatedSectionsStr(taskStrings, separatorStr));
}

/**
 * Displays the full task data (subject, definition?, notes?, status and time
 * spent).
 * @param taskDescriptor A string that is expected to match task subject.
 */
export default async function show(taskDescriptor: string | undefined) {
  const timesheetData = readTimesheet();
  const { projectSettings, tasks } = timesheetData;

  if (tasks.length < 1) {
    outputError('Timesheet is empty, no task to show.');
    process.exit(1);
  }

  const tasksToShow = taskDescriptor
    ? tasks.filter((task) => task.subject.match(taskDescriptor))
    : [await promptTask(tasks)];
  if (tasksToShow.length === 0) {
    outputError(
      messageWithTruncatedPart(
        ["No task(s) matching '", taskDescriptor, "' found."],
        1
      )
    );
    process.exit(1);
  }

  try {
    outputTaskData(tasksToShow, projectSettings);
  } catch (error) {
    handleProjectClockError(error, ERROR_MESSAGE_TIMESHEET_INSPECTION);
  }
}
