import { readTimeSheet } from '../common/timeSheetReadWrite';
import calculateTimes, { TaskStatus } from '../common/calculateTimes';
import TimePeriod from '../common/TimePeriod';
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
  includeSeconds: boolean
) {
  const consoleWidth = process.stdout.columns;
  const taskTable = getTaskListString(
    activeTimes,
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

function getTotalTimePeriodStr(totalTime: number, includeSeconds: boolean) {
  const timePeriod = new TimePeriod(totalTime);
  const hoursAndMinutes = timePeriod.hoursAndMinutesStr(includeSeconds);
  if (hoursAndMinutes) {
    return `total time spent: ${hoursAndMinutes} (${timePeriod.daysHoursAndMinutesStr(includeSeconds)}, ${timePeriod.conversionRateDayStr()})`;
  }
  return '';
}

/**
 * Outputs current status information.
 * @param options The CLI options from the user.
 */
export default function status(options: StatusOptions) {
  const timeSheetData = readTimeSheet();

  const { projectName, tasks } = timeSheetData;

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
        `An error occurred while inspecting the time sheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
  }
  const includeSeconds = !!options.verbose;
  const totalTime = calculateTotalTime(allTimes);
  const totalTimePeriodStr = getTotalTimePeriodStr(totalTime, includeSeconds);
  const activeTaskListStr = getActiveTaskListStr(activeTimes, includeSeconds);

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
