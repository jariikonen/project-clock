import { Task } from '../types/ProjectClockData';
import ProjectClockError from './ProjectClockError';

export interface TaskStatus {
  task: string;
  status:
    | 'unstarted'
    | 'started'
    | 'suspended'
    | 'resumed'
    | 'completed'
    | undefined;
  timeSpent: number;
}

const emptyTaskStatus = { task: '', status: undefined, timeSpent: 0 };

function getTaskSubjectStr(task: Task) {
  return task.subject.length > 25
    ? `${task.subject.slice(0, 22)}...`
    : task.subject;
}

function calculateDifference(
  startDate: Date,
  endDate: Date,
  task: Task
): number {
  if (startDate > endDate) {
    throw new ProjectClockError(
      `invalid time period '${startDate.toISOString()}' => '${endDate.toISOString()}' (${getTaskSubjectStr(task)}); start date is later than end date`
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
  if (suspend.length === 1 && resume?.length === 1) {
    if (!end) {
      taskStatus.status = 'resumed';
      taskStatus.timeSpent += calculateDifference(
        new Date(resume[0]),
        new Date(),
        task
      );
    } else {
      taskStatus.status = 'completed';
      taskStatus.timeSpent += calculateDifference(
        new Date(resume[0]),
        new Date(end),
        task
      );
    }
  } else if (suspend.length > 1 && resume) {
    resume.forEach((resumeDateStr, i) => {
      if (suspend[i + 1]) {
        taskStatus.status = 'suspended';
        taskStatus.timeSpent += calculateDifference(
          new Date(resumeDateStr),
          new Date(suspend[i + 1]),
          task
        );
      } else if (end) {
        taskStatus.status = 'completed';
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

function checkTask(task: Task) {
  const { begin, suspend, resume, end } = task;
  if (suspend && !Array.isArray(suspend)) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; suspend field is not an array`
    );
  }
  if (resume && !Array.isArray(resume)) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; resume field is not an array`
    );
  }
  if (end && !begin) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; end date without begin date`
    );
  }
  if (suspend && !begin) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; suspend date(s) without begin date`
    );
  }
  const resumeNumber = resume ? resume.length : 0;
  if (suspend && end && resumeNumber !== suspend.length) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; suspend and end without enough resumes`
    );
  }
  if (resume && !begin) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; resume date(s) without begin date`
    );
  }
  if (resume && !suspend) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; resume without suspend`
    );
  }
  if (suspend && resume && resume.length > suspend.length) {
    throw new ProjectClockError(
      `invalid task '${getTaskSubjectStr(task)}'; resumed more times than suspended`
    );
  }
  if (suspend && resume) {
    suspend.forEach((suspendDateStr, i) => {
      if (resume[i]) {
        const suspendDate = new Date(suspendDateStr);
        const resumeDate = new Date(resume[i]);
        if (suspendDate.getTime() > resumeDate.getTime()) {
          throw new ProjectClockError(
            `invalid task '${getTaskSubjectStr(task)}'; suspend date (${suspendDate.toISOString()}) is later than resume date (${resumeDate.toISOString()})`
          );
        }
      }
    });
  }
}

/**
 * Calculates the times spent on each task.
 * @param tasks Array of Task objects.
 * @returns An array of TaskStatus objects holding the status and time usage
 *   information for each task.
 */
export default function calculateTimes(tasks: Task[]): TaskStatus[] {
  const statusArray: TaskStatus[] = tasks.map((task) => {
    checkTask(task);
    const { begin, suspend, resume, end } = task;
    if (!begin) {
      return { task: task.subject, status: 'unstarted', timeSpent: 0 };
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
        status: 'completed',
        timeSpent: calculateDifference(beginDate, endDate, task),
      };
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
