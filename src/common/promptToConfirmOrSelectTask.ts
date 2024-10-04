import { Task } from '../types/ProjectClockData';
import promptToConfirm from './promptToConfirm';
import ProjectClockError from './ProjectClockError';
import promptToSelectTask from './promptToSelectTask';
import { outputMessage, sideHeadingText } from './outputFormatting';
import capitalize from './capitalize';
import exitWithNothingToDo from './exitWithNothingToDo';

function formMessage(tasks: Task[], adjective: string, verb: string): string {
  if (tasks.length === 1) {
    return `${capitalize(verb)} this task?`;
  }
  if (tasks.length > 1) {
    return `Select the task to ${verb}:`;
  }
  throw new ProjectClockError(
    'Internal error: promptForTask() must not be called with an empty tasks array.'
  );
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
 * @param message If message is given, it is used instead of a message formed
 *    from the adjective and the verb arguments.
 * @returns Task selected by user or null.
 * @throws If the array of `tasks` argument is empty.
 */
export default async function promptToConfirmOrSelectTask(
  tasks: Task[],
  adjective: string,
  verb: string,
  message?: string
): Promise<Task> {
  const adjectiveToUse = adjective ? `${adjective} ` : '';
  const messageToUse = message ?? formMessage(tasks, adjectiveToUse, verb);
  if (tasks.length === 1) {
    const description = sideHeadingText(
      `One ${adjectiveToUse}task found`,
      tasks[0].subject,
      process.stdout.columns,
      false,
      1,
      0,
      false,
      { modifiers: ['bold'] }
    );
    outputMessage(description);
    if (await promptToConfirm(messageToUse)) {
      return tasks[0];
    }
    exitWithNothingToDo(verb);
  }
  if (tasks.length > 1) {
    outputMessage(
      `There are ${tasks.length} ${adjectiveToUse}tasks on the timesheet.`
    );
    const selectedTask = await promptToSelectTask(tasks, messageToUse);
    if (selectedTask) {
      return selectedTask;
    }
    exitWithNothingToDo(verb);
  }
  throw new ProjectClockError(
    'Internal error: promptForTask() must not be called with an empty tasks array.'
  );
}
