import { Task } from '../types/ProjectClockData';
import ProjectClockError from './ProjectClockError';

/**
 * Returns a single task whose 'subject' matches the taskDescriptor parameter.
 * @param tasks Array of Task objects from which to search.
 * @param taskDescriptor RegEx matcher that should match the 'subject' of the
 *    task.
 * @returns Task objects whose 'subject' matches the taskDescriptor parameter.
 *    An empty array if no matches were found.
 * @throws ProjectClockError with a descriptive message ('more than one task
 *    matches the descriptor' or 'no matching task found').
 */
export default function findMatchingTask(
  tasks: Task[],
  taskDescriptor: string
): Task {
  const matchingTasks = tasks.filter((task) =>
    task.subject.match(taskDescriptor)
  );
  if (matchingTasks.length > 1) {
    throw new ProjectClockError('more than one task matches the descriptor');
  }
  if (matchingTasks.length === 0) {
    throw new ProjectClockError('no matching task found');
  }
  return matchingTasks[0];
}
