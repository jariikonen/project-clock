import input from '@inquirer/input';
import promptToConfirm from '../common/promptToConfirm';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { ProjectClockData, Task } from '../types/ProjectClockData';
import handleExitPromptError from '../common/handleExitPromptError';
import promptToConfirmOrSelectTask from '../common/promptToConfirmOrSelectTask';
import ProjectClockError from '../common/ProjectClockError';
import {
  messageWithTruncatedPart,
  outputError,
  outputNotice,
  outputSuccess,
  sideHeadingText,
} from '../common/outputFormatting';
import exitWithNothingToDo from '../common/exitWithNothingToDo';
import status from './status';

type TaskToUse = Task | null;
type TaskDescriptorToUse = string | null;

async function promptToCreateNewTask(
  reasonMessage: string
): Promise<TaskDescriptorToUse> {
  outputNotice(reasonMessage);
  if (await promptToConfirm('Do you want to create a new task?')) {
    const descriptorFromUser = await input({
      message: 'Enter subject for the task:',
      default: new Date().toISOString(),
    });
    return descriptorFromUser;
  }
  return null;
}

async function confirmTaskDescriptor(taskDescriptor: string) {
  outputNotice(
    sideHeadingText('Task descriptor argument received', taskDescriptor)
  );
  return promptToConfirm(
    'Do you want to create a new task with this task descriptor as its subject?'
  );
}

async function timesheetIsEmpty(
  taskDescriptor: string | undefined
): Promise<TaskDescriptorToUse> {
  let taskDescriptorToUse: TaskDescriptorToUse = null;
  try {
    if (taskDescriptor) {
      outputNotice('Timesheet is empty.');
      if (await confirmTaskDescriptor(taskDescriptor)) {
        return taskDescriptor;
      }
      exitWithNothingToDo('start');
    } else {
      taskDescriptorToUse = await promptToCreateNewTask('Timesheet is empty.');
      if (!taskDescriptorToUse) {
        exitWithNothingToDo('start');
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
      unstartedTask = await promptToConfirmOrSelectTask(
        unstartedTasks,
        'unstarted',
        'start'
      );
    }
    if (!unstartedTask) {
      taskDescriptorToUse = await promptToCreateNewTask(
        'No unstarted tasks found.'
      );
      if (!taskDescriptorToUse) {
        exitWithNothingToDo('start');
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
      matchingTask = await promptToConfirmOrSelectTask(
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
        outputError(
          messageWithTruncatedPart(
            [
              "Cannot start task '",
              taskDescriptor,
              "'; the task has already been started.",
            ],
            1
          )
        );
        process.exit(1);
      }
      if (await confirmTaskDescriptor(taskDescriptor)) {
        taskDescriptorToUse = taskDescriptor;
      } else {
        exitWithNothingToDo('start');
      }
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return [matchingTask, taskDescriptorToUse];
}

function writeNewTimesheet(
  timesheetData: ProjectClockData,
  taskToStart: Task | null,
  taskDescriptor: string | null
) {
  let newTaskCreated = false;

  if (!taskToStart && taskDescriptor) {
    const { tasks } = timesheetData;
    const alreadyExists = tasks.find((task) => task.subject === taskDescriptor);
    if (alreadyExists) {
      outputError(
        messageWithTruncatedPart(
          [
            "Cannot create a new task '",
            taskDescriptor,
            "'; the task already exists.",
          ],
          1
        )
      );
      process.exit(1);
    }

    const newTask = {
      subject: taskDescriptor,
      begin: new Date().toISOString(),
    };
    timesheetData.tasks.push(newTask);
    newTaskCreated = true;
  } else if (taskToStart) {
    if (taskToStart.begin) {
      outputError(
        messageWithTruncatedPart(
          [
            "Cannot start task '",
            taskToStart.subject,
            "'; the task has already been started.",
          ],
          1
        )
      );
      process.exit(1);
    }
    // eslint-disable-next-line no-param-reassign
    taskToStart.begin = new Date().toISOString();
  }

  writeTimesheet(timesheetData);
  if (newTaskCreated) {
    outputSuccess(
      messageWithTruncatedPart(
        ["Created and started a new task '", taskDescriptor, "'."],
        1
      )
    );
  } else {
    outputSuccess(
      messageWithTruncatedPart(
        ["Started task '", taskToStart?.subject, "'."],
        1
      )
    );
  }
  status({});
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
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  let taskToStart: Task | null = null;
  let taskDescriptorToUse: string | null = null;
  if (tasks.length < 1) {
    taskDescriptorToUse = await timesheetIsEmpty(taskDescriptor);
  } else if (!taskDescriptor) {
    [taskToStart, taskDescriptorToUse] = await getUnstartedTask(tasks);
  } else {
    [taskToStart, taskDescriptorToUse] = await getMathchingUnstartedTask(
      tasks,
      taskDescriptor
    );
  }
  if (taskToStart ?? taskDescriptorToUse) {
    writeNewTimesheet(timesheetData, taskToStart, taskDescriptorToUse);
  } else {
    throw new ProjectClockError(
      `Internal error: this should not have happened (${taskToStart}, ${taskDescriptorToUse}).`
    );
  }
}
