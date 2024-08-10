import { readTimeSheet, writeTimeSheet } from '../common/timeSheetReadWrite';
import promptForActiveTask from '../common/promptForActiveTask';

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

  if (tasks.length < 1) {
    console.log('time sheet is empty, nothing to stop');
    process.exit(1);
  }

  const existingTask = tasks.find((task) => task.subject === taskDescriptor);
  const taskToStop = await promptForActiveTask(
    tasks,
    taskDescriptor,
    'stop',
    !!existingTask
  );
  if (taskToStop) {
    taskToStop.end = new Date().toISOString();
    writeTimeSheet(timeSheetData);
    console.log(`stopped task '${taskToStop.subject}'`);
    process.exit(0);
  }
  if (!existingTask?.begin) {
    console.error(
      `can't stop task '${taskDescriptor}'; the task hasn't been started yet`
    );
  }
  if (existingTask?.end) {
    console.error(
      `can't stop task '${taskDescriptor}'; the task has already been stopped`
    );
  }
  process.exit(1);
}
