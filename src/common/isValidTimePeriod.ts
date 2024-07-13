import ProjectClockError from './ProjectClockError';

export default function isValidTimePeriod(
  begin: string,
  end: string,
  taskSubject: string
): boolean {
  const beginDate = new Date(begin);
  const endDate = new Date(end);

  if (beginDate.toISOString() !== begin) {
    throw new ProjectClockError(
      `ERROR: 'begin' is not a valid timestamp (${begin})`
    );
  }
  if (endDate.toISOString() !== end) {
    throw new ProjectClockError(
      `ERROR: 'end' is not a valid timestamp (${end})`
    );
  }
  if (beginDate > endDate) {
    throw new ProjectClockError(
      `ERROR: begin date is later than end date (${taskSubject})`
    );
  }
  return true;
}
