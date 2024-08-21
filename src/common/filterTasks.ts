/**
 * The Project Clock `Task` (hereafter just task) can have the following time
 * properties: `begin`, `end`, `suspend` and `resume`. `Begin` and `end` are
 * single timestamps while `suspend` and `resume` are arrays containing one to
 * many timestamps. The task can be seen as a state machine whose state
 * consists of these time properties. This state machine has the following
 * states, i.e., the possible combinations of time properties:
 *
 *    - unstarted (no time properties),
 *    - started (`begin`),
 *    - suspended (`begin`, `suspend`*n, `resume`*n-1; n > 0),
 *    - resumed (`begin`, `suspend`*n, `resume`*n+1; n >= 1) and
 *    - stopped (`begin`, `suspend`*a, `resume`*b, `end`; a = 0...n, b = a).
 *
 * In the beginning, when a task has just been created but not yet started, it
 * is unstarted. A task is started when it gets the `begin` timestamp. A task
 * becomes suspended when it gets one `suspend` timestamp (or the number of
 * `suspend` timestamps is one larger than the number of `resume` timestamps).
 * From suspended state it can move to resumed or stopped state. The task is in
 * resumed state when it gets at least one `resume` timestamp, and when the
 * number of `resume` timestamps is equal to the number of `suspend`
 * timestamps. From resumed and stopped state the task can move back to
 * suspended or to either resumed or stopped state. A started state can also
 * become stopped, without being suspended and resumed before. A stopped state
 * cannot, how ever, become started again. The states can be illustrated with
 * the following state diagram:
 *
 *                                      /-> resumed <-\
 *  unstarted -> started -> suspended <-               |
 *                       \--------------\-> stopped <-/
 *
 * Different states can be divided into the following conceptually useful
 * groups:
 *
 *    - incomplete: unstarted, started, suspended, resumed,
 *    - complete: stopped
 *    - active: started, suspended, resumed,
 *    - suspendable: started, resumed, stopped,
 *    - resumable: suspended, stopped
 *    - stoppable = active
 *
 * The task is complete when it is stopped. All other states are incomplete.
 * An active task is an incomplete task that has been started. Suspendable
 * state group consists of all states from which a task can become suspended.
 * Likewise resumable consists of all the states from which the task can be
 * resumed, and stoppable consists of all the states from which the task can be
 * stopped.
 *
 * Although a task can be moved from suspended to stopped and from stopped to
 * suspended, the statuses in the entries in the timesheet file are treated as
 * if the transfer was always through the resumed state. Stopping a suspended
 * task is done by adding both `resume` and `end` timestamps with the same time
 * value, and suspending a task from stopped state is done by first moving
 * the `end` timestamp to the end of the `suspend` array and after this adding
 * both new`resume` and `suspend` timestamps. Resuming a task from stopped
 * state is done by moving the `end` timestamp to the end of the `suspend`
 * array and adding a new `resume` timestamp.
 */

import { Task } from '../types/ProjectClockData';
import ProjectClockError from './ProjectClockError';

/** Represents the type of a task state. */
export enum TaskStateType {
  Active = 'active',
  Suspendable = 'suspendable',
  Resumable = 'resumable',
  Stoppable = 'stoppable',
  Unstarted = 'unstarted',
  Complete = 'complete',
  Incomplete = 'incomplete',
}

/**
 * Returns the active tasks found in the given task array.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getActiveTasks(tasks: Task[]) {
  return tasks.filter((task) => task.begin && !task.end);
}

/**
 * Returns the active tasks found in the given task array, which
 * match the given task descriptor.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getMatchingActiveTasks(tasks: Task[], taskDescriptor: string) {
  return tasks.filter(
    (task) => task.begin && !task.end && task.subject.match(taskDescriptor)
  );
}

/**
 * Returns the suspendable tasks found from the given task array.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getSuspendableTasks(tasks: Task[]) {
  return tasks.filter((task) => {
    // stopped
    if (task.end) {
      return true;
    }
    // started
    if (task.begin && !task.suspend && !task.end) {
      return true;
    }
    // resumed
    if (
      task.resume &&
      task.resume.length > 0 &&
      !task.end &&
      task.suspend &&
      task.suspend.length === task.resume.length
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Returns the suspendable tasks found in the given task array, which
 * match the given task descriptor.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getMatchingSuspendableTasks(
  tasks: Task[],
  taskDescriptor: string
) {
  return tasks.filter((task) => {
    // stopped
    if (task.end && task.subject.match(taskDescriptor)) {
      return true;
    }
    // started
    if (
      task.begin &&
      !task.suspend &&
      !task.end &&
      task.subject.match(taskDescriptor)
    ) {
      return true;
    }
    // resumed
    if (
      task.resume &&
      task.resume.length > 0 &&
      !task.end &&
      task.suspend &&
      task.suspend.length === task.resume.length &&
      task.subject.match(taskDescriptor)
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Returns the resumbable tasks found in the given task array.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getResumableTasks(tasks: Task[]) {
  return tasks.filter((task) => {
    // stopped
    if (task.end) {
      return true;
    }
    // suspended
    if (
      (!!task.suspend && !task.resume && !task.end) ||
      (!!task.suspend &&
        !!task.resume &&
        task.suspend.length > task.resume?.length &&
        !task.end)
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Returns the resumable tasks found in the given task array, which
 * match the given task descriptor.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getMatchingResumableTasks(
  tasks: Task[],
  taskDescriptor: string
) {
  return tasks.filter((task) => {
    // stopped
    if (task.end && task.subject.match(taskDescriptor)) {
      return true;
    }
    // suspended
    if (
      (!!task.suspend &&
        !task.resume &&
        !task.end &&
        !!task.subject.match(taskDescriptor)) ||
      (!!task.suspend &&
        !!task.resume &&
        task.suspend.length > task.resume?.length &&
        !task.end &&
        !!task.subject.match(taskDescriptor))
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Returns the stoppable/active tasks found in the given task array.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getStoppableTasks(tasks: Task[]) {
  return getActiveTasks(tasks);
}

/**
 * Returns the stoppable/active tasks found in the given task array, which
 * match the given task descriptor.
 * @param tasks Array of tasks.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function getMatchingStoppableTasks(
  tasks: Task[],
  taskDescriptor: string
) {
  return getMatchingActiveTasks(tasks, taskDescriptor);
}

/**
 * Filters tasks in the given task array based on the given task state type. If
 * task descriptor is given, the tasks are also filtered based on that and the
 * task state type.
 * @param tasks Array of tasks.
 * @param taskType Task state type based on which the tasks are filtered.
 * @param taskDescriptor A string that is expected to match the task subject.
 */
export function filterTasks(
  tasks: Task[],
  taskType: TaskStateType,
  taskDescriptor = ''
): [Task[], string] {
  switch (taskType) {
    case TaskStateType.Active:
    case TaskStateType.Stoppable:
      return taskDescriptor
        ? [getMatchingActiveTasks(tasks, taskDescriptor), 'matching active']
        : [getActiveTasks(tasks), 'active'];
    case TaskStateType.Suspendable:
      return taskDescriptor
        ? [
            getMatchingSuspendableTasks(tasks, taskDescriptor),
            'matching suspendable',
          ]
        : [getSuspendableTasks(tasks), 'suspendable'];
    case TaskStateType.Resumable:
      return taskDescriptor
        ? [
            getMatchingResumableTasks(tasks, taskDescriptor),
            'matching resumable',
          ]
        : [getResumableTasks(tasks), 'resumable'];
    default:
      throw new ProjectClockError('switch ran out of options');
  }
}
