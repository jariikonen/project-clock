import chalk from 'chalk';
import calculateTimes, {
  TaskStatusInformation,
} from '../common/calculateTimes';
import calculateTotalTime from '../common/calculateTotalTime';
import getTaskListString from '../common/getTaskListString';
import ProjectClockError from '../common/ProjectClockError';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import { readTimesheet } from '../common/timesheetReadWrite';
import { Task } from '../types/ProjectClockData';
import {
  consoleWidth,
  outputError,
  outputPlain,
  sideHeadingText,
} from '../common/outputFormatting';
import multiple from '../common/multiple';
import capitalize from '../common/capitalize';

interface ListOptions {
  verbose?: true;
  active?: true;
  complete?: true;
  incomplete?: true;
  unstarted?: true;
}

function filterTasks(options: ListOptions, tasks: Task[]) {
  const optionsToUse =
    options.active ??
    options.complete ??
    options.incomplete ??
    options.unstarted
      ? options
      : { active: true, complete: true, incomplete: true, unstarted: true };
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
    if (optionsToUse.unstarted && !task.begin) {
      return true;
    }
    return false;
  });
}

function getRequestedTaskListStr(
  times: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  includeSeconds: boolean
) {
  const taskTable = getTaskListString(
    times,
    timeParams,
    consoleWidth,
    includeSeconds,
    [2, 0]
  );
  if (times.length > 0) {
    return taskTable.toString();
  }
  return '  no tasks to list';
}

function getTotalTimePeriodStr(
  totalTime: number,
  timeParams: TimeParams | undefined,
  includeSeconds: boolean,
  numberOfTasks: number
) {
  if (numberOfTasks < 1) {
    return '';
  }
  const taskMultiple = numberOfTasks === 1 ? 'task' : 'tasks';
  const timePeriod = new TimePeriod(totalTime, timeParams);
  const hoursAndMinutes = timePeriod.hoursAndMinutesStr(includeSeconds);
  const daysHoursAndMinutes =
    timePeriod.daysTotal > 0
      ? ` (${timePeriod.daysHoursAndMinutesStr(includeSeconds)}, ${timePeriod.conversionRateDayStr()})`
      : '';
  if (hoursAndMinutes) {
    return `${chalk.bold(`${numberOfTasks} ${taskMultiple}, total time spent:`)} ${hoursAndMinutes}${daysHoursAndMinutes}`;
  }
  return `${chalk.bold(`${numberOfTasks} ${taskMultiple}, total time spent:`)} -`;
}

function removeNonFilterOptionKeys(optionKeys: string[]) {
  const filterKeys: (keyof ListOptions)[] = [
    'active',
    'complete',
    'incomplete',
    'unstarted',
  ];
  const result = optionKeys.filter((key: keyof ListOptions) =>
    filterKeys.includes(key)
  );
  return result;
}

function getListFilterString(options: ListOptions) {
  const optionKeys = removeNonFilterOptionKeys(Object.keys(options));

  if (optionKeys.length === 0) {
    return 'active, complete, incomplete and unstarted';
  }
  if (optionKeys.length > 1) {
    const last = optionKeys.pop();
    return `${optionKeys.join(', ')} and ${last}`;
  }
  return optionKeys[0];
}

function getListDescription(options: ListOptions, tasks: Task[]) {
  const [term] = multiple('task', tasks.length);
  return chalk.bold(`${capitalize(getListFilterString(options))} ${term}:`);
}

/**
 * Lists the tasks on the timesheet.
 * @param options The CLI options from the user.
 */
export default function list(options: ListOptions) {
  const timesheetData = readTimesheet();
  const { projectName, projectSettings, tasks } = timesheetData;
  const requestedTasks = filterTasks(options, tasks);

  let requestedTimes: TaskStatusInformation[] = [];
  try {
    requestedTimes = calculateTimes(requestedTasks);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      outputError(
        `An error occurred while inspecting the timesheet file (${error.message})`
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

  outputPlain(sideHeadingText('Project', `${projectName}\n`));
  outputPlain(getListDescription(options, requestedTasks));
  if (requestedTaskListStr) {
    outputPlain(requestedTaskListStr);
  }
  if (totalTimePeriodStr) {
    outputPlain(`\n${totalTimePeriodStr}`);
  }
}
