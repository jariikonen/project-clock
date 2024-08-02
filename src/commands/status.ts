import getTimesheetData from '../common/getTimesheetData';
import calculateTimes, { TaskStatus } from '../common/calculateTimes';
import TimePeriod from '../common/TimePeriod';
import ProjectClockError from '../common/ProjectClockError';
import { ProjectClockData } from '../types/ProjectClockData';
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

function getTimesheet() {
  let timesheetData: ProjectClockData;
  try {
    timesheetData = getTimesheetData();
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(
        `An error occurred while reading the timesheet file (${error.message})`
      );
      process.exit(1);
    }
    throw error;
  }
  return timesheetData;
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
    'simple'
  );

  const [term, counter] = multiple('task', activeTimes.length);
  if (activeTimes.length > 0) {
    return `${counter} active ${term}:\n${taskTable.toString()}\n`;
  }
  return `${counter} active ${term}\n`;
}

/**
 * Outputs current status information.
 * @param options The CLI options from the user.
 */
export default function status(options: StatusOptions) {
  const timesheetData = getTimesheet();

  const { projectName, tasks } = timesheetData;

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
  const totalTime = calculateTotalTime(allTimes);
  const totalTimePeriod = new TimePeriod(totalTime);

  const includeSeconds = !!options.verbose;
  const activeTaskListStr = getActiveTaskListStr(activeTimes, includeSeconds);

  console.log(`Project: '${projectName}'\n`);
  console.log(
    `Tasks (complete/incomplete/total): ${completeTasks.length}/${incompleteTasks.length}/${tasks.length}\n`
  );
  if (activeTaskListStr) {
    console.log(activeTaskListStr);
  }
  console.log(
    `total time spent: ${totalTimePeriod.hoursAndMinutes(includeSeconds)} (${totalTimePeriod.narrowStr(includeSeconds)})`
  );
}
