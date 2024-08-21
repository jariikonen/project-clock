import { Task } from '../types/ProjectClockData';
import { filterTasks, TaskStateType } from './filterTasks';
import handleExitPromptError from './handleExitPromptError';
import promptToConfirmOrSelectTask from './promptToConfirmOrSelectTask';

/**
 * Filters the given tasks based on the given type and prompts the user to
 * confirm or select the found task(s). If no tasks are found the function
 * exits with an error.
 *
 * If a task matching to the task descriptor is known to exist, this
 * information can be passed to the function with taskExists argument. In case
 * the taskExists is true, but the function does not find any tasks, it returns
 * null. This way the caller knows that the task is not of the specific type
 * and can continue with that information.
 * @param tasks An array of task objects from which the task is selected.
 * @param taskType Task state type to look for.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param verb A verb that represents an action to be performed on tasks.
 * @param taskExists Set to true if it is known that a task matching the task
 *    descriptor exists.
 * @returns Task selected by user or null.
 */
export default async function getTaskOfType(
  tasks: Task[],
  taskType: TaskStateType,
  taskDescriptor: string | undefined,
  verb: string,
  taskExists: boolean
): Promise<Task | null> {
  let foundTask: Task | null = null;
  const [filteredTasks, adjective] = filterTasks(
    tasks,
    taskType,
    taskDescriptor
  );
  try {
    if (filteredTasks.length > 0) {
      foundTask = await promptToConfirmOrSelectTask(
        filteredTasks,
        adjective,
        verb
      );
    }
    if (!foundTask) {
      if (taskExists) {
        return null;
      }
      console.error(`no ${adjective} tasks found; nothing to ${verb}`);
      process.exit(1);
    }
  } catch (error) {
    handleExitPromptError(error);
  }
  return foundTask;
}
