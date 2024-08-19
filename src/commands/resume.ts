import { TaskStateType } from '../common/filterTasks';
import getTaskOfType from '../common/getTaskOfType';
import {
  isResumed,
  isStarted,
  isSuspended,
  isUnstarted,
} from '../common/taskState';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { Task } from '../types/ProjectClockData';

function resumeTask(task: Task): void {
  // after filtering the task is known to be resumable (suspended or stopped)
  // suspended
  if (isSuspended(task)) {
    if (task.resume) {
      task.resume.push(new Date().toISOString());
    } else {
      // eslint-disable-next-line no-param-reassign
      task.resume = [new Date().toISOString()];
    }
    return;
  }
  // stopped
  if (task.end) {
    if (task.suspend) {
      task.suspend.push(task.end);
    } else {
      // eslint-disable-next-line no-param-reassign
      task.suspend = [task.end];
    }
    const newTimestamp = new Date().toISOString();
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
 * Resumes a task.
 *
 * If the function is called without the task descriptor argument, it will look
 * for active tasks (i.e., a task that is started but not stopped). If one such
 * task is found, the user is confirmed whether this is the correct task. If it
 * is, the task is suspended by adding a new timestamp value to the "suspend"
 * array. If more than one such task are found, the user is prompted which
 * one of the tasks to suspend. If no such task is found, the function exits
 * with an error.
 *
 * If task descriptor is provided a tasks whose subject matches the descriptor
 * is looked for. If such a task is found the user is confirmed whether it is
 * the correct task to suspend. if it is, the task is stopped. If more than one
 * such task is found, the user is prompted which one of the tasks to suspend.
 * If no such task is found, the function exits with an error.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function resume(taskDescriptor: string | undefined) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  if (tasks.length < 1) {
    console.error('timesheet is empty, nothing to resume');
    process.exit(1);
  }

  const existingTask = tasks.find((task) => task.subject === taskDescriptor);
  const taskToResume = await getTaskOfType(
    tasks,
    TaskStateType.Resumable,
    taskDescriptor,
    'resume',
    !!existingTask
  );
  if (taskToResume) {
    resumeTask(taskToResume);
    writeTimesheet(timesheetData);
    console.log(`resumed task '${taskToResume.subject}'`);
    process.exit(0);
  }
  if (isUnstarted(existingTask)) {
    console.error(
      `can't resume task '${taskDescriptor}'; the task hasn't even been started yet`
    );
  }
  if (isStarted(existingTask)) {
    console.error(
      `can't resume task '${taskDescriptor}'; the task has been started but not suspended`
    );
  }
  if (isResumed(existingTask)) {
    console.error(
      `can't resume task '${taskDescriptor}'; the task has already been resumed`
    );
  }
  process.exit(1);
}
