import input from '@inquirer/input';
import confirm from '../common/confirm';
import selectTask from '../common/selectTask';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { emptyTask, ProjectClockData, Task } from '../types/ProjectClockData';
import handleExitPromptError from '../common/handleExitPromptError';

async function getUnstartedTask(tasks: Task[]): Promise<Task | null> {
  const unstartedTasks = tasks.filter((task) => !task.begin);
  if (unstartedTasks.length === 1) {
    if (
      await confirm(
        `there is one unstarted task on the timesheet (${unstartedTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return unstartedTasks[0];
    }
    return null;
  }
  if (unstartedTasks.length > 1) {
    const selectedUnstartedTask = await selectTask(
      unstartedTasks,
      'there are more than one unstarted task on the timesheet; select the task to start:'
    );
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
      await confirm(
        `there is one matching unstarted task on the timesheet (${matchingTasks[0].subject.substring(0, 15)}); start this task?`
      )
    ) {
      return matchingTasks[0];
    }
    return null;
  }
  if (matchingTasks.length > 1) {
    const selectedMatchingTask = await selectTask(
      matchingTasks,
      'there are more than one matching task on the timesheet; select the task to start:'
    );
    return selectedMatchingTask;
  }
  return null;
}

function writeNewTimesheet(
  tasks: Task[],
  timesheetData: ProjectClockData,
  foundTask: Task | null,
  taskDescriptor: string
) {
  const newTimesheetData = { ...timesheetData };
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
    newTimesheetData.tasks.push(taskToStart);
    newTaskCreated = true;
  } else if (taskToStart.begin) {
    console.error(`task '${taskToStart.subject}' has already been started`);
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
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  let unstartedTask: Task | null = null;
  let taskDescriptorToUse = '';
  if (!taskDescriptor) {
    try {
      unstartedTask = await getUnstartedTask(tasks);
      if (!unstartedTask) {
        taskDescriptorToUse = await promptForTaskDescriptor(
          'no unstarted tasks found; enter subject for the task:'
        );
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
  writeNewTimesheet(tasks, timesheetData, foundTask, taskDescriptorToUse);
}
