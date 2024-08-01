import { TASK_SUBJECT } from '../common/constants';
import { ProjectClockData } from '../../types/ProjectClockData';
import calculateTimes, { TaskStatus } from '../../common/calculateTimes';
import ProjectClockError from '../../common/ProjectClockError';

function calculateDifference(start: string, end: string) {
  return new Date(end).getTime() - new Date(start).getTime();
}

describe('calculateTimes()', () => {
  describe('Operation on single tasks, statuses', () => {
    test('Not started', () => {
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'not started',
        timeSpent: 0,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response).toEqual(expectedStatus);
    });

    test('Started', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'started',
        timeSpent: calculateDifference(begin, new Date().toISOString()),
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual('started');
      expect(response.timeSpent / 1000).toBeCloseTo(
        expectedStatus.timeSpent / 1000,
        1
      );
    });

    test('Suspended', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = '2024-01-01T00:30:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend: [suspend],
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'suspended',
        timeSpent: 30 * 60 * 1000,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent).toEqual(expectedStatus.timeSpent);
    });

    test('Resumed', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = '2024-01-01T00:30:00.000Z';
      const resume = '2024-01-01T01:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend: [suspend],
          resume: [resume],
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'resumed',
        timeSpent:
          30 * 60 * 1000 +
          calculateDifference(resume, new Date().toISOString()),
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent / 1000).toBeCloseTo(
        expectedStatus.timeSpent / 1000,
        1
      );
    });

    test('Completed', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const end = '2024-01-01T01:33:33.333Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          end,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'completed',
        timeSpent: 93 * 60 * 1000 + 33333,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent).toEqual(expectedStatus.timeSpent);
    });

    test('Suspended, resumed and completed', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = '2024-01-01T00:30:00.000Z';
      const resume = '2024-01-01T01:00:00.000Z';
      const end = '2024-01-01T01:33:33.333Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend: [suspend],
          resume: [resume],
          end,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'completed',
        timeSpent: 30 * 60 * 1000 + 33 * 60 * 1000 + 33333,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent).toEqual(expectedStatus.timeSpent);
    });

    test('Many suspends and resumes - suspended', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = [
        '2024-01-01T00:30:00.000Z',
        '2024-01-01T01:30:00.000Z',
        '2024-01-01T02:33:33.333Z',
      ];
      const resume = ['2024-01-01T01:00:00.000Z', '2024-01-01T02:00:00.000Z'];
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'suspended',
        timeSpent: 30 * 60 * 1000 + 30 * 60 * 1000 + 33 * 60 * 1000 + 33333,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent).toEqual(expectedStatus.timeSpent);
    });

    test('Many suspends and resumes - resumed', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = [
        '2024-01-01T00:30:00.000Z',
        '2024-01-01T01:30:00.000Z',
        '2024-01-01T02:33:33.333Z',
      ];
      const resume = [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T02:00:00.000Z',
        '2024-01-01T02:33:33.333Z',
      ];
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'resumed',
        timeSpent:
          30 * 60 * 1000 +
          30 * 60 * 1000 +
          33 * 60 * 1000 +
          33333 +
          calculateDifference(resume[2], new Date().toISOString()),
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent / 1000).toBeCloseTo(
        expectedStatus.timeSpent / 1000,
        1
      );
    });

    test('Many suspends and resumes - completed', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = [
        '2024-01-01T00:30:00.000Z',
        '2024-01-01T01:30:00.000Z',
        '2024-01-01T02:33:33.333Z',
      ];
      const resume = [
        '2024-01-01T01:00:00.000Z',
        '2024-01-01T02:00:00.000Z',
        '2024-01-01T03:00:00.000Z',
      ];
      const end = '2024-01-01T03:11:11.111Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
          end,
        },
      ];

      const expectedStatus: TaskStatus = {
        task: TASK_SUBJECT,
        status: 'completed',
        timeSpent:
          30 * 60 * 1000 +
          30 * 60 * 1000 +
          33 * 60 * 1000 +
          33333 +
          11 * 60 * 1000 +
          11111,
      };

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks)[0];
      expect(response.task).toMatch(expectedStatus.task);
      expect(response.status).toEqual(expectedStatus.status);
      expect(response.timeSpent).toEqual(expectedStatus.timeSpent);
    });
  });

  describe('Error detection', () => {
    test('End without begin', () => {
      const end = '2024-01-01T00:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; end date without begin date`
      );
    });

    test('Suspend without begin', () => {
      const suspend = '2024-01-01T00:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          suspend: [suspend],
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; suspend date(s) without begin date`
      );
    });

    test('Resume without begin', () => {
      const resume = '2024-01-01T00:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          resume: [resume],
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; resume date(s) without begin date`
      );
    });

    test('Resume without suspend', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const resume = '2024-01-01T00:30:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          resume: [resume],
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; resume without suspend`
      );
    });

    test('Resume without suspend', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = ['2024-01-01T00:30:00.000Z'];
      const resume = ['2024-01-01T01:00:00.000Z', '2024-01-01T01:30:00.000Z'];
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; resumed more times than suspended`
      );
    });

    test('Suspend and end without enough resumes - no resumes at all', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = ['2024-01-01T00:30:00.000Z'];
      const end = '2024-01-01T01:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; suspend and end without enough resumes`
      );
    });

    test('Suspend and end without enough resumes - two suspends, but only one resume', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = ['2024-01-01T00:30:00.000Z', '2024-01-01T00:50:00.000Z'];
      const resume = ['2024-01-01T00:40:00.000Z'];
      const end = '2024-01-01T01:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; suspend and end without enough resumes`
      );
    });

    test('Invalid time period - begin is later than end', () => {
      const begin = '2024-01-01T01:00:00.000Z';
      const end = '2024-01-01T00:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid time period '${begin}' => '${end}' (${TASK_SUBJECT}); start date is later than end date`
      );
    });

    test('Invalid time period - resume is later than end', () => {
      const begin = '2024-01-01T00:00:00.000Z';
      const suspend = '2024-01-01T01:30:00.000Z';
      const resume = '2024-01-01T01:30:00.000Z';
      const end = '2024-01-01T01:00:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend: [suspend],
          resume: [resume],
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid time period '${resume}' => '${end}' (${TASK_SUBJECT}); start date is later than end date`
      );
    });

    test('Invalid time period - suspend is later than resume', () => {
      const begin = '2024-01-01T01:00:00.000Z';
      const suspend = '2024-01-01T02:00:00.000Z';
      const resume = '2024-01-01T01:30:00.000Z';
      const end = '2024-01-01T02:30:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend: [suspend],
          resume: [resume],
          end,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; suspend date (${suspend}) is later than resume date (${resume})`
      );
    });

    test('Invalid time period - suspend later on the list is earlier in time than a suspend earlier on the list', () => {
      const begin = '2024-01-01T01:00:00.000Z';
      const suspend = ['2024-01-01T02:00:00.000Z', '2024-01-01T01:30:00.000Z'];
      const resume = '2024-01-01T02:30:00.000Z';
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume: [resume],
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid time period '${resume}' => '${suspend[1]}' (${TASK_SUBJECT}); start date is later than end date`
      );
    });

    test('Invalid time period - resume later on the list is earlier in time than a resume earlier on the list', () => {
      const begin = '2024-01-01T01:00:00.000Z';
      const suspend = ['2024-01-01T02:00:00.000Z', '2024-01-01T03:00:00.000Z'];
      const resume = ['2024-01-01T02:30:00.000Z', '2024-01-01T02:00:00.000Z'];
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: TASK_SUBJECT,
          begin,
          suspend,
          resume,
        },
      ];
      expect(() => calculateTimes(tasks)).toThrow(ProjectClockError);
      expect(() => calculateTimes(tasks)).toThrow(
        `ERROR: invalid task '${TASK_SUBJECT}'; suspend date (${suspend[1]}) is later than resume date (${resume[1]})`
      );
    });
  });

  describe('Operation on more than one task', () => {
    test('Multiple tasks', () => {
      const tasks: ProjectClockData['tasks'] = [
        {
          subject: 'Task 1',
        },
        {
          subject: 'Task 2',
          begin: '2024-01-01T00:00:00.000Z',
          end: '2024-01-01T01:00:00.000Z',
        },
        {
          subject: 'Task 3',
          begin: '2024-01-01T00:00:00.000Z',
          suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T02:00:00.000Z'],
          resume: ['2024-01-01T01:30:00.000Z', '2024-01-02T00:00:00.000Z'],
          end: '2024-01-02T04:00:00.000Z',
        },
      ];

      const expectedStatuses: TaskStatus[] = [
        {
          task: 'Task 1',
          status: 'not started',
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

      expect(() => calculateTimes(tasks)).not.toThrow();
      const response = calculateTimes(tasks);
      expect(response).toEqual(expectedStatuses);
    });
  });
});
