import { Task } from '../../types/ProjectClockData';
import { TASK_SUBJECT } from './constants';
import { getTestFileDataObj } from './testFile';

/** Returns the task with given subject */
export function getTestTask(testFilePath: string, subject = TASK_SUBJECT) {
  const projectClockDataObj = getTestFileDataObj(testFilePath);
  return projectClockDataObj.tasks.find((task) => task.subject === subject);
}

/**
 * Tests that the given property of the task with given subject has the given
 * value.
 */
export function testTaskMemberHasValue(
  testFilePath: string,
  member: keyof Task,
  value: string | string[] | undefined,
  subject = TASK_SUBJECT
) {
  const projectClockDataObj = getTestFileDataObj(testFilePath);
  const found = projectClockDataObj.tasks.find(
    (task) => task.subject === subject
  );
  let memberValue: string | string[] | undefined;
  if (found) {
    memberValue = found[member];
  }
  expect(memberValue).toEqual(value);
}
