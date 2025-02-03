import { TaskStatus, TaskStatusInformation } from './calculateTimes';
import { CellStyling, createRows, TablePadding } from './outputFormatting';
import { styleTaskStatus } from './styling';
import TimePeriod, { TimeParams } from './TimePeriod';

export function calculateColWidths(
  width: number,
  headerPadding: [number, number] = [0, 0]
) {
  return [
    Math.floor((width - 1 - headerPadding[0] - headerPadding[1]) * 0.7),
    Math.floor((width - 1 - headerPadding[0] - headerPadding[1]) * 0.15),
    Math.floor((width - 1 - headerPadding[0] - headerPadding[1]) * 0.15),
  ];
}

export type TaskRowTuple = [task: string, time: string, status: TaskStatus];

function getTableData(
  times: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  headerPadding: TablePadding = [0, 0]
): [string[], TaskRowTuple[], number[]] {
  const header = ['Task', 'Time', 'Status'];
  const colWidths = calculateColWidths(width, headerPadding);
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
  return [header, rows, colWidths];
}

function createListTableParts(
  header: string[],
  rows: TaskRowTuple[],
  colWidths: number[],
  headerPadding: TablePadding,
  contentPadding: TablePadding
): [string, string[]] {
  const headerStyles: CellStyling = {
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
  const headerRow = createRows(
    [header],
    colWidths,
    headerPadding,
    headerStyles
  )[0];
  const contentRows = createRows(rows, colWidths, contentPadding, rowStyles);
  return [headerRow, contentRows];
}

function createListTable(
  header: string[],
  rows: TaskRowTuple[],
  colWidths: number[],
  headerPadding: TablePadding,
  contentPadding: TablePadding
) {
  const [headerRow, ...contentRows] = createListTableParts(
    header,
    rows,
    colWidths,
    headerPadding,
    contentPadding
  );
  const table = [headerRow, ...contentRows[0]];
  return table.join('\n');
}

/**
 * Returns header row and content rows of a tabular list of tasks in separate
 * string arrays.
 * @param times An array of TaskStatus objects that contain task status and
 *    time usage information.
 * @param width Width of the table in characters.
 * @param includeSeconds Boolean indicating whether to include the seconds in
 *    the time usage field.
 * @param listMode List rendering method used.
 * @param tablePadding Amount of padding added to the sides of the table.
 * @param headerPadding Amount of padding added to the sides of the table
 *    header. If not provided, the tablePadding is used.
 * @returns Two string arrays, the first containing the header row and second the
 *    data rows.
 */
export function getTaskListParts(
  times: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  tablePadding: TablePadding = [0, 0],
  headerPadding?: TablePadding
): [string, string[]] {
  if (headerPadding === undefined) {
    // eslint-disable-next-line no-param-reassign
    headerPadding = tablePadding;
  }
  const [header, rows, colWidths] = getTableData(
    times,
    timeParams,
    width,
    includeSeconds,
    headerPadding
  );
  return createListTableParts(
    header,
    rows,
    colWidths,
    headerPadding,
    tablePadding
  );
}

/**
 * Returns a tabular list of tasks as a string.
 * @param times An array of TaskStatus objects that contain task status and
 *    time usage information.
 * @param width Width of the table in characters.
 * @param includeSeconds Boolean indicating whether to include the seconds in
 *    the time usage field.
 * @param listMode List rendering method used.
 * @param tablePadding Amount of padding added to the sides of the table.
 * @param headerPadding Amount of padding added to the sides of the table
 *    header. If not provided, the tablePadding is used.
 * @returns A tabular list of tasks as a string.
 */
export function getTaskListString(
  times: TaskStatusInformation[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  tablePadding: TablePadding = [0, 0],
  headerPadding?: TablePadding
): string {
  if (headerPadding === undefined) {
    // eslint-disable-next-line no-param-reassign
    headerPadding = tablePadding;
  }
  const [header, rows, colWidths] = getTableData(
    times,
    timeParams,
    width,
    includeSeconds,
    headerPadding
  );
  return createListTable(header, rows, colWidths, headerPadding, tablePadding);
}
