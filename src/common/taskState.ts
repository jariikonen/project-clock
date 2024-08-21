import { Task } from '../types/ProjectClockData';

/**
 * Returns a boolean indicating whether the task is in the unstarted state or
 * not. Unstarted is the task state where the task has no other values relevant
 * to timekeeping except subject.
 */
export function isUnstarted(task?: Task) {
  return !task?.begin;
}

/**
 * Returns a boolean indicating whether the task is in the started state or not.
 * Started is the task state where the task has a begin value, but no suspend,
 * resume or end values.
 */
export function isStarted(task?: Task) {
  return !!task?.begin && !task.suspend && !task.end;
}

/**
 * Returns a boolean indicating whether the task is in the suspended state or
 * not. Suspended is the task state where the task has begin and suspend
 * values, but no end value. It may also have resume array, but in that case
 * the length of the suspend array must be larger than the length of the resume
 * array.
 */
export function isSuspended(task?: Task) {
  if (task?.suspend && !task.resume) {
    return true;
  }
  if (
    task?.resume &&
    task.suspend &&
    task.suspend?.length > task.resume.length
  ) {
    return true;
  }
  return false;
}

/**
 * Returns a boolean indicating whether the task is in the resumed state or
 * not. Resumed is the task state where the task has begin, suspend and resume
 * values, but no end value. The length of the resume array must also be as
 * long as the length of the suspend array.
 */
export function isResumed(task?: Task) {
  return (
    task?.resume &&
    task.suspend &&
    !task.end &&
    task.resume.length === task.suspend.length
  );
}

/**
 * Returns a boolean indicating whether the task is in the stopped state or
 * not. Stopped is the task state where the task has begin and end values, and
 * possibly also suspend and resume values. In a valid stopped task the lenghts
 * of the suspend and resume arrays are equal.
 */
export function isStopped(task?: Task) {
  return !!task?.end;
}

/**
 * Returns a boolean indicating whether the task is in an active state or
 * not. Active are all the states where the task has a begin value but no end
 * value. The task may also have suspend and resume values.
 */
export function isActive(task?: Task) {
  return task?.begin && !task.end;
}

/**
 * Returns a boolean indicating whether the task is in a suspendable state or
 * not. Suspendable are all the task states that can become suspended with a
 * single operation (started, resumed, stopped).
 */
export function isSuspendable(task?: Task) {
  return isStarted(task) ?? isResumed(task) ?? isStopped(task);
}
