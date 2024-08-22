export type Padding = [left: number, right: number, firstLine: number];

function createLine(
  text: string,
  start: number,
  end: number,
  padding: Padding,
  firstLine: boolean,
  addNewLine: boolean
) {
  const newLineStr = addNewLine ? '\n' : '';
  return firstLine
    ? `${' '.repeat(padding[2])}${text.slice(start, end).trim()}${' '.repeat(padding[1])}${newLineStr}`
    : `${' '.repeat(padding[0])}${text.slice(start, end).trim()}${' '.repeat(padding[1])}${newLineStr}`;
}

function findEnd(
  text: string,
  start: number,
  width: number
): [number, boolean, boolean] {
  const slice = text.slice(start, start + width);

  const newLineCharIndex = slice.indexOf('\n');
  if (newLineCharIndex > 0) {
    return [
      start + newLineCharIndex,
      text.length < start + newLineCharIndex,
      true,
    ];
  }

  if (text.length < start + width) {
    return [text.length, true, false];
  }
  const lastLine = start + width >= text.length;
  if (slice.length === width && text.charAt(start + width) !== ' ') {
    const index = start + slice.lastIndexOf(' ');
    return index > start
      ? [index, lastLine, false]
      : [start + width, lastLine, false];
  }
  return [start + slice.length, lastLine, false];
}

/**
 * Splits the text into lines along the last whitespace characters within the
 * width. Takes also into account newline characters. Returns the lines as an
 * array of strings. Strings do not include newline characters.
 * @param text String to be splitted.
 * @param width Maximum width of a line.
 * @param padding Padding added to lines as a 3-tuple having the following
 *    semantics: 0 - left, 1 - right and 2 - first line.
 * @returns An array of lines of text.
 */
export function splitIntoLinesAccordingToWidth(
  text: string,
  width: number,
  padding: Padding
): string[] {
  const textWidth = width - padding[0] - padding[1];
  const lines: string[] = [];
  let start = 0;
  let [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
  let firstLine = true;
  while (!lastLine) {
    lines.push(createLine(text, start, end, padding, firstLine, addNewLine));

    start = end;
    [end, lastLine, addNewLine] = findEnd(text, start, textWidth);
    if (firstLine) {
      firstLine = false;
    }
  }
  if (start < text.length) {
    lines.push(createLine(text, start, end, padding, firstLine, addNewLine));
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
  paddingRight: number,
  paddingLeft?: number
) {
  const headingStr = `${heading}: `;
  const paddingLeftToUse = paddingLeft ?? headingStr.length;
  const firstLineLeftPadding = paddingLeft
    ? paddingLeftToUse - headingStr.length
    : 0;
  const lines = splitIntoLinesAccordingToWidth(content, width, [
    paddingLeftToUse,
    paddingRight,
    firstLineLeftPadding,
  ]);
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
 * @param paddingRight Padding added to the right side of the text.
 * @param indentAccordingToLongest Boolean indicating whether the contents are
 *    indented according to the width of the longest heading or individually
 *    according to the width of each heading.
 * @returns The whole text as a string.
 */
export function sideHeadingTextMultiple(
  parts: Record<string, string | undefined>,
  width: number,
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
        sideHeadingText(heading, contents[i], width, paddingRight, paddingLeft)
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
  return `${`${separatorStr}\n`}${sections.join(`\n${separatorStr}`)}${`\n${separatorStr}`}`;
}
