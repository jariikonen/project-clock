import chalk from 'chalk';
import { readTimesheet } from '../common/timesheetReadWrite';
import calculateTimes, {
  TaskStatusInformation,
} from '../common/calculateTimes';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import ProjectClockError from '../common/ProjectClockError';
import calculateTotalTime from '../common/calculateTotalTime';
import getTaskListString from '../common/getTaskListString';
import multiple from '../common/multiple';

interface StatusOptions {
  verbose?: true | undefined;
}

function getActiveTaskListStr(
  activeTimes: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  includeSeconds: boolean
) {
  const consoleWidth = process.stdout.columns;
  const taskTable = getTaskListString(
    activeTimes,
    timeParams,
    consoleWidth,
    includeSeconds,
    [2, 0]
  );

  const [term, counter] = multiple('task', activeTimes.length);
  if (activeTimes.length > 0) {
    return `${chalk.bold(`${counter} active ${term}:`)}\n${taskTable.toString()}`;
  }
  return `${chalk.bold(`${counter} active ${term}`)}`;
}

function getTotalTimePeriodStr(
  totalTime: number,
  timeParams: TimeParams | undefined,
  includeSeconds: boolean
) {
  const timePeriod = new TimePeriod(totalTime, timeParams);
  const hoursAndMinutes = timePeriod.hoursAndMinutesStr(includeSeconds);
  const daysHoursAndMinutes =
    timePeriod.daysTotal > 0
      ? ` (${timePeriod.daysHoursAndMinutesStr(includeSeconds)}, ${timePeriod.conversionRateDayStr()})`
      : '';
  if (hoursAndMinutes) {
    return `${chalk.bold('total time spent:')} ${hoursAndMinutes}${daysHoursAndMinutes}`;
  }
  return '';
}

/**
 * Outputs current status information.
 * @param options The CLI options from the user.
 */
export default function status(options: StatusOptions) {
  const timesheetData = readTimesheet();

  const { projectName, projectSettings, tasks } = timesheetData;

  const activeTasks = tasks.filter((task) => task.begin && !task.end);
  const incompleteTasks = tasks.filter((task) => !task.end);
  const completeTasks = tasks.filter((task) => task.end);

  let activeTimes: TaskStatusInformation[] = [];
  let allTimes: TaskStatusInformation[] = [];
  try {
    activeTimes = calculateTimes(activeTasks);
    allTimes = calculateTimes(tasks);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(
        `An error occurred while inspecting the timesheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
  }
  const includeSeconds = !!options.verbose;
  const totalTime = calculateTotalTime(allTimes);
  const totalTimePeriodStr = getTotalTimePeriodStr(
    totalTime,
    projectSettings?.timeParams,
    includeSeconds
  );
  const activeTaskListStr = getActiveTaskListStr(
    activeTimes,
    projectSettings?.timeParams,
    includeSeconds
  );

  console.log(`${chalk.bold('Project:')} '${projectName}'`);
  console.log(
    `${chalk.bold('Tasks (complete/incomplete/total):')} ${completeTasks.length}/${incompleteTasks.length}/${tasks.length}`
  );
  if (activeTaskListStr) {
    console.log(`\n${activeTaskListStr}`);
  }
  if (totalTimePeriodStr) {
    console.log(`\n${totalTimePeriodStr}`);
  }
}
