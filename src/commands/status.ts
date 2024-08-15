import { readTimesheet } from '../common/timesheetReadWrite';
import calculateTimes, { TaskStatus } from '../common/calculateTimes';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import ProjectClockError from '../common/ProjectClockError';
import calculateTotalTime from '../common/calculateTotalTime';
import getTaskListString from '../common/getTaskListString';

interface StatusOptions {
  verbose?: true | undefined;
}

function multiple(term: string, number: number) {
  if (number === 0) {
    return [`${term}s`, 'no'];
  }
  return number === 1 ? [`${term}`, '1'] : [`${term}s`, `${number}`];
}

function getActiveTaskListStr(
  activeTimes: TaskStatus[],
  timeParams: TimeParams | undefined,
  includeSeconds: boolean
) {
  const consoleWidth = process.stdout.columns;
  const taskTable = getTaskListString(
    activeTimes,
    timeParams,
    consoleWidth,
    includeSeconds,
    'simple',
    [2, 0]
  );

  const [term, counter] = multiple('task', activeTimes.length);
  if (activeTimes.length > 0) {
    return `${counter} active ${term}:\n${taskTable.toString()}`;
  }
  return `${counter} active ${term}`;
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
    return `total time spent: ${hoursAndMinutes}${daysHoursAndMinutes}`;
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

  let activeTimes: TaskStatus[] = [];
  let allTimes: TaskStatus[] = [];
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

  console.log(`Project: '${projectName}'\n`);
  console.log(
    `Tasks (complete/incomplete/total): ${completeTasks.length}/${incompleteTasks.length}/${tasks.length}`
  );
  if (activeTaskListStr) {
    console.log(`\n${activeTaskListStr}`);
  }
  if (totalTimePeriodStr) {
    console.log(`\n${totalTimePeriodStr}`);
  }
}
