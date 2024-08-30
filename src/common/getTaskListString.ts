import { TaskStatus, TaskStatusInformation } from './calculateTimes';
import { CellStyling, createRows, TablePadding } from './outputFormatting';
import { styleTaskStatus } from './styling';
import TimePeriod, { TimeParams } from './TimePeriod';

function calculateColWidths(
  width: number,
  tablePadding: [number, number] = [0, 0]
) {
  return [
    Math.floor((width - 1 - tablePadding[0] - tablePadding[1]) * 0.7),
    Math.floor((width - 1 - tablePadding[0] - tablePadding[1]) * 0.15),
    Math.floor((width - 1 - tablePadding[0] - tablePadding[1]) * 0.15),
  ];
}

type TaskRowTuple = [task: string, time: string, status: TaskStatus];

function createListTable(
  head: string[],
  rows: TaskRowTuple[],
  colWidths: number[],
  tablePadding: TablePadding
) {
  const headStyles: CellStyling = {
    cell: {
      color: 'green',
      modifiers: ['bold', 'inverse'],
    },
  };
  const rowStyles: (CellStyling | undefined)[][] = rows.map((row) => {
    const statusStyling: CellStyling = {
      content: styleTaskStatus(row[2]),
    };
    const timeStyling = statusStyling;
    return [undefined, timeStyling, statusStyling];
  });
  const headRow = createRows([head], colWidths, tablePadding, headStyles);
  const contentRows = createRows(rows, colWidths, tablePadding, rowStyles);
  const table = [headRow, ...contentRows];
  return table.join('\n');
}

/**
 * Returns a tabular list of tasks as a string.
 * @param times An array of TaskStatus objects that contain task status and
 *    time usage information.
 * @param width Width of the table in characters.
 * @param includeSeconds Boolean indicating whether to include the seconds in
 *    the time usage field.
 * @param listMode List rendering method used.
 * @param padding Amount of padding added to the sides of the table.
 * @returns A tabular list of tasks as a string.
 */
export default function getTaskListString(
  times: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  padding: TablePadding = [0, 0]
): string {
  const head = ['Task', 'Time', 'Status'];
  const colWidths = calculateColWidths(width, padding);
  const rows: TaskRowTuple[] = times.map((taskStatusInformation) => {
    const time = new TimePeriod(
      taskStatusInformation.timeSpent,
      timeParams
    ).hoursAndMinutesStr(includeSeconds);
    return [
      taskStatusInformation.task,
      time || '-',
      taskStatusInformation.status,
    ];
  });
  return createListTable(head, rows, colWidths, padding);
}
