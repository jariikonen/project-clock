import ProjectClockError from '../common/ProjectClockError';
import findMatchingTask from '../common/findMatchingTask';
import getTimesheetData from '../common/getTimesheetData';
import writeTimesheet from '../common/writeTimesheet';
import { emptyTask, Task } from '../types/ProjectClockData';

function getMatchingTask(tasks: Task[], taskDescriptor: string): Task {
  let matchingTask = emptyTask;
  try {
    matchingTask = findMatchingTask(tasks, taskDescriptor);
  } catch (error) {
    if (error instanceof ProjectClockError) {
      if (
        error.message === 'ERROR: more than one task matches the descriptor'
      ) {
        console.error(error.message);
        process.exit(1);
      }
      // 'ERROR: no matching task found' is passed through
    } else {
      throw error;
    }
  }
  return matchingTask;
}

/**
 * Starts the clock.
 *
 * If the function is called without any arguments, a new task is created with
 * current timestamp as its 'subject'. If task argument is provided, a new task
 * is created with its value as the 'subject' of the task. If such task already
 * exists, the function exits with an error.
 * @param taskDescriptor
 */
export default function start(taskDescriptor: string | undefined) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  const taskDescriptorToUse = taskDescriptor ?? new Date().toISOString();
  const matchingTask = getMatchingTask(tasks, taskDescriptorToUse);

  const newTimesheetData = { ...timesheetData };
  const index = newTimesheetData.tasks.indexOf(matchingTask);
  if (!newTimesheetData.tasks[index]) {
    newTimesheetData.tasks.push({
      subject: taskDescriptorToUse,
      begin: new Date().toISOString(),
    });
    console.log(`created a new task '${taskDescriptorToUse}'`);
  } else {
    console.error(
      `ERROR: task '${newTimesheetData.tasks[index].subject}' has already been started`
    );
    process.exit(1);
  }

  writeTimesheet(newTimesheetData);
}
