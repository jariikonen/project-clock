import { Task } from '../types/ProjectClockData';
import ProjectClockError from './ProjectClockError';

/**
 * Returns active tasks (i.e., started but not stopped tasks).
 * @param tasks Array of Task objects from which to search.
 * @returns Active tasks (i.e., started but not stopped tasks). An empty array
 *    if no active tasks were found.
 * @throws ProjectClockError with a descriptive message ("ERROR: 'begin' is not
 *    a valid timestamp (begin_timestamp)", "ERROR: 'end' is not a valid
 *    timestamp (end_timestamp)", "ERROR: begin date is later than end date
 *    (task_subject)", "ERROR: more than one active tasks" or "ERROR: no active
 *    task found").
 */
export default function findActiveTask(tasks: Task[]) {
  const activeTasks = tasks.filter((task) => task.begin && !task.end);

  if (activeTasks.length > 1) {
    throw new ProjectClockError('ERROR: more than one active task');
  }
  if (activeTasks.length === 0) {
    throw new ProjectClockError('ERROR: no active task found');
  }
  return activeTasks[0];
}
