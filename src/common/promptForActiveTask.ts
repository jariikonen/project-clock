import { Task } from '../types/ProjectClockData';
import handleExitPromptError from './handleExitPromptError';
import promptForTask from './promptForTask';

async function getAnyActiveTask(tasks: Task[], verb: string) {
  let foundTask: Task | null = null;
  try {
    const allActiveTasks = tasks.filter((task) => task.begin && !task.end);
    if (allActiveTasks.length > 0) {
      foundTask = await promptForTask(allActiveTasks, 'active', verb);
    }
    if (!foundTask) {
      console.error(`no active tasks found; nothing to ${verb}`);
      process.exit(1);
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return foundTask;
}

async function getMatchingActiveTask(
  tasks: Task[],
  taskDescriptor: string,
  verb: string,
  taskExists: boolean
) {
  let foundTask: Task | null = null;
  try {
    const matchingActiveTasks = tasks.filter(
      (task) => task.begin && !task.end && task.subject.match(taskDescriptor)
    );
    if (matchingActiveTasks.length > 0) {
      foundTask = await promptForTask(
        matchingActiveTasks,
        'matching active',
        verb
      );
    }
    if (!foundTask) {
      if (taskExists) {
        return null;
      }
      console.error(`no matching active tasks found; nothing to ${verb}`);
      process.exit(1);
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return foundTask;
}

/**
 * Prompts the user to confirm or select an active task. If there is just one
 * task in the `tasks` array, confirms user whether this is the correct task.
 * If it is, returns the task. If not, exits normally (exit code 0). If there
 * are more than one active task in `tasks` array, prompts user which one of
 * the tasks to select. Arguments `adjective` and `verb` are used for
 * customizing the messages shown to the user. If the matching task is known
 * to exist, this information can be passed to the function with taskExists
 * argument. In case the matching task is known to exist, but it is not an active
 * task, the function returns null. This way the caller knows that the task is
 * not active and can continue with that information.
 * @param tasks An array of task objects from which the task is selected.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param verb A verb that represents an action to be performed on tasks.
 * @param taskExists Set to true if it is known that the matching task exists.
 * @returns Task selected by user or null.
 */
export default async function promptForActiveTask(
  tasks: Task[],
  taskDescriptor: string | undefined,
  verb: string,
  taskExists: boolean
): Promise<Task | null> {
  if (!taskDescriptor) {
    return getAnyActiveTask(tasks, verb);
  }
  return getMatchingActiveTask(tasks, taskDescriptor, verb, taskExists);
}
