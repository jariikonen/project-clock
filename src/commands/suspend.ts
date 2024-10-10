import { TaskStateType } from '../common/filterTasks';
import getTaskOfType from '../common/getTaskOfType';
import {
  messageWithTruncatedPart,
  outputError,
  outputSuccess,
} from '../common/outputFormatting';
import { isSuspended, isUnstarted } from '../common/taskState';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { Task } from '../types/ProjectClockData';
import status from './status';

interface SuspendOptions {
  includeCompleted?: false;
  includeStopped?: false;
}

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
export default async function suspend(
  taskDescriptor: string | undefined,
  options: SuspendOptions
) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  if (tasks.length < 1) {
    outputError('Timesheet is empty, nothing to suspend.');
    process.exit(1);
  }

  const existingTask = tasks.find((task) => task.subject === taskDescriptor);
  const taskStateType =
    taskDescriptor || options.includeCompleted || options.includeStopped // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
      ? TaskStateType.Suspendable
      : TaskStateType.ActiveSuspendable;
  const taskToSuspend = await getTaskOfType(
    tasks,
    taskStateType,
    taskDescriptor,
    'suspend',
    !!existingTask
  );
  if (taskToSuspend) {
    suspendTask(taskToSuspend);
    writeTimesheet(timesheetData);
    outputSuccess(
      messageWithTruncatedPart(
        ["Suspended task '", taskToSuspend.subject, "'."],
        1
      )
    );
    status({});
    process.exit(0);
  }
  if (isUnstarted(existingTask)) {
    outputError(
      messageWithTruncatedPart(
        [
          "Cannot suspend task '",
          taskDescriptor,
          "'; the task hasn't been started yet.",
        ],
        1
      )
    );
  }
  if (isSuspended(existingTask)) {
    outputError(
      messageWithTruncatedPart(
        [
          "Cannot suspend task '",
          taskDescriptor,
          "'; the task has already been suspended.",
        ],
        1
      )
    );
  }
  process.exit(1);
}
