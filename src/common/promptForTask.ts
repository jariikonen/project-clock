import { Task } from '../types/ProjectClockData';
import confirm from './confirm';
import selectTask from './selectTask';

/**
 * Prompts the user for a task. If there is just one task in the `tasks` array,
 * confirms user whether this is the correct task. If is, returns the task. If
 * not, exits normally (code 0) with a message "nothing to VERB". If there are
 * more than one task in tasks, prompts user which one of the tasks to select.
 * Arguments `adjective` and `verb` are used for customizing the messages shown
 * to the user. Returns null if there are no tasks in the `tasks` array.
 * @param tasks An array of task objects from which the task is selected.
 * @param adjective An adjective that describes the type of task being sought.
 * @param verb A verb that represents an action to be performed on tasks.
 * @returns Task selected by user or null.
 */
export default async function promptForTask(
  tasks: Task[],
  adjective: string,
  verb: string
): Promise<Task | null> {
  if (tasks.length === 1) {
    if (
      await confirm(
        `there is one ${adjective} task on the time sheet (${tasks[0].subject.substring(0, 15)}); ${verb} this task?`
      )
    ) {
      return tasks[0];
    }
    console.log(`nothing to ${verb}`);
    process.exit(0);
  }
  if (tasks.length > 1) {
    const selectedTask = await selectTask(
      tasks,
      `there are more than one ${adjective} task on the time sheet; select the task to ${verb}:`
    );
    return selectedTask;
  }
  return null;
}
