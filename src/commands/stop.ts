import confirmTask from '../common/confirm';
import { emptyTask, ProjectClockData, Task } from '../types/ProjectClockData';
import handleExitPromptError from '../common/handleExitPromptError';
import selectTask from '../common/selectTask';
import { readTimeSheet, writeTimeSheet } from '../common/timeSheetReadWrite';

async function getActiveTask(tasks: Task[]): Promise<Task | null> {
  const activeTasks = tasks.filter((task) => task.begin && !task.end);
  if (activeTasks.length === 1) {
    if (
      await confirmTask(
        `there is one active task on the time sheet (${activeTasks[0].subject.substring(0, 15)}); stop this task?`
      )
    ) {
      return activeTasks[0];
    }
    console.log('nothing to stop');
    process.exit(0);
  }
  if (activeTasks.length > 1) {
    const selectedActiveTask = await selectTask(
      activeTasks,
      'there are more than one active task on the time sheet; select the task to stop:'
    );
    return selectedActiveTask;
  }
  return null;
}

async function getMatchingActiveTask(
  tasks: Task[],
  taskDescriptor: string
): Promise<Task | null> {
  const matchingActiveTasks = tasks.filter(
    (task) => task.begin && !task.end && task.subject.match(taskDescriptor)
  );
  if (matchingActiveTasks.length === 1) {
    if (
      await confirmTask(
        `there is one matching active task on the time sheet (${matchingActiveTasks[0].subject.substring(0, 15)}); stop this task?`
      )
    ) {
      return matchingActiveTasks[0];
    }
    console.log('nothing to stop');
    process.exit(0);
  }
  if (matchingActiveTasks.length > 1) {
    const selectedMatchingActiveTask = await selectTask(
      matchingActiveTasks,
      'there are more than one matching active task on the time sheet; select the task to stop:'
    );
    return selectedMatchingActiveTask;
  }
  return null;
}

function writeNewTimeSheet(
  tasks: Task[],
  timeSheetData: ProjectClockData,
  foundTask: Task | null
) {
  const newTimeSheetData = { ...timeSheetData };
  const taskToStop: Task = foundTask ?? emptyTask;

  if (taskToStop.end) {
    console.error(`task '${taskToStop.subject}' has already been stopped`);
    process.exit(1);
  } else {
    taskToStop.end = new Date().toISOString();
  }

  writeTimeSheet(newTimeSheetData);
  console.log(`stopped task '${taskToStop.subject}'`);
}

/**
 * Stops the clock.
 *
 * If the function is called without the task descriptor argument, it will look
 * for active tasks (i.e., a task that is started but not stopped). If one such
 * task is found, the user is confirmed whether this is the correct task. If it
 * is, the task is stopped by setting the "end" value of the task to current
 * timestamp. If more than one such task are found, the user is prompted which
 * one of the tasks to stop. If no such task is found, the function exits with
 * an error.
 *
 * If task descriptor is provided a tasks whose subject matches the descriptor
 * is looked for. If such a task is found the user is confirmed whether it is
 * the correct task to stop. if the task is correct, it is stopped. If more
 * than one such task is found, the user is prompted which one of the tasks to
 * stop. If no such task is found, the function exits with an error.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function stop(taskDescriptor: string | undefined) {
  const timeSheetData = readTimeSheet();
  const { tasks } = timeSheetData;

  let activeTask: Task | null = null;
  if (!taskDescriptor) {
    try {
      activeTask = await getActiveTask(tasks);
      if (!activeTask) {
        console.error('no active tasks found; nothing to stop');
        process.exit(1);
      }
    } catch (error) {
      handleExitPromptError(error);
    }
  }

  let matchingActiveTask: Task | null = null;
  if (taskDescriptor) {
    try {
      matchingActiveTask = await getMatchingActiveTask(tasks, taskDescriptor);
      if (!matchingActiveTask) {
        console.error('no matching active tasks found; nothing to stop');
        process.exit(1);
      }
    } catch (error) {
      handleExitPromptError(error);
    }
  }

  const foundTask = activeTask ?? matchingActiveTask;
  writeNewTimeSheet(tasks, timeSheetData, foundTask);
}
