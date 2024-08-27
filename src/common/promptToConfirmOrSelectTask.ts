import { Task } from '../types/ProjectClockData';
import promptToConfirm from './promptToConfirm';
import ProjectClockError from './ProjectClockError';
import promptToSelectTask from './promptToSelectTask';

function exitWithNothingToDo(verb: string) {
  console.log(`nothing to ${verb}`);
  process.exit(0);
}

/**
 * Prompts the user to confirm or select a task. If there is just one task in
 * the `tasks` array, function confirms from the user whether this is the
 * correct task. If it is, the task is returned. If not, the function exits
 * normally (code 0) with a message "nothing to VERB". If there are more than
 * one task in the `tasks` array, the function prompts the user which one of
 * the tasks to select. Arguments `adjective` and `verb` are used for
 * customizing the messages shown to the user. Throws if there are no tasks in
 * the `tasks` array.
 * @param tasks An array of task objects from which the task is selected.
 * @param adjective An adjective that describes the type of task being sought.
 * @param verb A verb that represents an action to be performed on tasks.
 * @returns Task selected by user or null.
 * @throws If the array of `tasks` argument is empty.
 */
export default async function promptToConfirmOrSelectTask(
  tasks: Task[],
  adjective: string,
  verb: string
): Promise<Task> {
  const adjectiveToUse = adjective ? `${adjective} ` : '';
  if (tasks.length === 1) {
    if (
      await promptToConfirm(
        `there is one ${adjectiveToUse}task on the timesheet (${tasks[0].subject}); ${verb} this task?`
      )
    ) {
      return tasks[0];
    }
    exitWithNothingToDo(verb);
  }
  if (tasks.length > 1) {
    const selectedTask = await promptToSelectTask(
      tasks,
      `there are more than one ${adjectiveToUse}task on the timesheet; select the task to ${verb}:`
    );
    if (selectedTask) {
      return selectedTask;
    }
    exitWithNothingToDo(verb);
  }
  throw new ProjectClockError(
    'internal error: promptForTask() must not be called with an empty tasks array'
  );
}
