import ProjectClockError from '../common/ProjectClockError';

/** Represents a Project Clock task. */
export interface Task {
  subject: string;
  description?: string;
  begin?: string;
  suspend?: string[];
  resume?: string[];
  end?: string;
}

/** Empty Project Clock task. */
export const emptyTask: Task = {
  subject: '',
};

/** Represents the data object that is stored in a Project Clock timesheet. */
export interface ProjectClockData {
  projectName: string;
  tasks: Task[];
}

/** Type guard that checks if the value is a valid ProjectClockData object. */
export function isProjectClockData(value: unknown): value is ProjectClockData {
  if (typeof value !== 'object') {
    return false;
  }

  const obj = value as ProjectClockData;
  if (!obj.projectName) {
    return false;
  }

  return true;
}

/**
 * Parses ProjectClockData object from the value.
 * @throws ProjectClockError with a descriptive message.
 */
export function parseProjectClockData(value: unknown): ProjectClockData {
  if (isProjectClockData(value)) {
    return value;
  }
  throw new ProjectClockError('not a ProjectClockData object');
}
