import { TaskStatus } from '../../common/calculateTimes';
import calculateTotalTime from '../../common/calculateTotalTime';

describe('calculateTotalTime()', () => {
  test('calculateTotalTime() calculates total time correctly', () => {
    const taskStatuses: TaskStatus[] = [
      {
        task: 'Task 1',
        status: 'unstarted',
        timeSpent: 0,
      },
      {
        task: 'Task 2',
        status: 'completed',
        timeSpent: 60 * 60 * 1000,
      },
      {
        task: 'Task 3',
        status: 'completed',
        timeSpent: 5.5 * 60 * 60 * 1000,
      },
    ];

    const expectedTotalTime = 0 + 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000;

    expect(() => calculateTotalTime(taskStatuses)).not.toThrow();
    const response = calculateTotalTime(taskStatuses);
    expect(response).toEqual(expectedTotalTime);
  });
});
