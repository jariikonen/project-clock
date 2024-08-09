import { Task } from '../types/ProjectClockData';
import handleExitPromptError from './handleExitPromptError';
import promptForTask from './promptForTask';

/**
 * Prompts the user for an active task. If there is just one task in the
 * `tasks` array, confirms user whether this is the correct task. If is,
 * returns the task. If not, exits normally (code 0) with a message "nothing to
 * VERB". If there are more than one task in tasks, prompts user which one of
 * the tasks to select. Arguments `adjective` and `verb` are used for
 * customizing the messages shown to the user. Returns null if there are no
 * tasks in the `tasks` array.
 * @param tasks An array of task objects from which the task is selected.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param verb A verb that represents an action to be performed on tasks.
 * @returns Task selected by the user.
 */
export default async function promptForActiveTask(
  tasks: Task[],
  taskDescriptor: string | undefined,
  verb: string
) {
  let activeTask: Task | null = null;
  if (!taskDescriptor) {
    try {
      const activeTasks = tasks.filter((task) => task.begin && !task.end);
      activeTask = await promptForTask(activeTasks, 'active', verb);
      if (!activeTask) {
        console.error(`no active tasks found; nothing to ${verb}`);
        process.exit(1);
      }
    } catch (error) {
      handleExitPromptError(error);
    }
  }

  let matchingActiveTask: Task | null = null;
  if (taskDescriptor) {
    try {
      const matchingActiveTasks = tasks.filter(
        (task) => task.begin && !task.end && task.subject.match(taskDescriptor)
      );
      matchingActiveTask = await promptForTask(
        matchingActiveTasks,
        'matching active',
        verb
      );
      if (!matchingActiveTask) {
        console.error(`no matching active tasks found; nothing to ${verb}`);
        process.exit(1);
      }
    } catch (error) {
      handleExitPromptError(error);
    }
  }

  return activeTask ?? matchingActiveTask;
}
