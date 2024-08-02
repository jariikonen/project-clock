import select, { Separator } from '@inquirer/select';
import { Task } from '../types/ProjectClockData';

type SelectChoices = (
  | {
      value: string;
      name?: string;
      description?: string;
      disabled?: boolean | string;
    }
  | Separator
)[];

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

/**
 * Creates a prompt that asks the user to select a task from the tasks given
 * in the argument 'tasks'.
 * @param tasks An array of tasks from which the user must select from.
 * @param message Message displayed to the user.
 * @returns The selected task as a promise.
 */
export default async function promptToSelectTask(
  tasks: Task[],
  message: string
): Promise<Task> {
  const choices = createChoices(tasks);
  const selectedTask = await select({
    message,
    choices,
  });
  return tasks[parseInt(selectedTask, 10)];
}
