import CliTable3 from 'cli-table3';
import { TaskStatus } from './calculateTimes';
import TimePeriod from './TimePeriod';

type ListMode = 'table' | 'simple';

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
  width: number,
  includeSeconds: boolean
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
    style: { 'padding-left': 2, 'padding-right': 0 },
    head: ['Task', 'Time', 'Status'],
    colWidths: calculateColWidths(width, [2, 0]),
    wordWrap: true,
  });

  times.forEach((task) => {
    taskTable.push([
      task.task,
      new TimePeriod(task.timeSpent).hoursAndMinutes(includeSeconds),
      task.status,
    ]);
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
    resultRows.push(`${paddingLeft}${rowStr}${paddingRight}\n`);
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
  return table.join('');
}

function createSimple(
  times: TaskStatus[],
  width: number,
  includeSeconds: boolean
) {
  const head = ['Task', 'Time', 'Status'];
  const tablePadding: [number, number] = [2, 0];
  const colWidths = calculateColWidths(width, tablePadding);
  const rows = times.reduce(
    (accum, current) => [
      ...accum,
      [
        current.task.toString(),
        new TimePeriod(current.timeSpent).hoursAndMinutes(includeSeconds),
        current.status ? current.status.toString() : '-',
      ],
    ],
    []
  );
  return createSimpleTable(head, rows, colWidths, tablePadding);
}

/**
 * Returns a tabular list of tasks as a string.
 * @param times An array of TaskStatus objects that contain task status and
 *    time usage information.
 * @param width Width of the table in characters.
 * @param includeSeconds Boolean indicating whether to include the seconds in
 *    the time usage field.
 * @param listMode List rendering method used.
 * @returns A tabular list of tasks as a string.
 */
export default function getTaskListString(
  times: TaskStatus[],
  width: number,
  includeSeconds: boolean,
  listMode: ListMode
): string {
  switch (listMode) {
    case 'table':
      return createTable(times, width, includeSeconds);
    case 'simple':
      return createSimple(times, width, includeSeconds);
    default:
      throw new Error('switch ran out of options');
  }
}
