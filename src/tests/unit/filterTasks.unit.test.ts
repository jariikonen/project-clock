import {
  filterTasks,
  getActiveTasks,
  getMatchingActiveTasks,
  getMatchingResumableTasks,
  getMatchingStoppableTasks,
  getMatchingSuspendableTasks,
  getResumableTasks,
  getStoppableTasks,
  getSuspendableTasks,
  TaskType,
} from '../../common/filterTasks';
import { Task } from '../../types/ProjectClockData';

const tasks: Task[] = [
  {
    subject: 'unstarted task',
  },
  {
    subject: 'second unsuspendable task',
  },
  {
    subject: 'third unsuspendable task',
  },
  {
    subject: 'started task',
    begin: '2024-01-01T00:00:00.000Z',
  },
  {
    subject: 'first suspended task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z'],
  },
  {
    subject: 'second suspended task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z'],
  },
  {
    subject: 'third suspended task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: [
      '2024-01-01T01:00:00.000Z',
      '2024-01-01T03:00:00.000Z',
      '2024-01-01T05:00:00.000Z',
    ],
    resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
  },
  {
    subject: 'first resumed task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z'],
  },
  {
    subject: 'second resumed task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T03:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T04:00:00.000Z'],
  },
  {
    subject: 'third resumed task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: [
      '2024-01-01T01:00:00.000Z',
      '2024-01-01T03:00:00.000Z',
      '2024-01-01T05:00:00.000Z',
    ],
    resume: [
      '2024-01-01T02:00:00.000Z',
      '2024-01-01T0:00:00.000Z',
      '2024-01-01T04:06:00.000Z',
    ],
  },
  {
    subject: 'first stopped task',
    begin: '2024-01-01T00:00:00.000Z',
    end: '2024-01-01T01:00:00.000Z',
  },
  {
    subject: 'second stopped task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z'],
    end: '2024-01-01T03:00:00.000Z',
  },
  {
    subject: 'third stopped task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: ['2024-01-01T01:00:00.000Z', '2024-01-01T04:00:00.000Z'],
    resume: ['2024-01-01T02:00:00.000Z', '2024-01-01T03:00:00.000Z'],
    end: '2024-01-01T05:00:00.000Z',
  },
  {
    subject: 'third stopped task',
    begin: '2024-01-01T00:00:00.000Z',
    suspend: [
      '2024-01-01T01:00:00.000Z',
      '2024-01-01T04:00:00.000Z',
      '2024-01-01T06:00:00.000Z',
    ],
    resume: [
      '2024-01-01T02:00:00.000Z',
      '2024-01-01T03:00:00.000Z',
      '2024-01-01T05:00:00.000Z',
    ],
    end: '2024-01-01T07:00:00.000Z',
  },
];

const activeTasks = tasks.filter((task) => task.begin && !task.end);
const suspendableTasks = tasks.filter(
  (task) =>
    !task.subject.match('suspended') &&
    !task.subject.match('unstarted') &&
    !task.subject.match('unsuspendable')
);
const resumableTasks = tasks.filter(
  (task) => !!task.subject.match('suspended') || !!task.subject.match('stopped')
);

describe('getActiveTasks()', () => {
  test('filters tasks correctly', () => {
    const filteredTasks = getActiveTasks(tasks);
    expect(filteredTasks).toEqual(activeTasks);
  });
});

describe('getMatchingActiveTasks() filters tasks correctly', () => {
  test('correct subset of tasks when matching tasks are active', () => {
    const firstFilteredTasks = getMatchingActiveTasks(tasks, 'started task');
    const secondFilteredTasks = getMatchingActiveTasks(tasks, 'suspended task');
    const thirdFilteredTasks = getMatchingActiveTasks(tasks, 'resumed task');
    expect(firstFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('started task'))
    );
    expect(secondFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('suspended task'))
    );
    expect(thirdFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('resumed task'))
    );
  });

  test('nothing when matching tasks are not active', () => {
    const firstFilteredTasks = getMatchingActiveTasks(tasks, 'unstarted task');
    const secondFilteredTasks = getMatchingActiveTasks(tasks, 'stopped task');
    expect(firstFilteredTasks).toEqual([]);
    expect(secondFilteredTasks).toEqual([]);
  });

  test('correct subset of tasks when only part of matching tasks are active', () => {
    const firstFilteredTasks = getMatchingActiveTasks(tasks, 'first');
    const secondFilteredTasks = getMatchingActiveTasks(tasks, 'second');
    const thirdFilteredTasks = getMatchingActiveTasks(tasks, 'third');
    expect(firstFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('first'))
    );
    expect(secondFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('second'))
    );
    expect(thirdFilteredTasks).toEqual(
      activeTasks.filter((task) => task.subject.match('third'))
    );
  });
});

describe('getStoppableTasks()', () => {
  test('filters tasks correctly (returns same tasks as getActiveTasks())', () => {
    const filteredTasks = getStoppableTasks(tasks);
    expect(filteredTasks).toEqual(getActiveTasks(tasks));
  });
});

describe('getMatchinStoppableTasks() filters tasks correctly', () => {
  test('returns same tasks as getMatchingActiveTasks() when matching tasks are stoppable/active', () => {
    const firstFilteredTasks = getMatchingStoppableTasks(tasks, 'started task');
    const secondFilteredTasks = getMatchingStoppableTasks(
      tasks,
      'suspended task'
    );
    const thirdFilteredTasks = getMatchingStoppableTasks(tasks, 'resumed task');
    expect(firstFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'started task')
    );
    expect(secondFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'suspended task')
    );
    expect(thirdFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'resumed task')
    );
  });

  test('returns same tasks as getMatchingActiveTasks() (nothing) when tasks are not stoppable/active', () => {
    const firstFilteredTasks = getMatchingStoppableTasks(
      tasks,
      'unstarted task'
    );
    const secondFilteredTasks = getMatchingStoppableTasks(
      tasks,
      'stopped task'
    );
    expect(firstFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'unstarted task')
    );
    expect(secondFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'stopped task')
    );
  });

  test('returns same tasks as getMatchingActiveTasks() when only part of matching tasks are stoppable/active', () => {
    const firstFilteredTasks = getMatchingStoppableTasks(tasks, 'first');
    const secondFilteredTasks = getMatchingStoppableTasks(tasks, 'second');
    const thirdFilteredTasks = getMatchingStoppableTasks(tasks, 'third');
    expect(firstFilteredTasks).toEqual(getMatchingActiveTasks(tasks, 'first'));
    expect(secondFilteredTasks).toEqual(
      getMatchingActiveTasks(tasks, 'second')
    );
    expect(thirdFilteredTasks).toEqual(getMatchingActiveTasks(tasks, 'third'));
  });
});

describe('getSuspendableTasks()', () => {
  test('filters tasks correctly', () => {
    const filteredTasks = getSuspendableTasks(tasks);
    expect(filteredTasks).toEqual(suspendableTasks);
  });
});

describe('getMatchingSuspendableTasks()', () => {
  test('correct subset of tasks when matching tasks are suspendable', () => {
    const firstFilteredTasks = getMatchingSuspendableTasks(tasks, 'started');
    const secondFilteredTasks = getMatchingSuspendableTasks(tasks, 'resumed');
    const thirdFilteredTasks = getMatchingSuspendableTasks(tasks, 'stopped');
    expect(firstFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('started'))
    );
    expect(secondFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('resumed'))
    );
    expect(thirdFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('stopped'))
    );
  });

  test('nothing when matching task is not suspendable', () => {
    const firstFilteredTasks = getMatchingSuspendableTasks(tasks, 'unstarted');
    const secondFilteredTasks = getMatchingSuspendableTasks(tasks, 'suspended');
    expect(firstFilteredTasks).toEqual([]);
    expect(secondFilteredTasks).toEqual([]);
  });

  test('correct subset of tasks when only part of matching tasks are suspendable', () => {
    const firstFilteredTasks = getMatchingSuspendableTasks(tasks, 'first');
    const secondFilteredTasks = getMatchingSuspendableTasks(tasks, 'second');
    const thirdFilteredTasks = getMatchingSuspendableTasks(tasks, 'third');
    expect(firstFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('first'))
    );
    expect(secondFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('second'))
    );
    expect(thirdFilteredTasks).toEqual(
      suspendableTasks.filter((task) => task.subject.match('third'))
    );
  });
});

describe('getResumableTasks()', () => {
  test('filters tasks correctly', () => {
    const filteredTasks = getResumableTasks(tasks);
    expect(filteredTasks).toEqual(resumableTasks);
  });
});

describe('getMatchingResumableTasks()', () => {
  test('correct subset of tasks when matching tasks are resumable', () => {
    const firstFilteredTasks = getMatchingResumableTasks(tasks, 'suspended');
    const secondFilteredTasks = getMatchingResumableTasks(tasks, 'stopped');
    expect(firstFilteredTasks).toEqual(
      resumableTasks.filter((task) => task.subject.match('suspended'))
    );
    expect(secondFilteredTasks).toEqual(
      resumableTasks.filter((task) => task.subject.match('stopped'))
    );
  });

  test('nothing when mathcing tasks are not resumable', () => {
    const firstFilteredTasks = getMatchingResumableTasks(tasks, 'unstarted');
    const secondFilteredTasks = getMatchingResumableTasks(tasks, 'started');
    const thirdFilteredTasks = getMatchingResumableTasks(tasks, 'resumed');
    expect(firstFilteredTasks).toEqual([]);
    expect(secondFilteredTasks).toEqual([]);
    expect(thirdFilteredTasks).toEqual([]);
  });

  test('correct subset of tasks when only part of matching tasks are resumable', () => {
    const firstFilteredTasks = getMatchingResumableTasks(tasks, 'first');
    const secondFilteredTasks = getMatchingResumableTasks(tasks, 'second');
    const thirdFilteredTasks = getMatchingResumableTasks(tasks, 'third');
    expect(firstFilteredTasks).toEqual(
      resumableTasks.filter((task) => task.subject.match('first'))
    );
    expect(secondFilteredTasks).toEqual(
      resumableTasks.filter((task) => task.subject.match('second'))
    );
    expect(thirdFilteredTasks).toEqual(
      resumableTasks.filter((task) => task.subject.match('third'))
    );
  });
});

describe('filterTasks()', () => {
  test('returns the same as getActiveTasks() and getMatchingActiveTasks() when taskType is Active', () => {
    expect(filterTasks(tasks, TaskType.Active)[0]).toEqual(
      getActiveTasks(tasks)
    );
    expect(filterTasks(tasks, TaskType.Active, 'first')[0]).toEqual(
      getMatchingActiveTasks(tasks, 'first')
    );
    expect(filterTasks(tasks, TaskType.Active, 'second')[0]).toEqual(
      getMatchingActiveTasks(tasks, 'second')
    );
    expect(filterTasks(tasks, TaskType.Active, 'third')[0]).toEqual(
      getMatchingActiveTasks(tasks, 'third')
    );
  });

  test('returns the same as getSuspendableTasks() and getMatchingSuspendableTasks() when taskType is Suspendable', () => {
    expect(filterTasks(tasks, TaskType.Suspendable)[0]).toEqual(
      getSuspendableTasks(tasks)
    );
    expect(filterTasks(tasks, TaskType.Suspendable, 'first')[0]).toEqual(
      getMatchingSuspendableTasks(tasks, 'first')
    );
    expect(filterTasks(tasks, TaskType.Suspendable, 'second')[0]).toEqual(
      getMatchingSuspendableTasks(tasks, 'second')
    );
    expect(filterTasks(tasks, TaskType.Suspendable, 'third')[0]).toEqual(
      getMatchingSuspendableTasks(tasks, 'third')
    );
  });

  test('returns the same as getResumableTasks() and getMatchingResumableTasks() when taskType is Resumable', () => {
    expect(filterTasks(tasks, TaskType.Resumable)[0]).toEqual(
      getResumableTasks(tasks)
    );
    expect(filterTasks(tasks, TaskType.Resumable, 'first')[0]).toEqual(
      getMatchingResumableTasks(tasks, 'first')
    );
    expect(filterTasks(tasks, TaskType.Resumable, 'second')[0]).toEqual(
      getMatchingResumableTasks(tasks, 'second')
    );
    expect(filterTasks(tasks, TaskType.Resumable, 'third')[0]).toEqual(
      getMatchingResumableTasks(tasks, 'third')
    );
  });

  test('returns the same as getStoppableTasks() and getMatchingStoppableTasks() when taskType is Stoppable', () => {
    expect(filterTasks(tasks, TaskType.Stoppable)[0]).toEqual(
      getStoppableTasks(tasks)
    );
    expect(filterTasks(tasks, TaskType.Stoppable, 'first')[0]).toEqual(
      getMatchingStoppableTasks(tasks, 'first')
    );
    expect(filterTasks(tasks, TaskType.Stoppable, 'second')[0]).toEqual(
      getMatchingStoppableTasks(tasks, 'second')
    );
    expect(filterTasks(tasks, TaskType.Stoppable, 'third')[0]).toEqual(
      getMatchingStoppableTasks(tasks, 'third')
    );
  });
});
