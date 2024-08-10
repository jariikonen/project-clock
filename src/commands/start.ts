import input from '@inquirer/input';
import promptToConfirm from '../common/promptToConfirm';
import { readTimeSheet, writeTimeSheet } from '../common/timeSheetReadWrite';
import { ProjectClockData, Task } from '../types/ProjectClockData';
import handleExitPromptError from '../common/handleExitPromptError';
import promptForTask from '../common/promptForTask';
import ProjectClockError from '../common/ProjectClockError';

type TaskToUse = Task | null;
type TaskDescriptorToUse = string | null;

async function promptForTaskCreation(
  reason: string
): Promise<TaskDescriptorToUse> {
  if (await promptToConfirm(`${reason}; do you want to create a new task?`)) {
    const descriptorFromUser = await input({
      message: 'enter subject for the task:',
      default: new Date().toISOString(),
    });
    return descriptorFromUser;
  }
  return null;
}

async function timeSheetIsEmpty(
  taskDescriptor: string | undefined
): Promise<TaskDescriptorToUse> {
  let taskDescriptorToUse: TaskDescriptorToUse = null;
  try {
    if (taskDescriptor) {
      if (
        await promptToConfirm(
          `time sheet is empty; do you want to create a new task, '${taskDescriptor}'?`
        )
      ) {
        return taskDescriptor;
      }
    } else {
      taskDescriptorToUse = await promptForTaskCreation('time sheet is empty');
      if (!taskDescriptorToUse) {
        console.log('exiting; no task to start');
        process.exit(0);
      }
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return taskDescriptorToUse;
}

async function getUnstartedTask(
  tasks: Task[]
): Promise<[TaskToUse, TaskDescriptorToUse]> {
  let unstartedTask: TaskToUse = null;
  let taskDescriptorToUse: TaskDescriptorToUse = null;
  try {
    const unstartedTasks = tasks.filter((task) => !task.begin);
    if (unstartedTasks.length > 0) {
      unstartedTask = await promptForTask(unstartedTasks, 'unstarted', 'start');
    }
    if (!unstartedTask) {
      taskDescriptorToUse = await promptForTaskCreation(
        'no unstarted tasks found'
      );
      if (!taskDescriptorToUse) {
        console.log('exiting; no task to start');
        process.exit(0);
      }
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return [unstartedTask, taskDescriptorToUse];
}

async function getMathchingUnstartedTask(
  tasks: Task[],
  taskDescriptor: string
): Promise<[TaskToUse, TaskDescriptorToUse]> {
  let matchingTask: TaskToUse = null;
  let taskDescriptorToUse: TaskDescriptorToUse = null;
  try {
    const matchingUnstartedTasks = tasks.filter(
      (task) => task.subject.match(taskDescriptor) && !task.begin
    );
    if (matchingUnstartedTasks.length > 0) {
      matchingTask = await promptForTask(
        matchingUnstartedTasks,
        'matching unstarted',
        'start'
      );
    }
    if (!matchingTask) {
      const alreadyStarted = tasks.find(
        (task) => task.subject === taskDescriptor
      );
      if (alreadyStarted) {
        console.error(
          `can't start task '${taskDescriptor}'; the task has already been started`
        );
        process.exit(1);
      }
      if (
        await promptToConfirm(
          `no matching unstarted task found; create a new task, '${taskDescriptor}'?`
        )
      ) {
        taskDescriptorToUse = taskDescriptor;
      } else {
        console.log('exiting; no task to start');
        process.exit(0);
      }
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return [matchingTask, taskDescriptorToUse];
}

function writeNewTimeSheet(
  timeSheetData: ProjectClockData,
  taskToStart: Task | null,
  taskDescriptor: string | null
) {
  let newTaskCreated = false;

  if (!taskToStart && taskDescriptor) {
    const { tasks } = timeSheetData;
    const alreadyExists = tasks.find((task) => task.subject === taskDescriptor);
    if (alreadyExists) {
      console.error(
        `can't create new task '${taskDescriptor}'; the task already exists`
      );
      process.exit(1);
    }

    const newTask = {
      subject: taskDescriptor,
      begin: new Date().toISOString(),
    };
    timeSheetData.tasks.push(newTask);
    newTaskCreated = true;
  } else if (taskToStart) {
    if (taskToStart.begin) {
      console.error(
        `can't start task '${taskToStart.subject}'; the task has already been started`
      );
      process.exit(1);
    }
    // eslint-disable-next-line no-param-reassign
    taskToStart.begin = new Date().toISOString();
  }

  writeTimeSheet(timeSheetData);
  if (newTaskCreated) {
    console.log(`created and started a new task '${taskDescriptor}'`);
  } else {
    console.log(`started task '${taskToStart?.subject}'`);
  }
}

/**
 * Starts the clock.
 *
 * Start a task. If the function is called without the task descriptor
 * argument, it will first look for any unstarted tasks. If a single such task
 * is found, the user is asked if this is the one to be started. If more than
 * one such task are found, user is asked which of the tasks to start. If no
 * unstarted tasks are found, user is asked if a new task should be created. If
 * user wants to create a new task, user is prompted for a subject for the new
 * task and the current timestamp is provided as the default subject.
 *
 * If task descriptor is provided, a task whose subject matches the descriptor
 * is looked for. If such a task is found, the user is confirmed if it is the
 * right task. If the task is correct, it is started. If such a task is not
 * found, the user is confirmed whether to create a new task with the task
 * descriptor as its subject. If many tasks match with the descriptor, user is
 * prompted which of the tasks to start.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function start(taskDescriptor: string | undefined) {
  const timeSheetData = readTimeSheet();
  const { tasks } = timeSheetData;

  let taskToStart: Task | null = null;
  let taskDescriptorToUse: string | null = null;
  if (tasks.length < 1) {
    taskDescriptorToUse = await timeSheetIsEmpty(taskDescriptor);
  } else if (!taskDescriptor) {
    [taskToStart, taskDescriptorToUse] = await getUnstartedTask(tasks);
  } else {
    [taskToStart, taskDescriptorToUse] = await getMathchingUnstartedTask(
      tasks,
      taskDescriptor
    );
  }
  if (taskToStart ?? taskDescriptorToUse) {
    writeNewTimeSheet(timeSheetData, taskToStart, taskDescriptorToUse);
  } else {
    throw new ProjectClockError(
      `internal error: this should not have happened (${taskToStart}, ${taskDescriptorToUse})`
    );
  }
}
