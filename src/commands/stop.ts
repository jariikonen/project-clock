import ProjectClockError from '../common/ProjectClockError';
import findActiveTask from '../common/findActiveTask';
import findMatchingTask from '../common/findMatchingTask';
import getTimesheetData from '../common/getTimesheetData';
import writeTimesheet from '../common/writeTimesheet';
import { emptyTask, Task } from '../types/ProjectClockData';

function getActiveTask(tasks: Task[]): Task {
  let activeTask = emptyTask;
  try {
    activeTask = findActiveTask(tasks);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(error.message);
      process.exit(1);
    } else {
      throw error;
    }
  }
  return activeTask;
}

function getMatchingActiveTask(tasks: Task[], taskDescriptor: string): Task {
  let matchingTask = emptyTask;
  try {
    matchingTask = findMatchingTask(tasks, taskDescriptor);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      console.error(error.message);
      process.exit(1);
    } else {
      throw error;
    }
  }

  if (!matchingTask.begin) {
    throw new ProjectClockError(
      'ERROR: cannot stop task - the task has not been started'
    );
  }
  if (matchingTask.end) {
    throw new ProjectClockError(
      'ERROR: cannot stop task - the task has already been stopped'
    );
  }
  return matchingTask;
}

/**
 * Stops the clock.
 *
 * If the function is called without any arguments an active task (i.e., a
 * started but not stopped task) if there is only one such task, by setting
 * the "end" value of the task to current timestamp. With a task descriptor
 * as argument the function stops a task with matching "subject". If the
 * descriptor matches more than one task, function exits with an error.
 * @param taskDescriptor
 */
export default function stop(taskDescriptor: string | undefined) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  const activeTask = taskDescriptor
    ? getMatchingActiveTask(tasks, taskDescriptor)
    : getActiveTask(tasks);

  const newTimesheetData = { ...timesheetData };
  const index = newTimesheetData.tasks.indexOf(activeTask);
  const taskToChange = newTimesheetData.tasks[index];
  if (taskToChange) {
    taskToChange.end = new Date().toISOString();
    console.log(`stopped task '${taskToChange.subject}'`);
  } else {
    console.error('ERROR: something went horribly wrong');
    process.exit(1);
  }

  writeTimesheet(newTimesheetData);
}
