import { applyStyle, Style } from './styling';

export interface Padding {
  /** Padding on the left side of the string. */
  left: number;

  /** Padding on the right side of the string. */
  right: number;

  /** First line left padding. */
  firstLineLeftPadding: number;

  /**
   * An extra cut that can be removed from the first line (e.g., when side
   * heading is longer than the left padding).
   */
  firstLineExtraCut: number;

  /**
   * Boolean indicating whether the right padding should be applied as
   * whitespace.
   */
  padEnd: boolean;
}

function createLine(
  text: string,
  start: number,
  end: number,
  width: number,
  padding: Padding,
  firstLine: boolean,
  addNewLine: boolean
) {
  const newLineStr = addNewLine ? '\n' : '';
  let line = '';
  if (padding.padEnd) {
    line = firstLine
      ? (
          ' '.repeat(padding.firstLineLeftPadding) +
          text.slice(start, end).trim()
        ).padEnd(
          width -
            padding.left -
            padding.firstLineExtraCut +
            padding.firstLineLeftPadding,
          ' '
        ) + newLineStr
      : (' '.repeat(padding.left) + text.slice(start, end).trim()).padEnd(
          width,
          ' '
        ) + newLineStr;
  } else {
    line = firstLine
      ? ' '.repeat(padding.firstLineLeftPadding) +
        text.slice(start, end).trim() +
        newLineStr
      : ' '.repeat(padding.left) + text.slice(start, end).trim() + newLineStr;
  }
  return line;
}

function findNextNonWhitespace(text: string, start: number) {
  return start + text.slice(start).search(/[^ ]/);
}

/**
 * A function used by splitIntoLinesAccordingToWidth() to find the index at
 * which to split.
 */
function findEnd(
  text: string,
  start: number,
  width: number
): [end: number, lastLine: boolean, addNewLine: boolean] {
  const slice = text.slice(start, start + width);
  const newLineCharIndex = slice.indexOf('\n');

  // newline within the slice
  if (newLineCharIndex > -1) {
    return [
      start + newLineCharIndex + 1,
      text.length <= start + newLineCharIndex + 1,
      true,
    ];
  }

  // last line
  if (text.length <= start + width) {
    return [text.length, true, false];
  }

  const lastLine = false;
  if (slice.length === width && text.charAt(start + width) !== ' ') {
    // truncate at the beginning of the last whitespace or at the end of the
    // slice
    const index = start + slice.lastIndexOf(' ');
    return index > start
      ? [findNextNonWhitespace(text, index), lastLine, false]
      : [start + width, lastLine, false];
  }
  // truncate at the end of the last whitespace beginning at the end of the
  // slice (white space at the end of the line is trimmed later)
  return [findNextNonWhitespace(text, start + width), lastLine, false];
}

/**
 * Splits the text into lines along the last whitespace characters within the
 * width. Takes also into account newline characters. Returns the lines as an
 * array of strings. Strings do not include newline characters. Width must be
 * given a value larger than 0 or a default of 80 is used.
 * @param text String to be splitted.
 * @param width Maximum width of a line (must be greater than zero or the
 *    default of 80 is used).
 * @param padding Padding added to lines as a Paddign object.
 * @returns An array of lines of text.
 */
export function splitIntoLinesAccordingToWidth(
  text: string,
  width: number,
  padding: Padding
): string[] {
  // Node.js property process.stdout.columns is not set in tests, which leads
  // the width being undefined. Since the while loop requires the lastLine to
  // be true to stop, and the lastLine is never true if the width is 0 or less,
  // the width must be given a positive value. 80-column rule is a classic line
  // width convention, so that is used as the default value.
  const widthToUse = width > 0 ? width : 80;
  const textWidth = widthToUse - padding.left - padding.right;
  const lines: string[] = [];
  let start = 0;
  let [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
  let firstLine = true;
  while (!lastLine) {
    lines.push(
      createLine(text, start, end, widthToUse, padding, firstLine, addNewLine)
    );

    start = end;
    [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
    if (firstLine) {
      firstLine = false;
    }
  }
  if (start < text.length) {
    lines.push(
      createLine(text, start, end, widthToUse, padding, firstLine, addNewLine)
    );
  }
  return lines;
}

/**
 * Splits the content into lines according to given width and along whitespace
 * and adds a heading in the beginning of the first line. If the paddingLeft
 * argument is not given, the content is padded from left according to the
 * length of the heading. If paddingLeft is given it is used instead.
 * @param heading Heading added on the left, before the content.
 * @param content The text content added after the heading.
 * @param width Maximum text width.
 * @param padEnd Boolean indicating whether the right side of the content
 *    should be padded with whitespace to the given width.
 * @param paddingRight Padding added to the rigth side of text. This reduces
 *    the actual width of the text.
 * @param paddingLeft Padding added to the left side of the text. This reduces
 *    the actual width of the text.
 * @returns The whole text as a string.
 */
export function sideHeadingText(
  heading: string,
  content: string,
  width: number,
  padEnd: boolean,
  paddingRight: number,
  paddingLeft?: number
) {
  const headingStr = `${heading}: `;
  const paddingLeftToUse = paddingLeft ?? headingStr.length;
  const firstLineLeftPadding =
    paddingLeft && paddingLeft > headingStr.length
      ? paddingLeftToUse - headingStr.length
      : 0;
  const firstLineExtraCut =
    paddingLeft && paddingLeft < headingStr.length
      ? headingStr.length - paddingLeft
      : 0;
  const lines = splitIntoLinesAccordingToWidth(content, width, {
    left: paddingLeftToUse,
    right: paddingRight,
    firstLineLeftPadding,
    firstLineExtraCut,
    padEnd,
  });
  return `${headingStr}${lines.join('\n')}`;
}

function findLongest(texts: string[]) {
  return texts.reduce(
    (accum, current) => (current.length > accum ? current.length : accum),
    0
  );
}

/**
 * Creates multiple text blocks splitted on lines with side headings. Different
 * parts having their own headings are entered as a record with heading as the
 * key and the content as the value. If the content is undefined the whole part
 * is left out of the result.
 * @param parts Different parts of the text having their own headings in a
 *    record. Part headings are entered as the keys of the record and the
 *    content as values.
 * @param width Maximum width of the text.
 * @param padEnd Boolean indicating whether the right side of the content
 *    should be padded with whitespace to the given width.
 * @param paddingRight Padding added to the right side of the text.
 * @param indentAccordingToLongest Boolean indicating whether the contents are
 *    indented according to the width of the longest heading or individually
 *    according to the width of each heading.
 * @returns The whole text as a string.
 */
export function sideHeadingTextMultiple(
  parts: Record<string, string | undefined>,
  width: number,
  padEnd: boolean,
  paddingRight: number,
  indentAccordingToLongest: boolean
) {
  const headings = Object.keys(parts);
  const contents = Object.values(parts);
  const paddingLeft = indentAccordingToLongest
    ? findLongest(headings) + 2
    : undefined;
  const sections: string[] = [];
  headings.forEach((heading, i) => {
    if (contents[i]) {
      sections.push(
        sideHeadingText(
          heading,
          contents[i],
          width,
          padEnd,
          paddingRight,
          paddingLeft
        )
      );
    }
  });
  return sections.join('\n');
}

/**
 * Creates a string of a list of sections separated with two newline characters
 * and the separator string between them.
 * @param sections Sections of text to be separated.
 * @param separatorStr Separator string.
 * @returns The whole text as a string.
 */
export function createSeparatedSectionsStr(
  sections: string[],
  separatorStr: string
) {
  return `${`${separatorStr}\n`}${sections.join(`\n${separatorStr}\n`)}${`\n${separatorStr}`}`;
}

/** Amount of padding added to the sides of a table (left, right). */
export type TablePadding = [left: number, right: number];

/**
 * Represents colors and modifiers that are applied either to a whole table
 * cell, just to the content of the cell, or both. Contains two Style objects;
 * one applied to the whole cell and the other only to the contents of the
 * cell.
 */
export interface CellStyling {
  /** Style applied to the whole cell */
  cell?: Style;

  /** Style applied just to the content of the cell. */
  content?: Style;
}

/**
 * Formats a table cell. A table cell is essentially a string padded to it's
 * width with whitespace characters. A table row can be created by
 * concatenating cells together. The style can be applied to the whole cell
 * (e.g., background color, inverse) or just to the content of the cell (e.g.,
 * strikethrough won't go through the whole cell).
 * @param content The content of the cell as a string.
 * @param width The width of the cell.
 * @param style Style applied to the cell, or it's content, or both.
 * @returns The formatted cell as a string.
 */
export function formatCell(
  content: string,
  width: number,
  style: CellStyling | undefined
): string {
  let contentToUse = content;
  if (content.length > width - 1) {
    contentToUse = `${content.slice(0, width - 4)}...`;
  }
  let styledContent = applyStyle(contentToUse, style?.content);
  const escapeCodesWidth = styledContent.length - contentToUse.length;
  styledContent = styledContent.padEnd(width + escapeCodesWidth, ' ');

  if (style) {
    styledContent = applyStyle(styledContent, style.cell);
  }

  return styledContent;
}

/**
 * Creates table rows. Table rows are created by concatenating together cells,
 * that are strings padded to their width with whitespace characters. Tables
 * can be crated by combining multiple rows together.
 * @param contents Contents of each row's cells as arrays of strings.
 * @param colWidths Column/cell widths as an array.
 * @param tablePadding Padding applied to the whole table as a tupple (left,
 *    right).
 * @param styles Styles applied to rows as a single CellStyling object or
 *    arrays of CellStyling objects. If there is only one styling object, the
 *    same style is applied to all cells on every row. If there is one styling
 *    object per row, the style is applied to all cells of the row. Each cell
 *    in a row can also be given its own style.
 * @returns The formatted table row as a string.
 */
export function createRows(
  contents: string[][],
  colWidths: number[],
  tablePadding: TablePadding,
  styles?:
    | CellStyling
    | (CellStyling | undefined)[]
    | (CellStyling | undefined)[][]
): string[] {
  const resultRows: string[] = [];
  contents.forEach((row, i) => {
    let rowStr = '';
    row.forEach((cell, j) => {
      if (styles && Array.isArray(styles)) {
        if (styles[i] && Array.isArray(styles[i])) {
          rowStr += formatCell(cell, colWidths[j], styles[i][j]);
        } else if (styles[i]) {
          rowStr += formatCell(cell, colWidths[j], styles[i]);
        }
      } else {
        rowStr += formatCell(cell, colWidths[j], styles);
      }
    });
    const paddingLeft = ' '.repeat(tablePadding[0]);
    const paddingRight = ' '.repeat(tablePadding[1]);
    resultRows.push(`${paddingLeft}${rowStr}${paddingRight}`);
  });
  return resultRows;
}
