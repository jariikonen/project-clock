import ProjectClockError from '../common/ProjectClockError';
import { isTimeParams, TimeParams } from '../common/TimePeriod';

/** Represents a Project Clock task. */
export interface Task {
  subject: string;
  description?: string;
  notes?: string;
  begin?: string;
  suspend?: string[];
  resume?: string[];
  end?: string;
}

/** Empty Project Clock task. */
export const emptyTask: Task = {
  subject: '',
};

/** Represents a Project Clock project settings. */
export interface ProjectClockSettings {
  timeParams?: TimeParams;
}

/** Empty ProjectClockData object. */
export const emptyProjectClockData: ProjectClockData = {
  projectName: '',
  tasks: [],
};

/** Represents the data object that is stored in a Project Clock timesheet. */
export interface ProjectClockData {
  projectName: string;
  projectSettings?: ProjectClockSettings;
  tasks: Task[];
}

/** Type guard that checks if the value is a valid Task object. */
export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object') {
    return false;
  }
  return true;
}

/** Type guard that checks if the value is a valid ProjectClockSettings object. */
export function isProjectClockSettings(
  value: unknown
): value is ProjectClockSettings {
  if (typeof value !== 'object') {
    return false;
  }

  const obj = value as ProjectClockSettings;
  if (obj.timeParams && !isTimeParams(obj.timeParams)) {
    return false;
  }
  return true;
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
  if (!obj.tasks || !Array.isArray(obj.tasks)) {
    return false;
  }
  const invalidTasks = obj.tasks.filter((task) => !isTask(task));
  if (
    Array.isArray(obj.tasks) &&
    obj.tasks.length > 0 &&
    invalidTasks.length > 0
  ) {
    return false;
  }
  if (obj.projectSettings && !isProjectClockSettings(obj.projectSettings)) {
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
