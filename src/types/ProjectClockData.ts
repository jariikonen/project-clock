export interface Task {
  subject: string;
  description?: string;
  begin?: string;
  suspend?: string[];
  resume?: string[];
  end?: string;
}

export interface ProjectClockData {
  projectName: string;
  tasks: Task[];
}

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

export function parseProjectClockData(value: unknown): ProjectClockData {
  if (isProjectClockData(value)) {
    return value;
  }
  throw new Error('not a ProjectClockData object');
}
