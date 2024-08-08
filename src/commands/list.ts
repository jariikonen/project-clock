import calculateTimes, { TaskStatus } from '../common/calculateTimes';
import calculateTotalTime from '../common/calculateTotalTime';
import getTaskListString from '../common/getTaskListString';
import ProjectClockError from '../common/ProjectClockError';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import { readTimeSheet } from '../common/timeSheetReadWrite';
import { Task } from '../types/ProjectClockData';

interface ListOptions {
  verbose?: true;
  active?: true;
  complete?: true;
  incomplete?: true;
  notStarted?: true;
}

function filterTasks(options: ListOptions, tasks: Task[]) {
  const optionsToUse =
    options.active ??
    options.complete ??
    options.incomplete ??
    options.notStarted
      ? options
      : { active: true, complete: true, incomplete: true, notStarted: true };
  return tasks.filter((task) => {
    if (optionsToUse.active && task.begin && !task.end) {
      return true;
    }
    if (optionsToUse.complete && task.end) {
      return true;
    }
    if (optionsToUse.incomplete && !task.end) {
      return true;
    }
    if (optionsToUse.notStarted && !task.begin) {
      return true;
    }
    return false;
  });
}

function getRequestedTaskListStr(
  times: TaskStatus[],
  timeParams: TimeParams | undefined,
  includeSeconds: boolean
) {
  const consoleWidth = process.stdout.columns;
  const taskTable = getTaskListString(
    times,
    timeParams,
    consoleWidth,
    includeSeconds,
    'simple'
  );
  if (times.length > 0) {
    return taskTable.toString();
  }
  return 'no tasks to list';
}

function getTotalTimePeriodStr(
  totalTime: number,
  timeParams: TimeParams | undefined,
  includeSeconds: boolean,
  numberOfTasks: number
) {
  if (numberOfTasks < 1) {
    return 'no tasks to list';
  }
  const taskMultiple = numberOfTasks === 1 ? 'task' : 'tasks';
  const timePeriod = new TimePeriod(totalTime, timeParams);
  const hoursAndMinutes = timePeriod.hoursAndMinutesStr(includeSeconds);
  const daysHoursAndMinutes =
    timePeriod.daysTotal > 0
      ? ` (${timePeriod.daysHoursAndMinutesStr(includeSeconds)}, ${timePeriod.conversionRateDayStr()})`
      : '';
  if (hoursAndMinutes) {
    return `${numberOfTasks} ${taskMultiple}, total time spent: ${hoursAndMinutes}${daysHoursAndMinutes}`;
  }
  return `${numberOfTasks} ${taskMultiple}, total time spent: -`;
}

/**
 * Lists the tasks on the time sheet.
 * @param options The CLI options from the user.
 */
export default function list(options: ListOptions) {
  const timeSheetData = readTimeSheet();
  const { projectName, projectSettings, tasks } = timeSheetData;
  const requestedTasks = filterTasks(options, tasks);

  let requestedTimes: TaskStatus[] = [];
  try {
    requestedTimes = calculateTimes(requestedTasks);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(
        `An error occurred while inspecting the time sheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
  }

  const includeSeconds = !!options.verbose;
  const requestedTaskListStr = getRequestedTaskListStr(
    requestedTimes,
    projectSettings?.timeParams,
    includeSeconds
  );
  const totalTime = calculateTotalTime(requestedTimes);
  const totalTimePeriodStr = getTotalTimePeriodStr(
    totalTime,
    projectSettings?.timeParams,
    includeSeconds,
    requestedTimes.length
  );

  console.log(`Project: '${projectName}'\n`);
  if (requestedTaskListStr) {
    console.log(requestedTaskListStr);
  }
  if (totalTimePeriodStr) {
    console.log(`\n${totalTimePeriodStr}`);
  }
}
