import chalk from 'chalk';
import { applyStyle, Style } from './styling';

export const DEFAULT_CONSOLE_WIDTH = 80;
export const consoleWidth = process.stdout.columns
  ? process.stdout.columns
  : DEFAULT_CONSOLE_WIDTH;

export interface Padding {
  /** Padding on the left side of the string. */
  left: number;

  /** Padding on the right side of the string. */
  right: number;

  /** First line left padding. */
  firstLineLeftPadding: number;

  /**
   * Boolean indicating whether the right padding should be applied
   * as whitespace.
   */
  padEnd: boolean;
}

/**
 * A function used by splitIntoLinesAccordingToWidth() to create the new lines
 * by adding paddings and newline characters.
 * @param text The whole text to split into lines.
 * @param start The start index of the current text slice.
 * @param end The end index of the current text slice.
 * @param width Maximum width of the line.
 * @param padding Padding object containing information on how to pad the line.
 * @param firstLine Boolean indicating whether this is the first line of a
 *    paragraph (first line can be given a different width).
 * @param addNewLine Boolean indicating whether this line ends in a new line
 *    character.
 * @param firstLineWidth A different width for the first line.
 * @returns The line as a string.
 */
function createLine(
  text: string,
  start: number,
  end: number,
  width: number,
  padding: Padding,
  firstLine: boolean,
  addNewLine: boolean,
  firstLineWidth = width
) {
  const newLineStr = addNewLine ? '\n' : '';
  let line = '';
  if (padding.padEnd) {
    line = firstLine
      ? (
          ' '.repeat(padding.firstLineLeftPadding) +
          text.slice(start, end).trim()
        ).padEnd(firstLineWidth, ' ') + newLineStr
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
 * @param text The whole text to be splitted into lines.
 * @param start Start index of the current text slice.
 * @param width Maximum width of the line.
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
 * @param firstLineWidth The first line can be given a different width. This is
 *    necessary, e.g., when a side heading is added to the first line.
 * @returns An array of lines of text.
 */
export function splitIntoLinesAccordingToWidth(
  text: string,
  width: number,
  padding: Padding,
  firstLineWidth = width
): string[] {
  // Node.js property process.stdout.columns is not set in tests, which leads
  // the width being undefined. Since the while loop requires the lastLine to
  // be true to stop, and the lastLine is never true if the width is 0 or less,
  // the width must be given a positive value. 80-column rule is a classic line
  // width convention, so that is used as the default value.
  const widthToUse = width > 0 ? width : DEFAULT_CONSOLE_WIDTH;
  const textWidth = widthToUse - padding.left - padding.right;
  const lines: string[] = [];
  let start = 0;
  let [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
  let firstLine = true;
  while (!lastLine) {
    lines.push(
      createLine(
        text,
        start,
        end,
        widthToUse,
        padding,
        firstLine,
        addNewLine,
        firstLineWidth
      )
    );

    start = end;
    [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
    if (firstLine) {
      firstLine = false;
    }
  }
  if (start < text.length) {
    lines.push(
      createLine(
        text,
        start,
        end,
        widthToUse,
        padding,
        firstLine,
        addNewLine,
        firstLineWidth
      )
    );
  }
  return lines;
}

/**
 * Splits the content into lines according to given width and along whitespace
 * and adds a heading in the beginning of the first line. If the paddingLeft
 * argument is not given, the content is padded from left according to the
 * length of the heading. If paddingLeft is given it is used instead.
 *
 * NOTICE! Use contentStyle, headingStyle and boldHeading parameters for
 * styling. Do not add stylings straight into heading or content strings. ANSI
 * characters in them are counted into width and this messes the indenting.
 * @param heading Heading added on the left, before the content.
 * @param content The text content added after the heading.
 * @param width Maximum text width. Default is process.stdout.columns.
 * @param padEnd Boolean indicating whether the right side of the content
 *    should be padded with whitespace to the given width. Default is false.
 * @param paddingRight Padding added to the rigth side of text. This reduces
 *    the actual width of the text. Default is 0.
 * @param paddingLeft Padding added to the left side of the text. This reduces
 *    the actual width of the text. Default is 0.
 * @param boldHeading Boolean indicating whether the heading is bold or not.
 *    Default is true.
 * @param contentStylings A Style object used for styling the content (see
 *    Style in stylings.ts).
 * @param headingStylings A Style object used for styling the heading (see
 *    Style in stylings.ts).
 * @param colorLevel The color output level can be customized with this
 *    argument for the sake of testability (see
 *    chalk.level {@link https://github.com/chalk/chalk?tab=readme-ov-file#chalklevel}).
 * @returns The whole text as a string.
 */
export function sideHeadingText(
  heading: string,
  content: string,
  width: number = process.stdout.columns,
  padEnd = false,
  paddingRight = 0,
  paddingLeft = 0,
  boldHeading = true,
  contentStyle?: Style,
  headingStyle?: Style,
  colorLevel: chalk.Level = 1
) {
  const widthToUse = width > 0 ? width : DEFAULT_CONSOLE_WIDTH;

  // chalk level can be overridden for the sake of testability
  chalk.level = process.env.FORCE_COLOR
    ? (parseInt(process.env.FORCE_COLOR, 10) as chalk.Level)
    : colorLevel;

  const headingContentStr = `${heading}:`;
  const styledHeadingStr = boldHeading
    ? applyStyle(`${chalk.bold(headingContentStr)} `, headingStyle)
    : applyStyle(`${headingContentStr} `, headingStyle);
  const headingWidth = headingContentStr.length + 1;
  const paddingLeftToUse = paddingLeft || headingWidth;

  const firstLineLeftPadding =
    paddingLeft && paddingLeft > headingWidth
      ? paddingLeftToUse - headingWidth
      : 0;
  const firstLineWidth = widthToUse - headingWidth;

  const lines = splitIntoLinesAccordingToWidth(
    content,
    widthToUse,
    {
      left: paddingLeftToUse,
      right: paddingRight,
      firstLineLeftPadding,
      padEnd,
    },
    firstLineWidth
  );
  return `${styledHeadingStr}${applyStyle(lines.join('\n'), contentStyle)}`;
}

function findLongest(texts: string[]) {
  return texts.reduce(
    (accum, current) => (current.length > accum ? current.length : accum),
    0
  );
}

function pickStylings(
  headingStylings: Record<string, Style>,
  contentStylings: Record<string, Style>,
  heading: string
) {
  let headingStyle: Style | undefined;
  let contentStyle: Style | undefined;

  if (headingStylings[heading]) {
    headingStyle = headingStylings[heading];
  } else if (headingStylings.all) {
    headingStyle = headingStylings.all;
  } else if (headingStylings.rest) {
    headingStyle = headingStylings.rest;
  }

  if (contentStylings[heading]) {
    contentStyle = contentStylings[heading];
  } else if (contentStylings.all) {
    contentStyle = contentStylings.all;
  } else if (contentStylings.rest) {
    contentStyle = contentStylings.rest;
  }

  return [headingStyle, contentStyle];
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
 * @param boldHeadings Boolean indicating whether the heading text is bold.
 * @param contentStylings A record of stylings (see Style in stylings.ts) to
 *    style each text block's content. Key is either the heading of the block
 *    or 'all' or 'rest'. By using 'all' or 'rest' as the key, all content
 *    blocks that are not a key in the record are styled with the style. By
 *    choosing the 'all' key instead of the 'rest' key, the developer can
 *    communicate that the style is meant to apply to all content blocks.
 * @param headingStylings A record of stylings (see Style in stylings.ts) to
 *    style each heading. Key is either the heading itself, or 'all' or 'rest'.
 *    By using 'all' or 'rest' as the key, all headings that are not a key in
 *    the record are styled with the style. By choosing the 'all' key instead
 *    of the 'rest' key, the developer can communicate that the style is meant
 *    to apply to all headers.
 * @returns The whole text as a string.
 */
export function sideHeadingTextMultiple(
  parts: Record<string, string | undefined>,
  indentAccordingToLongest = false,
  width = process.stdout.columns,
  padEnd = false,
  paddingRight = 0,
  boldHeadings = true,
  contentStylings: Record<string, Style> = {},
  headingStylings: Record<string, Style> = {}
) {
  const widthToUse = width > 0 ? width : DEFAULT_CONSOLE_WIDTH;
  const headings = Object.keys(parts);
  const contents = Object.values(parts);
  const paddingLeft = indentAccordingToLongest
    ? findLongest(headings) + 2
    : undefined;
  const sections: string[] = [];
  headings.forEach((heading, i) => {
    const [headingStyle, contentStyle] = pickStylings(
      headingStylings,
      contentStylings,
      heading
    );
    if (contents[i]) {
      sections.push(
        sideHeadingText(
          heading,
          contents[i],
          widthToUse,
          padEnd,
          paddingRight,
          paddingLeft,
          boldHeadings,
          contentStyle,
          headingStyle
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

/**
 * Truncates string to the given width and adds an ellipsis to the end. If the
 * last character before ellipsis would be a whitespace, it is trimmed and the
 * string is padded with whitespace to the width.
 * @param content The string to truncate.
 * @param width Width to truncate to.
 * @returns Truncated string with an ellipsis at the end.
 */
export function truncateToWidthWithEllipsis(content: string, width: number) {
  if (content.length > width) {
    return `${content.slice(0, width - 3).trimEnd()}...`.padEnd(width, ' ');
  }
  return content;
}

/**
 * Creates a new string with message parts joined together and the part pointed
 * by truncatedPartIndex argument truncated to width remaining after the length
 * of the other parts have been deduced from the width. Truncated part is not
 * truncated shorter than the truncatedPartMinWidth.
 * @param messageParts
 * @param truncatedPartIndex
 * @param width
 * @param truncatedPartMinWidth
 * @returns
 */
export function messageWithTruncatedPart(
  messageParts: (string | undefined | null)[],
  truncatedPartIndex: number,
  width = consoleWidth,
  truncatedPartMinWidth = 15
) {
  const fullParts = messageParts.toSpliced(truncatedPartIndex, 1);
  const fullPartWidths = fullParts.reduce(
    (accumulator, currentPart) =>
      currentPart ? accumulator + currentPart.length : accumulator,
    0
  );
  const truncatedPartMaxWidth = width - fullPartWidths;
  const truncateToWidth =
    truncatedPartMaxWidth > truncatedPartMinWidth
      ? truncatedPartMaxWidth
      : truncatedPartMinWidth;
  if (
    messageParts[truncatedPartIndex] &&
    messageParts[truncatedPartIndex].length > truncatedPartMaxWidth
  ) {
    const truncatedPart = truncateToWidthWithEllipsis(
      messageParts[truncatedPartIndex],
      truncateToWidth
    );
    const modifiedParts = messageParts.toSpliced(
      truncatedPartIndex,
      1,
      truncatedPart
    );
    return modifiedParts.join('');
  }
  return messageParts.join('');
}

/** Formats string using common successful result formatting. */
export function formatSuccess(message: string) {
  return chalk.cyan(message);
}

/** Formats string using common error message formatting. */
export function formatError(message: string) {
  return chalk.red(message);
}

/** Formats string using common notice formatting. */
export function formatNotice(message: string) {
  return chalk.yellow(message);
}

/** Outputs message to stdout using common successful result formatting. */
export function outputSuccess(message: string): void {
  console.log(formatSuccess(message));
}

/** Outputs message to stderr using common error formatting. */
export function outputError(message: string): void {
  console.error(formatError(message));
}

/** Outputs message to stdout using common notice formatting. */
export function outputNotice(message: string): void {
  console.log(formatNotice(message));
}

/** Outputs message to stdout without additional formatting. */
export function outputPlain(message: string): void {
  console.log(message);
}
