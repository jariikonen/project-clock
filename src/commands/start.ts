import confirm from '@inquirer/confirm';
import input from '@inquirer/input';
import { ExitPromptError } from '@inquirer/core';
import select, { Separator } from '@inquirer/select';
import getTimesheetData from '../common/getTimesheetData';
import writeTimesheet from '../common/writeTimesheet';
import { emptyTask, Task } from '../types/ProjectClockData';

type SelectChoices = (
  | {
      value: string;
      name?: string;
      description?: string;
      disabled?: boolean | string;
    }
  | Separator
)[];

async function confirmTask(message: string): Promise<boolean> {
  const answer = await confirm({
    message,
  });
  return answer;
}

function createChoices(tasks: Task[]): SelectChoices {
  return tasks.map((task, index) => {
    const name =
      task.subject.length > 15
        ? `${task.subject.substring(0, 15)}...`
        : task.subject;
    const value = index.toString();
    const description = task.subject;
    return {
      name,
      value,
      description,
    };
  });
}

async function promptForUnstartedTask(unstartedTasks: Task[]): Promise<Task> {
  const choices = createChoices(unstartedTasks);
  const selectedUnstartedTask = await select({
    message:
      'there are more than one unstarted task on the timesheet; select the task to start',
    choices,
  });
  return unstartedTasks[parseInt(selectedUnstartedTask, 10)];
}

async function promptForMatchingTask(matchingTasks: Task[]): Promise<Task> {
  const choices = createChoices(matchingTasks);
  const selectedMatchingTask = await select({
    message:
      'there are more than one matching task on the timesheet; select the task to start',
    choices,
  });
  return matchingTasks[parseInt(selectedMatchingTask, 10)];
}

async function getUnstartedTask(tasks: Task[]): Promise<Task | null> {
  const unstartedTasks = tasks.filter((task) => !task.begin);
  if (unstartedTasks.length === 1) {
    if (
      await confirmTask(
        `there is one unstarted task on the timesheet (${unstartedTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return unstartedTasks[0];
    }
    return null;
  }
  if (unstartedTasks.length > 1) {
    const selectedUnstartedTask = await promptForUnstartedTask(unstartedTasks);
    return selectedUnstartedTask;
  }
  return null;
}

async function promptForTaskDescriptor(message: string): Promise<string> {
  const descriptorFromUser = await input({
    message,
    default: new Date().toISOString(),
  });
  return descriptorFromUser;
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
      await confirmTask(
        `there is one matching unstarted task on the timesheet (${matchingTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return matchingTasks[0];
    }
    return null;
  }
  if (matchingTasks.length > 1) {
    const selectedMatchingTask = await promptForMatchingTask(matchingTasks);
    return selectedMatchingTask;
  }
  return null;
}

function handleInquirerError(error: unknown) {
  if (!(error instanceof ExitPromptError)) {
    throw error;
  }
  console.log('exiting; user force closed the process');
  process.exit(0);
}

/**
 * Starts the clock.
 *
 * If the function is called without any arguments, and there is a single
 * unstarted task on the timesheet, it is confirmed from the user if this is
 * the task the user wants to start. If there are more than one unstarted task,
 * user is asked which of the tasks to start. If there are no unstarted tasks,
 * user is asked a subject for the task and the current timestamp is offered as
 * the default subject. If task argument is provided, a task with a matching
 * string as the subject is started, or if such task doesn't exist a new task
 * is created with parameter value as the subject of the task. If many tasks
 * match with the descriptor, user is prompted which of these tasks to start.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function start(taskDescriptor: string | undefined) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  let unstartedTask: Task | null = null;
  let taskDescriptorToUse = '';
  if (!taskDescriptor) {
    try {
      unstartedTask = await getUnstartedTask(tasks);
      if (!unstartedTask) {
        taskDescriptorToUse = await promptForTaskDescriptor(
          'no unstarted tasks found; enter subject for the task'
        );
      }
    } catch (error) {
      handleInquirerError(error);
    }
  }

  let matchingTask: Task | null = null;
  if (taskDescriptor) {
    try {
      matchingTask = await getMatchingUnstartedTask(tasks, taskDescriptor);
      if (!matchingTask) {
        if (
          await confirmTask(
            `no matching unstarted task found; create a new task '${taskDescriptor}'`
          )
        ) {
          taskDescriptorToUse = taskDescriptor;
        } else {
          console.log('exiting; no task to start');
          process.exit(0);
        }
      }
    } catch (error) {
      handleInquirerError(error);
    }
  }

  const newTimesheetData = { ...timesheetData };
  const foundTask = unstartedTask ?? matchingTask;
  let taskToStart: Task = foundTask ?? emptyTask;
  let newTaskCreated = false;

  if (!taskToStart.subject && taskDescriptorToUse) {
    const alreadyExists = tasks.find(
      (task) => task.subject === taskDescriptorToUse
    );
    if (alreadyExists) {
      console.error(
        `ERROR: cannot create task; task '${taskDescriptorToUse}' already exists`
      );
      process.exit(1);
    }
    taskToStart = {
      subject: taskDescriptorToUse,
      begin: new Date().toISOString(),
    };
    newTimesheetData.tasks.push(taskToStart);
    newTaskCreated = true;
  } else if (taskToStart.begin) {
    console.error(
      `ERROR: task '${taskToStart.subject}' has already been started`
    );
    process.exit(1);
  } else {
    taskToStart.begin = new Date().toISOString();
  }

  writeTimesheet(newTimesheetData);
  if (newTaskCreated) {
    console.log(`created and started a new task '${taskToStart.subject}'`);
  } else {
    console.log(`started task '${taskToStart.subject}'`);
  }
}
