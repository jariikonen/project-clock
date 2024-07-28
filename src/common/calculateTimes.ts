import { Task } from '../types/ProjectClockData';
import ProjectClockError from './ProjectClockError';

interface TaskStatus {
  task: string;
  status:
    | 'not started'
    | 'started'
    | 'suspended'
    | 'resumed'
    | 'complete'
    | undefined;
  timeSpent: number;
}

const emptyTaskStatus = { task: '', status: undefined, timeSpent: 0 };

function getTaskSubjectStr(task: Task) {
  return task.subject.length > 15
    ? `${task.subject.slice(0, 15)}...`
    : task.subject;
}

function calculateDifference(
  startDate: Date,
  endDate: Date,
  task: Task
): number {
  if (startDate > endDate) {
    throw new ProjectClockError(
      `ERROR: invalid time period ${startDate.toLocaleString()}-${endDate.toLocaleString()} (${getTaskSubjectStr(task)}); start date is bigger than end date`
    );
  }
  return endDate.getTime() - startDate.getTime();
}

function handleSuspendAndResume(
  begin: string,
  suspend: string[],
  resume: string[] | undefined,
  end: string | undefined,
  task: Task
): TaskStatus {
  const beginDate = new Date(begin);
  const taskStatus: TaskStatus = { ...emptyTaskStatus, task: task.subject };
  if (suspend[0]) {
    taskStatus.status = 'suspended';
    taskStatus.timeSpent = calculateDifference(
      beginDate,
      new Date(suspend[0]),
      task
    );
  }
  if (suspend.length > 1 && resume) {
    resume.forEach((resumeDateStr, i) => {
      if (suspend[i + 1]) {
        taskStatus.status = 'suspended';
        taskStatus.timeSpent += calculateDifference(
          new Date(resumeDateStr),
          new Date(suspend[i + 1]),
          task
        );
      } else if (end) {
        taskStatus.status = 'complete';
        taskStatus.timeSpent += calculateDifference(
          new Date(resumeDateStr),
          new Date(end),
          task
        );
      } else {
        taskStatus.status = 'resumed';
        taskStatus.timeSpent += calculateDifference(
          new Date(resumeDateStr),
          new Date(),
          task
        );
      }
    });
  }
  return taskStatus;
}

/**
 * Calculates the times spent on each task.
 * @param tasks Array of Task objects.
 * @returns An array of TaskStatus objects holding the status and time usage
 *   information for each task.
 */
export default function calculateTimes(tasks: Task[]): TaskStatus[] {
  const statusArray: TaskStatus[] = tasks.map((task) => {
    const { begin, suspend, resume, end } = task;
    if (!begin) {
      if (end) {
        throw new ProjectClockError(
          `ERROR: invalid task '${getTaskSubjectStr(task)}'; end date without begin date`
        );
      }
      return { task: task.subject, status: 'not started', timeSpent: 0 };
    }
    if (!suspend && !end) {
      return {
        task: task.subject,
        status: 'started',
        timeSpent: calculateDifference(new Date(begin), new Date(), task),
      };
    }
    if (end && !suspend && !resume) {
      const beginDate = new Date(begin);
      const endDate = new Date(end);
      return {
        task: task.subject,
        status: 'complete',
        timeSpent: calculateDifference(beginDate, endDate, task),
      };
    }
    if (resume && !suspend) {
      throw new ProjectClockError(
        `ERROR: invalid task '${getTaskSubjectStr(task)}'; resume without suspend`
      );
    }
    if (suspend) {
      return handleSuspendAndResume(begin, suspend, resume, end, task);
    }
    throw new Error(
      `internal error; this should not have happened (${getTaskSubjectStr(task)})`
    );
  });

  return statusArray;
}
