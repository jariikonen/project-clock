import CliTable3 from 'cli-table3';
import getTimesheetData from '../common/getTimesheetData';
import calculateTimes from '../common/calculateTimes';
import TimePeriod from '../common/TimePeriod';

interface StatusOptions {
  verbose?: true | undefined;
}

function multiple(term: string, number: number) {
  if (number === 0) {
    return [`${term}s`, 'no'];
  }
  return number === 1 ? [`${term}`, '1'] : [`${term}s`, `${number}`];
}

/**
 * Outputs current status information.
 * @param options The CLI options from the user.
 */
export default function status(options: StatusOptions) {
  const timesheetData = getTimesheetData();
  const { projectName, tasks } = timesheetData;

  const activeTasks = tasks.filter((task) => task.begin && !task.end);
  const incompleteTasks = tasks.filter((task) => !task.end);
  const completeTasks = tasks.filter((task) => task.end);

  const activeTimes = calculateTimes(activeTasks);
  const allTimes = calculateTimes(tasks);

  const consoleWidth = process.stdout.columns;

  const taskTable = new CliTable3({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
    style: { 'padding-left': 2, 'padding-right': 0 },
    head: ['Task', 'Time', 'Status'],
    colWidths: [
      Math.floor((consoleWidth - 1) * 0.65),
      Math.floor((consoleWidth - 1) * 0.15),
      Math.floor((consoleWidth - 1) * 0.1),
    ],
    wordWrap: true,
  });

  const includeSeconds = !!options.verbose;

  activeTimes.forEach((task) => {
    taskTable.push([
      task.task,
      new TimePeriod(task.timeSpent).narrowStr(includeSeconds),
      task.status,
    ]);
  });

  console.log(`Project: '${projectName}'\n`);

  console.log(
    `Tasks (complete/incomplete/total): ${completeTasks.length}/${incompleteTasks.length}/${tasks.length}\n`
  );

  const [term, counter] = multiple('task', activeTimes.length);
  if (activeTimes.length > 0) {
    console.log(`${counter} active ${term}:\n`);
    console.log(`${taskTable.toString()}\n`);
  } else {
    console.log(`${counter} active ${term}\n`);
  }

  const totalTimeSpent = allTimes.reduce(
    (accum, task) => accum + task.timeSpent,
    0
  );
  const totalTimePeriod = new TimePeriod(totalTimeSpent);
  console.log(
    `total time spent: ${totalTimePeriod.hoursAndMinutes(includeSeconds)} (${totalTimePeriod.narrowStr(includeSeconds)})`
  );
}
