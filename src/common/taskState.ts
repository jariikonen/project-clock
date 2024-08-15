import { Task } from '../types/ProjectClockData';

export function isUnstarted(task?: Task) {
  return !task?.begin;
}

export function isStarted(task?: Task) {
  return !!task?.begin && !task.suspend && !task.end;
}

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

export function isResumed(task?: Task) {
  return (
    task?.resume &&
    task.suspend &&
    !task.end &&
    task.resume.length === task.suspend.length
  );
}

export function isStopped(task?: Task) {
  return !!task?.end;
}

export function isActive(task?: Task) {
  return task?.begin && !task.end;
}

export function isSuspendable(task?: Task) {
  return isStarted(task) ?? isResumed(task) ?? isStopped(task);
}
