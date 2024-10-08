import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import getTaskOfType from '../common/getTaskOfType';
import { TaskStateType } from '../common/filterTasks';
import { Task } from '../types/ProjectClockData';
import {
  messageWithTruncatedPart,
  outputError,
  outputSuccess,
} from '../common/outputFormatting';

function stopTask(task: Task): void {
  const newTimestamp = new Date().toISOString();
  // suspended
  if (
    (!!task.suspend && !task.resume && !task.end) ||
    (!!task.suspend &&
      !!task.resume &&
      !task.end &&
      task.suspend.length > task.resume.length)
  ) {
    if (task.resume) {
      task.resume.push(newTimestamp);
    } else {
      // eslint-disable-next-line no-param-reassign
      task.resume = [newTimestamp];
    }
  }
  // eslint-disable-next-line no-param-reassign
  task.end = newTimestamp;
}

/**
 * Stops the clock.
 *
 * If the function is called without the task descriptor argument, it will look
 * for active tasks (i.e., a task that is started but not stopped). If only one
 * such task is found, the user is confirmed whether this is the correct task.
 * If it is, the task is stopped by setting the "end" value of the task to
 * current timestamp. If more than one such task are found, the user is
 * prompted which one of the tasks to stop. If no such task is found, the
 * function exits with an error.
 *
 * If the task descriptor is provided an active task whose subject matches the
 * descriptor is looked for. If only one such task is found the user is
 * confirmed whether it is the correct task to stop. if the task is correct, it
 * is stopped. If more than one such task is found, the user is prompted which
 * one of the tasks to stop. If no such task is found, the function exits with
 * an error.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function stop(taskDescriptor: string | undefined) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  if (tasks.length < 1) {
    outputError('Timesheet is empty, nothing to stop.');
    process.exit(1);
  }

  const existingTask = tasks.find((task) => task.subject === taskDescriptor);
  const taskToStop = await getTaskOfType(
    tasks,
    TaskStateType.Active,
    taskDescriptor,
    'stop',
    !!existingTask
  );
  if (taskToStop) {
    stopTask(taskToStop);
    writeTimesheet(timesheetData);
    outputSuccess(
      messageWithTruncatedPart(["Stopped task '", taskToStop.subject, "'."], 1)
    );
    process.exit(0);
  }
  if (!existingTask?.begin) {
    outputError(
      messageWithTruncatedPart(
        [
          "Cannot stop task '",
          taskDescriptor,
          "'; the task hasn't been started yet.",
        ],
        1
      )
    );
  }
  if (existingTask?.end) {
    console.error(
      messageWithTruncatedPart(
        [
          "Cannot stop task '",
          taskDescriptor,
          "'; the task has already been stopped.",
        ],
        1
      )
    );
  }
  process.exit(1);
}
