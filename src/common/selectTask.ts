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
