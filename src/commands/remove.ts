import checkbox from '@inquirer/checkbox';
import { mainSymbols, replaceSymbols } from 'figures';
import exitWithNothingToDo from '../common/exitWithNothingToDo';
import {
  consoleWidth,
  formatNotice,
  outputError,
  outputNotice,
  outputSuccess,
  outputWarning,
  truncateToWidthWithEllipsis,
} from '../common/outputFormatting';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { ProjectClockData, Task } from '../types/ProjectClockData';
import promptToConfirm from '../common/promptToConfirm';
import handleExitPrompError from '../common/handleExitPromptError';
import multiple from '../common/multiple';
import handleProjectClockError from '../common/handleProjectClockError';
import status from './status';
import capitalize from '../common/capitalize';

interface CheckboxChoice {
  value: number;
  name?: string;
  description?: string;
  short?: string;
  checked?: boolean;
  disabled?: boolean | string;
}

function createChoises(
  tasks: Task[],
  maxWidth = consoleWidth - 6,
  shortWidth = 20
): CheckboxChoice[] {
  const choices = tasks.map((task, index) => {
    const name = truncateToWidthWithEllipsis(task.subject, maxWidth);
    const value = index;
    const description = task.subject;
    const short = truncateToWidthWithEllipsis(task.subject, shortWidth);
    return {
      name,
      value,
      description,
      short,
    };
  });
  return choices;
}

async function promptForTasks(tasks: Task[]): Promise<Task[]> {
  const choices = createChoises(tasks);
  const selections: number[] = await checkbox({
    message: 'Select the tasks to remove:',
    choices,
    theme: {
      style: {
        highlight: (text: string) => formatNotice(text),
      },
      icon: {
        checked: `${replaceSymbols(mainSymbols.checkboxOn, { useFallback: false })}`,
        unchecked: `${replaceSymbols(mainSymbols.checkboxOff, { useFallback: false })}`,
        cursor: replaceSymbols(mainSymbols.pointer),
      },
    },
  });
  const selectedTasks = tasks.filter((_task, index) =>
    selections.includes(index)
  );
  return selectedTasks;
}

async function getTasksToRemove(tasks: Task[]): Promise<Task[]> {
  let tasksToRemove: Task[] = [];
  if (tasks.length === 1) {
    tasksToRemove = [tasks[0]];
  } else if (tasks.length > 1) {
    tasksToRemove = await promptForTasks(tasks);
  }
  return tasksToRemove;
}

function getTaskList(tasks: Task[], maxWidth: number) {
  const taskListParts: string[] = [];
  tasks.forEach((task) => {
    taskListParts.push(
      `${truncateToWidthWithEllipsis(`  ${task.subject}`, maxWidth)}`
    );
  });
  return taskListParts.join('\n');
}

async function confirmOnlyTaskOnTimesheet(
  tasksToRemove: Task[]
): Promise<[boolean, Task[]]> {
  outputWarning(
    'There is only one task on the timesheet and it is about to be removed:'
  );
  outputNotice(getTaskList(tasksToRemove, consoleWidth));
  return [
    await promptToConfirm('Are you sure you want to continue?'),
    tasksToRemove,
  ];
}

async function confirmRemovalOfSelection(
  tasksToRemove: Task[]
): Promise<[boolean, Task[]]> {
  const [term, counter, pronouns] = multiple('task', tasksToRemove.length);
  const numberExpression =
    counter === '1' ? 'this task' : `${pronouns[0]} ${counter} ${term}`;
  outputWarning(`You are about to remove ${numberExpression}:`);
  outputNotice(getTaskList(tasksToRemove, consoleWidth));
  return [
    await promptToConfirm('Are you sure you want to continue?'),
    tasksToRemove,
  ];
}

async function confirmRegexMatch(
  tasksToRemove: Task[]
): Promise<[boolean, Task[]]> {
  const [term, counter, pronouns] = multiple('task', tasksToRemove.length);
  const numberExpression =
    counter === '1' ? 'this task' : `${pronouns[0]} ${counter} ${term}`;
  const verbs = counter === '1' ? ['matches', 'is'] : ['match', 'are'];
  const message = `${capitalize(numberExpression)} ${verbs[0]} the task descriptor and ${pronouns[1]} ${verbs[1]} about to be removed:`;
  outputWarning(message);
  outputNotice(getTaskList(tasksToRemove, consoleWidth));
  if (tasksToRemove.length > 1) {
    if (await promptToConfirm('Do you want to modify the selection?')) {
      const modifiedSelection = await getTasksToRemove(tasksToRemove);
      if (modifiedSelection.length === 0) {
        exitWithNothingToDo('remove');
      }
      return confirmRemovalOfSelection(modifiedSelection);
    }
  }
  return [
    await promptToConfirm(
      `Are you sure you want to remove ${numberExpression}?`
    ),
    tasksToRemove,
  ];
}

async function confirmTasksToRemove(
  tasksToRemove: Task[],
  onlyOneTaskOnTimesheet: boolean,
  regexMatch: boolean
): Promise<[boolean, Task[]]> {
  if (onlyOneTaskOnTimesheet) {
    return confirmOnlyTaskOnTimesheet(tasksToRemove);
  }
  if (regexMatch) {
    return confirmRegexMatch(tasksToRemove);
  }
  return confirmRemovalOfSelection(tasksToRemove);
}

function writeNewTimesheetAndExit(
  timesheetData: ProjectClockData,
  tasksToRemove: Task[]
) {
  const subjects = tasksToRemove.map((task) => task.subject);
  const newTasks = timesheetData.tasks.filter(
    (task) => !subjects.includes(task.subject)
  );
  const newTimesheetData = { ...timesheetData, tasks: newTasks };
  try {
    writeTimesheet(newTimesheetData);
  } catch (error) {
    handleProjectClockError(error, 'Writing timesheet failed');
  }
  const [term, counter] = multiple('task', tasksToRemove.length);
  outputSuccess(`Removed ${counter} ${term}.`);
  status({});
  process.exit(0);
}

/**
 * Removes task(s) from the timesheet.
 *
 * If the function is called without the taskDescriptor argument, it will first
 * look how many tasks there are on the timesheet. If there is only one task,
 * the user is presented a list from which the user can select the tasks to be
 * removed. After the user has selected tasks, it is confirmed from the user
 * that the selection is correct. If the user confirms the selection the tasks
 * are removed. If the user does not select any tasks nothing is removed.
 *
 * If the function is called with a taskDescriptor argument, it will select all
 * tasks that match the descriptor to be removed and the user is presented an
 * option to modify the selection. After that the user is confirmed whether the
 * selection is correct. If there is only on task that matches the descriptor
 * the user is immediately confirmed whether that is the task to be removed.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export default async function remove(taskDescriptor: string | undefined) {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;

  let tasksToRemove: Task[] = [];
  let onlyOneTaskOnTimesheet = false;

  try {
    if (tasks.length < 1) {
      outputError('Timesheet is empty, nothing to remove.');
      process.exit(1);
    } else if (!taskDescriptor) {
      if (tasks.length === 1) {
        onlyOneTaskOnTimesheet = true;
      }
      tasksToRemove = await getTasksToRemove(tasks);
    } else {
      tasksToRemove = tasks.filter((task) =>
        task.subject.match(taskDescriptor)
      );
    }
    if (tasksToRemove.length > 0) {
      const [removeTasks, confirmedTasks] = await confirmTasksToRemove(
        tasksToRemove,
        onlyOneTaskOnTimesheet,
        !!taskDescriptor
      );
      if (removeTasks) {
        writeNewTimesheetAndExit(timesheetData, confirmedTasks);
      }
    }
  } catch (error) {
    handleExitPrompError(error);
  }
  exitWithNothingToDo('remove', !!taskDescriptor && tasksToRemove.length === 0);
}
