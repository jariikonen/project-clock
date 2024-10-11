import editor from '@inquirer/editor';
import handleExitPromptError from '../common/handleExitPromptError';
import ProjectClockError from '../common/ProjectClockError';
import promptToConfirmOrSelectTask from '../common/promptToConfirmOrSelectTask';
import { readTimesheet, writeTimesheet } from '../common/timesheetReadWrite';
import { ProjectClockData, Task } from '../types/ProjectClockData';
import { outputTaskData } from './show';
import promptToConfirm from '../common/promptToConfirm';
import {
  messageWithTruncatedPart,
  outputError,
  outputNotice,
  outputSuccess,
  sideHeadingTextMultiple,
} from '../common/outputFormatting';
import exitWithNothingToDo from '../common/exitWithNothingToDo';

/**
 * Reads timesheet data using readTimesheet() and exits with an error if the
 * timesheet is empty of tasks.
 */
function getTimesheetData() {
  const timesheetData = readTimesheet();
  const { tasks } = timesheetData;
  if (tasks.length < 1) {
    outputError('Timesheet is empty, nothing to edit.');
    process.exit(1);
  }
  return timesheetData;
}

/** Prompts the user to confirm or select a task. */
async function promptTask(
  tasks: Task[],
  hasTaskDescriptor: boolean
): Promise<Task> {
  const adjective = hasTaskDescriptor ? 'matching' : '';
  try {
    return await promptToConfirmOrSelectTask(tasks, adjective, 'edit');
  } catch (error) {
    handleExitPromptError(error);
  }
  throw new ProjectClockError('Internal error: this should not have happened!');
}

/** Looks for a matching task and/or prompts the user to select a task. */
async function getTask(tasks: Task[], taskDescriptor?: string): Promise<Task> {
  const tasksToConsider = taskDescriptor
    ? tasks.filter((task) => task.subject.match(taskDescriptor))
    : tasks;
  if (tasksToConsider.length < 1) {
    outputError(
      messageWithTruncatedPart(
        ["No task(s) matching '", taskDescriptor, "' found."],
        1
      )
    );
    process.exit(1);
  }
  const taskToEdit = await promptTask(tasksToConsider, !!taskDescriptor);
  return taskToEdit;
}

/** Represents an editable field of the Task object. */
type EditableField = 'subject' | 'description' | 'notes';

/**
 * Prompts the user to edit given field value with the users preferred editor.
 * Uses inquirer/editor.
 */
async function getEdit(
  field: EditableField,
  taskDescriptor: string,
  defaultValue?: string
) {
  const value = await editor({
    message: `Edit ${field} of task '${taskDescriptor}'?`,
    default: defaultValue,
    waitForUseInput: false,
  });
  return value;
}

/**
 * Changes the timesheetData argument and writes its contents to the file, and
 * outputs description of the action to stdout.
 */
function writeChanges(
  timesheetData: ProjectClockData,
  task: Task,
  field: 'subject' | 'description' | 'notes',
  newValue: string
) {
  const originalSubject = task.subject;
  const hasPreviousValue = !!task[field];
  task[field] = newValue; // eslint-disable-line no-param-reassign
  if (hasPreviousValue) {
    outputSuccess(
      messageWithTruncatedPart(
        [`Replacing the ${field} of task '`, originalSubject, "'."],
        1
      )
    );
  } else {
    outputSuccess(
      messageWithTruncatedPart(
        [`Adding a ${field} field to task '`, originalSubject, "'."],
        1
      )
    );
  }
  writeTimesheet(timesheetData);

  const { projectSettings } = timesheetData;
  outputTaskData([task], projectSettings);
}

/**
 * Prompts user to confirm the replacement of given task field with the new
 * value user gave as argument, writes possible change to the timesheet file,
 * and exits.
 */
async function confirmReplaceWithArgumentAndExit(
  timesheetData: ProjectClockData,
  task: Task,
  field: EditableField,
  newValue: string
) {
  if (!task[field]) {
    outputSuccess(`Creating a new ${field} field.`);
    writeChanges(timesheetData, task, field, newValue);
    process.exit(0);
  }

  const messageParts = {
    [`Current ${field}`]: `${task[field]}`,
    [`New ${field}`]: `${newValue}`,
  };
  const message = sideHeadingTextMultiple(
    messageParts,
    true,
    process.stdout.columns,
    false,
    0,
    false,
    { [`New ${field}`]: { modifiers: ['bold'] } }
  );

  outputNotice(message);
  const prompt = `Are you sure you want to replace the ${field}?`;
  if (await promptToConfirm(prompt)) {
    writeChanges(timesheetData, task, field, newValue);
    process.exit(0);
  } else {
    exitWithNothingToDo('edit');
  }
}

/**
 * Prompts the user to edit the value of the given field with users preferred
 * editor and writes the data to the timesheet file.
 */
async function editValueAndWriteData(
  timesheetData: ProjectClockData,
  task: Task,
  field: EditableField,
  prepare: (value: string) => string
) {
  let value = await getEdit(field, task.subject, task[field]);
  value = prepare(value);
  writeChanges(timesheetData, task, field, value);
}

/** Prepares the subject value for writing to timesheet file. */
const prepareSubjectValue = (value: string) => value.replace('\n', '').trim();

/**
 * Edits the subject field of the task pointed by the taskDescriptor argument.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param newSubject Optional new value for the subject field.
 */
export async function editSubject(
  taskDescriptor?: string,
  newSubject?: string
) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  const taskToEdit = await getTask(tasks, taskDescriptor);
  if (newSubject) {
    await confirmReplaceWithArgumentAndExit(
      timesheetData,
      taskToEdit,
      'subject',
      prepareSubjectValue(newSubject)
    );
  }
  await editValueAndWriteData(
    timesheetData,
    taskToEdit,
    'subject',
    prepareSubjectValue
  );
}

/** Prepares the description value for writing to timesheet file. */
const prepareDescriptionValue = (value: string) => value.trim();

/**
 * Edits the description field of the task pointed by the taskDescriptor
 * argument.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param newDescription Optional new value for the description field.
 */
export async function editDescription(
  taskDescriptor?: string,
  newDescription?: string
) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  const taskToEdit = await getTask(tasks, taskDescriptor);
  if (newDescription) {
    await confirmReplaceWithArgumentAndExit(
      timesheetData,
      taskToEdit,
      'description',
      prepareDescriptionValue(newDescription)
    );
  }
  await editValueAndWriteData(
    timesheetData,
    taskToEdit,
    'description',
    prepareDescriptionValue
  );
}

/** Prepares the notes value for writing to the timesheet file. */
const prepareNotesValue = (value: string) => value.trim();

/**
 * Edits the notes field of the task pointed by the taskDescriptor argument.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 * @param newNotes Optional new value for the notes field.
 */
export async function editNotes(taskDescriptor?: string, newNotes?: string) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  const taskToEdit = await getTask(tasks, taskDescriptor);
  if (newNotes) {
    await confirmReplaceWithArgumentAndExit(
      timesheetData,
      taskToEdit,
      'notes',
      prepareNotesValue(newNotes)
    );
  }
  await editValueAndWriteData(
    timesheetData,
    taskToEdit,
    'notes',
    prepareNotesValue
  );
}

/**
 * Edits the subject, description, and/or notes fields of the task pointed by
 * the taskDescriptor argument.
 * @param taskDescriptor A regex search string that is expected to match a task
 *    subject.
 */
export async function edit(taskDescriptor?: string) {
  const timesheetData = getTimesheetData();
  const { tasks } = timesheetData;

  try {
    const taskToEdit = await getTask(tasks, taskDescriptor);
    if (await promptToConfirm('Do you want to edit the subject?')) {
      await editValueAndWriteData(
        timesheetData,
        taskToEdit,
        'subject',
        prepareSubjectValue
      );
    }
    if (await promptToConfirm('Do you want to edit the description?')) {
      await editValueAndWriteData(
        timesheetData,
        taskToEdit,
        'description',
        prepareDescriptionValue
      );
    }
    if (await promptToConfirm('Do you want to edit the notes?')) {
      await editValueAndWriteData(
        timesheetData,
        taskToEdit,
        'notes',
        prepareNotesValue
      );
    }
  } catch (error) {
    handleExitPromptError(error);
  }
}
