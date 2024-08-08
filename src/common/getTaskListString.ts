import CliTable3 from 'cli-table3';
import { TaskStatus } from './calculateTimes';
import TimePeriod, { TimeParams } from './TimePeriod';

type ListMode = 'table' | 'simple';

/** Amount of padding added to the sides of the table (left, right). */
export type TablePadding = [number, number];

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

function createTable(
  times: TaskStatus[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  padding: TablePadding
) {
  const taskTable = new CliTable3({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
    style: { 'padding-left': padding[0], 'padding-right': padding[1] },
    head: ['Task', 'Time', 'Status'],
    colWidths: calculateColWidths(width, padding),
    wordWrap: true,
  });

  times.forEach((task) => {
    const time = new TimePeriod(task.timeSpent, timeParams).hoursAndMinutesStr(
      includeSeconds
    );
    taskTable.push([task.task, time || '-', task.status]);
  });

  return taskTable.toString();
}

function formatCell(content: string, width: number): string {
  if (content.length > width) {
    return `${content.slice(0, width - 4)}... `;
  }
  return content.padEnd(width, ' ');
}

function createRows(
  contentRows: string[][],
  colWidths: number[],
  tablePadding: [number, number]
): string[] {
  const resultRows: string[] = [];
  contentRows.forEach((row) => {
    let rowStr = '';
    row.forEach((cell, i) => {
      rowStr += formatCell(cell, colWidths[i]);
    });
    const paddingLeft = new Array(tablePadding[0] + 1).join(' ');
    const paddingRight = new Array(tablePadding[1] + 1).join(' ');
    resultRows.push(`${paddingLeft}${rowStr}${paddingRight}`);
  });
  return resultRows;
}

function createSimpleTable(
  head: string[],
  rows: string[][],
  colWidths: number[],
  tablePadding: [number, number]
) {
  const headRow = createRows([head], colWidths, tablePadding);
  const contentRows = createRows(rows, colWidths, tablePadding);
  const table = [headRow, ...contentRows];
  return table.join('\n');
}

function createSimple(
  times: TaskStatus[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  padding: TablePadding
) {
  const head = ['Task', 'Time', 'Status'];
  const colWidths = calculateColWidths(width, padding);
  const rows = times.reduce((accum, current) => {
    const time = new TimePeriod(
      current.timeSpent,
      timeParams
    ).hoursAndMinutesStr(includeSeconds);
    return [
      ...accum,
      [
        current.task.toString(),
        time || '-',
        current.status ? current.status.toString() : '-',
      ],
    ];
  }, []);
  return createSimpleTable(head, rows, colWidths, padding);
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
  times: TaskStatus[],
  timeParams: TimeParams | undefined,
  width: number,
  includeSeconds: boolean,
  listMode: ListMode,
  padding: TablePadding = [0, 0]
): string {
  switch (listMode) {
    case 'table':
      return createTable(times, timeParams, width, includeSeconds, padding);
    case 'simple':
      return createSimple(times, timeParams, width, includeSeconds, padding);
    default:
      throw new Error('switch ran out of options');
  }
}
