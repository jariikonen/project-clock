import { Task } from '../../types/ProjectClockData';
import { TASK_SUBJECT } from './constants';
import { getTestFileDataObj } from './testFile';

/** Returns the task with given subject */
export function getTestTask(testFilePath: string, subject = TASK_SUBJECT) {
  const projectClockDataObj = getTestFileDataObj(testFilePath);
  return projectClockDataObj.tasks.find((task) => task.subject === subject);
}

/**
 * Expects that the given property of the task with given subject has the given
 * value.
 * @param testFilePath Test file path.
 * @param member The member under review.
 * @param value The value the member is expected to have.
 * @param subject The subject of the task under review.
 */
export function expectTaskMemberHasValue(
  testFilePath: string,
  member: keyof Task,
  value: string | string[] | undefined,
  subject = TASK_SUBJECT
) {
  const task = getTestTask(testFilePath, subject);
  let memberValue: string | string[] | undefined;
  if (task) {
    memberValue = task[member];
  }
  expect(memberValue).toEqual(value);
}

/**
 * Expects that the given task equals to the given object.
 * @param testFilePath Test file path.
 * @param reference A reference object the task is expected to be equal to.
 * @param subject The subject of the task under review.
 */
export function expectTaskEqualsTo(
  testFilePath: string,
  reference: Task,
  subject = TASK_SUBJECT
) {
  const task = getTestTask(testFilePath, subject);
  expect(task).toEqual(reference);
}
