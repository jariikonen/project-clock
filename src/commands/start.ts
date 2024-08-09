import input from '@inquirer/input';
import confirm from '../common/confirm';
import selectTask from '../common/selectTask';
import { readTimeSheet, writeTimeSheet } from '../common/timeSheetReadWrite';
import { emptyTask, ProjectClockData, Task } from '../types/ProjectClockData';
import handleExitPromptError from '../common/handleExitPromptError';

async function getUnstartedTask(tasks: Task[]): Promise<Task | null> {
  const unstartedTasks = tasks.filter((task) => !task.begin);
  if (unstartedTasks.length === 1) {
    if (
      await confirm(
        `there is one unstarted task on the time sheet (${unstartedTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return unstartedTasks[0];
    }
    return null;
  }
  if (unstartedTasks.length > 1) {
    const selectedUnstartedTask = await selectTask(
      unstartedTasks,
      'there are more than one unstarted task on the time sheet; select the task to start:'
    );
    return selectedUnstartedTask;
  }
  return null;
}

async function getMatchingUnstartedTask(
  tasks: Task[],
  taskDescriptor: string
): Promise<Task | null> {
  const matchingTasks = tasks.filter(
    (task) => task.subject.match(taskDescriptor) && !task.begin
  );
  if (matchingTasks.length === 1) {
    if (
      await confirm(
        `there is one matching unstarted task on the time sheet (${matchingTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return matchingTasks[0];
    }
    return null;
  }
  if (matchingTasks.length > 1) {
    const selectedMatchingTask = await selectTask(
      matchingTasks,
      'there are more than one matching task on the time sheet; select the task to start:'
    );
    return selectedMatchingTask;
  }
  return null;
}

function writeNewTimeSheet(
  tasks: Task[],
  timeSheetData: ProjectClockData,
  foundTask: Task | null,
  taskDescriptor: string
) {
  const newTimeSheetData = { ...timeSheetData };
  let taskToStart: Task = foundTask ?? emptyTask;
  let newTaskCreated = false;

  if (!taskToStart.subject && taskDescriptor) {
    const alreadyExists = tasks.find((task) => task.subject === taskDescriptor);
    if (alreadyExists) {
      console.error(
        `cannot create task; task '${taskDescriptor}' already exists`
      );
      process.exit(1);
    }
    taskToStart = {
      subject: taskDescriptor,
      begin: new Date().toISOString(),
    };
    newTimeSheetData.tasks.push(taskToStart);
    newTaskCreated = true;
  } else if (taskToStart.begin) {
    console.error(`task '${taskToStart.subject}' has already been started`);
    process.exit(1);
  } else {
    taskToStart.begin = new Date().toISOString();
  }

  writeTimeSheet(newTimeSheetData);
  if (newTaskCreated) {
    console.log(`created and started a new task '${taskToStart.subject}'`);
  } else {
    console.log(`started task '${taskToStart.subject}'`);
  }
}

async function promptForTaskCreation(): Promise<string> {
  if (
    await confirm('no unstarted tasks found; do you want to create a new task?')
  ) {
    const descriptorFromUser = await input({
      message: 'enter subject for the task:',
      default: new Date().toISOString(),
    });
    return descriptorFromUser;
  }
  return '';
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

  let unstartedTask: Task | null = null;
  let taskDescriptorToUse = '';
  if (!taskDescriptor) {
    try {
      unstartedTask = await getUnstartedTask(tasks);
      if (!unstartedTask) {
        taskDescriptorToUse = await promptForTaskCreation();
        if (!taskDescriptorToUse) {
          console.log('exiting; no task to start');
          process.exit(0);
        }
      }
    } catch (error) {
      handleExitPromptError(error);
    }
  }

  let matchingTask: Task | null = null;
  if (taskDescriptor) {
    try {
      matchingTask = await getMatchingUnstartedTask(tasks, taskDescriptor);
      if (!matchingTask) {
        if (
          await confirm(
            `no matching unstarted task found; create a new task '${taskDescriptor}'?`
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
  }

  const foundTask = unstartedTask ?? matchingTask;
  writeNewTimeSheet(tasks, timeSheetData, foundTask, taskDescriptorToUse);
}
