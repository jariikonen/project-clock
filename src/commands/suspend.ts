import { TaskType } from '../common/filterTasks';
import getTaskOfType from '../common/getTaskOfType';
import { isSuspended, isUnstarted } from '../common/taskState';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { Task } from '../types/ProjectClockData';

function suspendTask(task: Task): void {
  // after filtering the task is known to be suspendable
  // started (known not to be suspended; not resumed  or stopped)
  if (!task.suspend && !task.end) {
    // eslint-disable-next-line no-param-reassign
    task.suspend = [new Date().toISOString()];
    return;
  }
  // resumed (known not to be suspended; has resume and not stopped)
  if (task.suspend && task.resume && !task.end) {
    task.suspend.push(new Date().toISOString());
    return;
  }
  // stopped
  if (task.end) {
    const newTimestamp = new Date().toISOString();
    if (task.suspend) {
      task.suspend.push(task.end);
      task.suspend.push(newTimestamp);
    } else {
      // eslint-disable-next-line no-param-reassign
      task.suspend = [task.end, newTimestamp];
    }
    if (task.resume) {
      task.resume.push(newTimestamp);
    } else {
      // eslint-disable-next-line no-param-reassign
      task.resume = [newTimestamp];
    }
    // eslint-disable-next-line no-param-reassign
    delete task.end;
  }
}

/**
 * Suspends a task.
 *
 * If the function is called without the task descriptor argument, it will look
 * for suspendable tasks (see documentation of filterTasks.ts). If only one
 * such task is found, the user is confirmed whether this is the correct task
 * to suspend. If it is, the task is suspended by adding a new timestamp value
 * to the "suspend" array. If more than one such task are found, the user is
 * prompted which one of the tasks to suspend. If no such task is found, the
 * function exits with an error.
 *
 * If task descriptor is provided a suspendable tasks whose subject matches the
 * descriptor is looked for. If such a task is found the user is confirmed
 * whether it is the correct task to suspend. if it is, the task is stopped. If
 * more than one such task is found, the user is prompted which one of the
 * tasks to suspend. If no such task is found, the function exits with an
 * error.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function suspend(taskDescriptor: string | undefined) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  if (tasks.length < 1) {
    console.error('timesheet is empty, nothing to suspend');
    process.exit(1);
  }

  const existingTask = tasks.find((task) => task.subject === taskDescriptor);
  const taskToSuspend = await getTaskOfType(
    tasks,
    TaskType.Suspendable,
    taskDescriptor,
    'suspend',
    !!existingTask
  );
  if (taskToSuspend) {
    suspendTask(taskToSuspend);
    writeTimesheet(timesheetData);
    console.log(`suspended task '${taskToSuspend.subject}'`);
    process.exit(0);
  }
  if (isUnstarted(existingTask)) {
    console.error(
      `can't suspend task '${taskDescriptor}'; the task hasn't been started yet`
    );
  }
  if (isSuspended(existingTask)) {
    console.error(
      `can't suspend task '${taskDescriptor}'; the task has already been suspended`
    );
  }
  process.exit(1);
}
