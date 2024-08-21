import { TaskStatus } from './calculateTimes';

/**
 * Returns the total amount of time spent on tasks listed in the times array.
 * @param times Array of TaskStatus objects that contain task status and time
 *    usage information.
 */
export default function calculateTotalTime(times: TaskStatus[]) {
  return times.reduce((accum, task) => accum + task.timeSpent, 0);
}
