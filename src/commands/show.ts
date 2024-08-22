import calculateTimes from '../common/calculateTimes';
import {
  createSeparatedSectionsStr,
  sideHeadingTextMultiple,
} from '../common/outputFormatting';
import promptToConfirmOrSelectTask from '../common/promptToConfirmOrSelectTask';
import TimePeriod, { TimeParams } from '../common/TimePeriod';
import { readTimesheet } from '../common/timesheetReadWrite';
import { Task } from '../types/ProjectClockData';

function createTaskDataStr(task: Task, timeParams: TimeParams | undefined) {
  const consoleWidth = process.stdout.columns;
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
    consoleWidth,
    paddingRight,
    true
  );
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
    console.error('timesheet is empty, no task to show');
    process.exit(1);
  }

  const tasksToShow = taskDescriptor
    ? tasks.filter((task) => task.subject.match(taskDescriptor))
    : [await promptToConfirmOrSelectTask(tasks, '', 'show')];
  if (!tasksToShow) {
    console.error(
      `cannot show task(s) matching '${taskDescriptor}'; none found`
    );
    process.exit(1);
  }

  const taskStrings: string[] = [];
  tasksToShow.forEach((task) => {
    taskStrings.push(createTaskDataStr(task, projectSettings?.timeParams));
  });
  const separatorStr = `${'-'.repeat(process.stdout.columns)}`;
  console.log(createSeparatedSectionsStr(taskStrings, separatorStr));
}
