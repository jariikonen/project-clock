import prettyAnsi from 'pretty-ansi';
import {
  createSeparatedSectionsStr,
  messageWithTruncatedPart,
  sideHeadingText,
  sideHeadingTextMultiple,
  splitIntoLinesAccordingToWidth,
  truncateToWidthWithEllipsis,
} from '../../common/outputFormatting';

const eigthyTwoChars = '-'.repeat(82);
const tenChars = '-'.repeat(10);
const sixtyChars = '-'.repeat(60);
const fiveSpaces = ' '.repeat(5);

describe('splitLinesAccordingToWidth()', () => {
  const testText = `${eigthyTwoChars} ${tenChars} ${tenChars} ${sixtyChars}${fiveSpaces}${tenChars}${fiveSpaces}${tenChars}`;

  test('width = 80, padEnd = false, padding.right = 1', () => {
    const width = 80;
    const padEnd = false;
    const paddingRight = 1;
    const expectedLines = [
      '-'.repeat(width - paddingRight),
      '--- ---------- ----------',
      '------------------------------------------------------------     ----------',
      '----------',
    ];

    const response = splitIntoLinesAccordingToWidth(testText, width, {
      left: 0,
      right: paddingRight,
      firstLineLeftPadding: 0,
      padEnd,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 80, padEnd = true, padding.right = 1', () => {
    const width = 80;
    const padEnd = true;
    const paddingRight = 1;
    const expectedLines = [
      '-'.repeat(width - paddingRight).padEnd(width, ' '),
      '--- ---------- ----------'.padEnd(width, ' '),
      '------------------------------------------------------------     ----------'.padEnd(
        width,
        ' '
      ),
      '----------'.padEnd(width, ' '),
    ];

    const response = splitIntoLinesAccordingToWidth(testText, width, {
      left: 0,
      right: paddingRight,
      firstLineLeftPadding: 0,
      padEnd,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 80, padEnd = false, padding.right = 1, padding.left = 10, padding.firstLineLeft = 10', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 10;
    const firstLineLeftPadding = 10;
    const expectedLines = [
      ' '.repeat(10) + '-'.repeat(width - firstLineLeftPadding - paddingRight),
      '          ------------- ---------- ----------',
      '          ------------------------------------------------------------',
      '          ----------     ----------',
    ];

    const response = splitIntoLinesAccordingToWidth(testText, width, {
      left: paddingLeft,
      right: paddingRight,
      firstLineLeftPadding,
      padEnd: false,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 80, padEnd = true, padding.right = 1, padding.left = 10, padding.firstLineLeft = 10', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 10;
    const firstLineLeftPadding = 10;
    const expectedLines = [
      (' '.repeat(10) + '-'.repeat(width - paddingLeft - paddingRight)).padEnd(
        width,
        ' '
      ),
      '          ------------- ---------- ----------'.padEnd(width, ' '),
      '          ------------------------------------------------------------'.padEnd(
        width,
        ' '
      ),
      '          ----------     ----------'.padEnd(width, ' '),
    ];

    const response = splitIntoLinesAccordingToWidth(testText, width, {
      left: paddingLeft,
      right: paddingRight,
      firstLineLeftPadding,
      padEnd: true,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 80, padEnd = false, padding.right = 1, padding.left = 10, padding.firstLineLeft = 0', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 10;
    const firstLineLeftPadding = 0;
    const expectedLines = [
      '-'.repeat(width - paddingLeft - paddingRight),
      '          ------------- ---------- ----------',
      '          ------------------------------------------------------------',
      '          ----------     ----------',
    ];

    const response = splitIntoLinesAccordingToWidth(testText, width, {
      left: paddingLeft,
      right: paddingRight,
      firstLineLeftPadding,
      padEnd: false,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 80, padEnd = true, padding.right = 1, padding.left = 10, padding.firstLineLeft = 0', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 10;
    const firstLineLeftPadding = 0;
    const firstLineWidth = width - paddingLeft;
    const expectedLines = [
      '-'
        .repeat(width - paddingLeft - paddingRight)
        .padEnd(width - paddingLeft, ' '),
      '          ------------- ---------- ----------'.padEnd(width, ' '),
      '          ------------------------------------------------------------'.padEnd(
        width,
        ' '
      ),
      '          ----------     ----------'.padEnd(width, ' '),
    ];

    const response = splitIntoLinesAccordingToWidth(
      testText,
      width,
      {
        left: paddingLeft,
        right: paddingRight,
        firstLineLeftPadding,
        padEnd: true,
      },
      firstLineWidth
    );
    expect(response).toEqual(expectedLines);
  });

  const testTextNewLine = `${tenChars} ${tenChars} ${tenChars} ${tenChars} ${tenChars}\n${tenChars} ${tenChars} ${tenChars} ${tenChars}\n`;

  test('width = 45, padEnd = false, newline characters in text', () => {
    const width = 45;
    const paddingRight = 1;

    const expectedLines = [
      `${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      `${tenChars}\n`,
      `${tenChars} ${tenChars} ${tenChars} ${tenChars}\n`,
    ];

    const response = splitIntoLinesAccordingToWidth(testTextNewLine, width, {
      left: 0,
      right: paddingRight,
      firstLineLeftPadding: 0,
      padEnd: false,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width = 45, padEnd = false, newline characters in text', () => {
    const width = 45;
    const paddingRight = 1;

    const expectedLines = [
      `${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(width, ' '),
      `${tenChars.padEnd(width, ' ')}\n`,
      `${`${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(width, ' ')}\n`,
    ];

    const response = splitIntoLinesAccordingToWidth(testTextNewLine, width, {
      left: 0,
      right: paddingRight,
      firstLineLeftPadding: 0,
      padEnd: true,
    });
    expect(response).toEqual(expectedLines);
  });

  test('width 0 should be replaced with default width 80', () => {
    const width = 0;
    const paddingRight = 1;
    const expectedLines = [
      '-'.repeat(80 - paddingRight),
      '--- ---------- ----------',
      '------------------------------------------------------------     ----------',
      '----------',
    ];

    const response = splitIntoLinesAccordingToWidth(
      testText,
      width - paddingRight,
      {
        left: 0,
        right: paddingRight,
        firstLineLeftPadding: 0,
        padEnd: false,
      }
    );
    expect(response).toEqual(expectedLines);
  });
});

describe('sideHeadingText(), color and stylings OFF', () => {
  let oldEnv = {};

  beforeEach(() => {
    oldEnv = process.env;
    process.env = { ...oldEnv, FORCE_COLOR: '0' };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  const testText = `${tenChars} ${tenChars} ${tenChars} ${tenChars} ${sixtyChars}${fiveSpaces}${tenChars}${fiveSpaces}${tenChars} ${eigthyTwoChars}`;

  test('width = 80, padEnd = false, paddingRight = 1', () => {
    const width = 80;
    const paddingRight = 1;
    const headingLength = `${tenChars}: `.length;
    const expectedLines = [
      `${tenChars}: ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(headingLength) + sixtyChars,
      `${' '.repeat(headingLength)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(headingLength) +
        '-'.repeat(width - headingLength - paddingRight),
      ' '.repeat(headingLength) +
        '-'.repeat(82 - (width - headingLength - paddingRight)),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      false,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1', () => {
    const width = 80;
    const paddingRight = 1;
    const headingLength = `${tenChars}: `.length;
    const expectedLines = [
      `${tenChars}: ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width,
        ' '
      ),
      (' '.repeat(headingLength) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(headingLength)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(headingLength) +
        '-'.repeat(width - headingLength - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(headingLength) +
        '-'.repeat(82 - (width - headingLength - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      true,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = false, paddingRight = 1, paddingLeft = 15', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 15;
    const expectedLines = [
      `${tenChars}:    ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(paddingLeft) + sixtyChars,
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight),
      ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight)),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      false,
      paddingRight,
      paddingLeft
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1, paddingLeft = 15', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 15;
    const expectedLines = [
      `${tenChars}:    ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width,
        ' '
      ),
      (' '.repeat(paddingLeft) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      true,
      paddingRight,
      paddingLeft
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = false, paddingRight = 1, paddingLeft = 5', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 5;
    const expectedLines = [
      `${tenChars}: ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(paddingLeft) + sixtyChars,
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight),
      ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight)),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      false,
      paddingRight,
      paddingLeft
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1, paddingLeft = 5', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 5;
    const expectedLines = [
      `${tenChars}: ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width,
        ' '
      ),
      (' '.repeat(paddingLeft) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = sideHeadingText(
      tenChars,
      testText,
      width,
      true,
      paddingRight,
      paddingLeft
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width 0 should be replaced with default width 80', () => {
    const paddingRight = 1;
    const headingLength = `${tenChars}: `.length;
    const expectedLines = [
      `${tenChars}: ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(headingLength) + sixtyChars,
      `${' '.repeat(headingLength)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(headingLength) + '-'.repeat(80 - headingLength - paddingRight),
      ' '.repeat(headingLength) +
        '-'.repeat(82 - (80 - headingLength - paddingRight)),
    ];

    const response = sideHeadingText(tenChars, testText, 0, false, 1);
    expect(response).toEqual(expectedLines.join('\n'));
  });
});

describe('sideHeadingText(), color and stylings ON', () => {
  let oldEnv = {};

  beforeEach(() => {
    oldEnv = process.env;
    process.env = { ...oldEnv, FORCE_COLOR: '1' };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  const testText = `${tenChars} ${tenChars} ${tenChars} ${tenChars} ${sixtyChars}${fiveSpaces}${tenChars}${fiveSpaces}${tenChars} ${eigthyTwoChars}`;

  test('width = 80, padEnd = false, paddingRight = 1', () => {
    const width = 80;
    const paddingRight = 1;
    const headingLength = `${tenChars}: `.length;
    const expectedLines = [
      `<bold>${tenChars}:</intensity> ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(headingLength) + sixtyChars,
      `${' '.repeat(headingLength)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(headingLength) +
        '-'.repeat(width - headingLength - paddingRight),
      ' '.repeat(headingLength) +
        '-'.repeat(82 - (width - headingLength - paddingRight)),
    ];

    const response = prettyAnsi(
      sideHeadingText(tenChars, testText, width, false, paddingRight)
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1', () => {
    const width = 80;
    const paddingRight = 1;
    const headingLength = `${tenChars}: `.length;
    const escapeCodesLength = '<bold></intensity>'.length;
    const expectedLines = [
      `<bold>${tenChars}:</intensity> ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width + escapeCodesLength,
        ' '
      ),
      (' '.repeat(headingLength) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(headingLength)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(headingLength) +
        '-'.repeat(width - headingLength - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(headingLength) +
        '-'.repeat(82 - (width - headingLength - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = prettyAnsi(
      sideHeadingText(tenChars, testText, width, true, paddingRight)
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = false, paddingRight = 1, paddingLeft = 15', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 15;
    const expectedLines = [
      `<bold>${tenChars}:</intensity>    ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(paddingLeft) + sixtyChars,
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight),
      ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight)),
    ];

    const response = prettyAnsi(
      sideHeadingText(
        tenChars,
        testText,
        width,
        false,
        paddingRight,
        paddingLeft
      )
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1, paddingLeft = 15', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 15;
    const escapeCodesLength = '<bold></intensity>'.length;
    const expectedLines = [
      `<bold>${tenChars}:</intensity>    ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width + escapeCodesLength,
        ' '
      ),
      (' '.repeat(paddingLeft) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = prettyAnsi(
      sideHeadingText(
        tenChars,
        testText,
        width,
        true,
        paddingRight,
        paddingLeft
      )
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = false, paddingRight = 1, paddingLeft = 5', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 5;
    const expectedLines = [
      `<bold>${tenChars}:</intensity> ${tenChars} ${tenChars} ${tenChars} ${tenChars}`,
      ' '.repeat(paddingLeft) + sixtyChars,
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`,
      ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight),
      ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight)),
    ];

    const response = prettyAnsi(
      sideHeadingText(
        tenChars,
        testText,
        width,
        false,
        paddingRight,
        paddingLeft
      )
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width = 80, padEnd = true, paddingRight = 1, paddingLeft = 5', () => {
    const width = 80;
    const paddingRight = 1;
    const paddingLeft = 5;
    const escapeCodesLength = '<bold></intensity>'.length;
    const expectedLines = [
      `<bold>${tenChars}:</intensity> ${tenChars} ${tenChars} ${tenChars} ${tenChars}`.padEnd(
        width + escapeCodesLength,
        ' '
      ),
      (' '.repeat(paddingLeft) + sixtyChars).padEnd(width, ' '),
      `${' '.repeat(paddingLeft)}${tenChars}${fiveSpaces}${tenChars}`.padEnd(
        width,
        ' '
      ),
      (
        ' '.repeat(paddingLeft) + '-'.repeat(width - paddingLeft - paddingRight)
      ).padEnd(width, ' '),
      (
        ' '.repeat(paddingLeft) +
        '-'.repeat(82 - (width - paddingLeft - paddingRight))
      ).padEnd(width, ' '),
    ];

    const response = prettyAnsi(
      sideHeadingText(
        tenChars,
        testText,
        width,
        true,
        paddingRight,
        paddingLeft
      )
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });
});

describe('sideHeadingTextMultiple(), color and stylings OFF', () => {
  let oldEnv = {};

  beforeEach(() => {
    oldEnv = process.env;
    process.env = { ...oldEnv, FORCE_COLOR: '0' };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  const testText = `${sixtyChars}${fiveSpaces}${tenChars}${fiveSpaces}${tenChars}`;

  test('three texts, width = 80, padEnd = false, paddingRight = 1, indentAccordingToLongest = false', () => {
    const width = 80;
    const padEnd = false;
    const paddingRight = 1;
    const indentAccordingToLongest = false;

    const expectedLines = [
      `heading1: ${sixtyChars}`,
      `          ${tenChars}${fiveSpaces}${tenChars}`,
      `heading2long: ${sixtyChars}`,
      `              ${tenChars}${fiveSpaces}${tenChars}`,
      `heading3: ${sixtyChars}`,
      `          ${tenChars}${fiveSpaces}${tenChars}`,
    ];

    const response = sideHeadingTextMultiple(
      {
        heading1: testText,
        heading2long: testText,
        heading3: testText,
      },
      indentAccordingToLongest,
      width,
      padEnd,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('three texts, width = 80, padEnd = true, paddingRight = 1, indentAccordingToLongest = false', () => {
    const width = 80;
    const padEnd = true;
    const paddingRight = 1;
    const indentAccordingToLongest = false;

    const expectedLines = [
      `heading1: ${sixtyChars}`.padEnd(width, ' '),
      `          ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
      `heading2long: ${sixtyChars}`.padEnd(width, ' '),
      `              ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
      `heading3: ${sixtyChars}`.padEnd(width, ' '),
      `          ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
    ];

    const response = sideHeadingTextMultiple(
      {
        heading1: testText,
        heading2long: testText,
        heading3: testText,
      },
      indentAccordingToLongest,
      width,
      padEnd,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('three texts, width = 80, padEnd = false, paddingRight = 1, indentAccordingToLongest = true', () => {
    const width = 80;
    const padEnd = false;
    const paddingRight = 1;
    const indentAccordingToLongest = true;

    const expectedLines = [
      `heading1:     ${sixtyChars}`,
      `              ${tenChars}${fiveSpaces}${tenChars}`,
      `heading2long: ${sixtyChars}`,
      `              ${tenChars}${fiveSpaces}${tenChars}`,
      `heading3:     ${sixtyChars}`,
      `              ${tenChars}${fiveSpaces}${tenChars}`,
    ];

    const response = sideHeadingTextMultiple(
      {
        heading1: testText,
        heading2long: testText,
        heading3: testText,
      },
      indentAccordingToLongest,
      width,
      padEnd,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('three texts, width = 80, padEnd = true, paddingRight = 1, indentAccordingToLongest = true', () => {
    const width = 80;
    const padEnd = true;
    const paddingRight = 1;
    const indentAccordingToLongest = true;

    const expectedLines = [
      `heading1:     ${sixtyChars}`.padEnd(width, ' '),
      `              ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
      `heading2long: ${sixtyChars}`.padEnd(width, ' '),
      `              ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
      `heading3:     ${sixtyChars}`.padEnd(width, ' '),
      `              ${tenChars}${fiveSpaces}${tenChars}`.padEnd(width, ' '),
    ];

    const response = sideHeadingTextMultiple(
      {
        heading1: testText,
        heading2long: testText,
        heading3: testText,
      },
      indentAccordingToLongest,
      width,
      padEnd,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });

  test('width 0 should be replaced with default width 80', () => {
    const width = 0;
    const padEnd = false;
    const paddingRight = 1;
    const indentAccordingToLongest = false;

    const expectedLines = [
      `heading1: ${sixtyChars}`,
      `          ${tenChars}${fiveSpaces}${tenChars}`,
      `heading2long: ${sixtyChars}`,
      `              ${tenChars}${fiveSpaces}${tenChars}`,
      `heading3: ${sixtyChars}`,
      `          ${tenChars}${fiveSpaces}${tenChars}`,
    ];

    const response = sideHeadingTextMultiple(
      {
        heading1: testText,
        heading2long: testText,
        heading3: testText,
      },
      indentAccordingToLongest,
      width,
      padEnd,
      paddingRight
    );
    expect(response).toEqual(expectedLines.join('\n'));
  });
});

describe('createSeparatedSectionsStr', () => {
  test('outputs correct string', () => {
    const sections = ['first test text', 'second test text', 'third test text'];
    const separatorStr = '---';

    const expectedLines = [
      '---',
      'first test text',
      '---',
      'second test text',
      '---',
      'third test text',
      '---',
    ];

    const response = createSeparatedSectionsStr(sections, separatorStr);
    expect(response).toEqual(expectedLines.join('\n'));
  });
});

describe('truncateToWidthWithEllipsis()', () => {
  test('content is shorter than width', () => {
    const content = tenChars;
    const width = 15;

    const response = truncateToWidthWithEllipsis(content, width);

    expect(response).toEqual(content);
    expect(response.length).toBeLessThanOrEqual(width);
    expect(response.length).toEqual(content.length);
  });

  test('content is as long as the width', () => {
    const width = 15;
    const content = '#'.repeat(width);

    const response = truncateToWidthWithEllipsis(content, width);

    expect(response).toEqual(content);
    expect(response.length).toBeLessThanOrEqual(width);
    expect(response.length).toEqual(content.length);
  });

  test('content is one char longer than width', () => {
    const width = 15;
    const content = '#'.repeat(width + 1);

    const response = truncateToWidthWithEllipsis(content, width);

    expect(response.length).toEqual(width);
    expect(response).toEqual(`${'#'.repeat(width - 3)}...`);
  });

  test('content is much longer than width', () => {
    const width = 15;
    const content = '#'.repeat(width * 2);

    const response = truncateToWidthWithEllipsis(content, width);

    expect(response.length).toEqual(width);
    expect(response).toEqual(`${'#'.repeat(width - 3)}...`);
  });

  test('content is longer than width and there is a whitespace that is trimmed from the end of the content when it is truncated', () => {
    const width = 10;
    const content = '### ## ####';

    const response = truncateToWidthWithEllipsis(content, width);

    expect(response.length).toEqual(width);
    expect(response).toEqual('### ##... ');
  });
});

describe('messageWithTruncatedPart', () => {
  const otherParts = [
    '#'.repeat(10),
    '¤'.repeat(10),
    '%'.repeat(10),
    '&'.repeat(10),
  ];

  test('the part to be truncated is shorter than the remaining width (part is not truncated)', () => {
    const partToTruncate = 'T'.repeat(8);
    const parts = [otherParts[0], partToTruncate, otherParts[1]];
    const response = messageWithTruncatedPart(parts, 1, 30);
    expect(response.length).toEqual(28);
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 18)).toEqual(partToTruncate);
    expect(response.slice(18, 28)).toEqual(otherParts[1]);
  });

  test('the part to be truncated is longer than the remaining width (part is truncated)', () => {
    const partToTruncate = 'T'.repeat(11);
    const parts = [otherParts[0], partToTruncate, otherParts[1]];
    const width = 30;
    const truncatedPartMinWidth = 5;
    const response = messageWithTruncatedPart(
      parts,
      1,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 20)).toEqual(`${'T'.repeat(7)}...`);
    expect(response.slice(20, 30)).toEqual(otherParts[1]);
    expect(response.length).toEqual(30);
  });

  test('the length of the part to be truncated is equal to the remaining width (part is not truncated)', () => {
    const partToTruncate = 'T'.repeat(10);
    const parts = [otherParts[0], partToTruncate, otherParts[1]];
    const width = 30;
    const truncatedPartMinWidth = 5;
    const response = messageWithTruncatedPart(
      parts,
      1,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 20)).toEqual('T'.repeat(10));
    expect(response.slice(20, 30)).toEqual(otherParts[1]);
    expect(response.length).toEqual(30);
  });

  test('the length of the part to be truncated is shorter than truncatedPartMinWidth', () => {
    const partToTruncate = 'T'.repeat(11);
    const parts = [otherParts[0], partToTruncate, otherParts[1]];
    const width = 30;
    const truncatedPartMinWidth = 15;
    const response = messageWithTruncatedPart(
      parts,
      1,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 21)).toEqual(partToTruncate);
    expect(response.slice(21, 31)).toEqual(otherParts[1]);
    expect(response.length).toEqual(31);
  });

  test('only one part in addition to the part to be truncated, before the part to be truncated', () => {
    const partToTruncate = 'T'.repeat(11);
    const parts = [otherParts[0], partToTruncate];
    const width = 20;
    const truncatedPartMinWidth = 5;
    const response = messageWithTruncatedPart(
      parts,
      1,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 20)).toEqual(`${'T'.repeat(7)}...`);
    expect(response.length).toEqual(20);
  });

  test('only one part in addition to the part to be truncated, after the part to be truncated', () => {
    const partToTruncate = 'T'.repeat(11);
    const parts = [partToTruncate, otherParts[1]];
    const width = 20;
    const truncatedPartMinWidth = 5;
    const response = messageWithTruncatedPart(
      parts,
      0,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(`${'T'.repeat(7)}...`);
    expect(response.slice(10, 20)).toEqual(otherParts[1]);
    expect(response.length).toEqual(20);
  });

  test('more than two parts in addition to the part to be truncated', () => {
    const partToTruncate = 'T'.repeat(14);
    const parts = [
      otherParts[0],
      partToTruncate,
      otherParts[1],
      otherParts[2],
      otherParts[3],
    ];
    const width = 50;
    const truncatedPartMinWidth = 5;
    const response = messageWithTruncatedPart(
      parts,
      1,
      width,
      truncatedPartMinWidth
    );
    expect(response.slice(0, 10)).toEqual(otherParts[0]);
    expect(response.slice(10, 20)).toEqual(`${'T'.repeat(7)}...`);
    expect(response.slice(20, 30)).toEqual(otherParts[1]);
    expect(response.slice(30, 40)).toEqual(otherParts[2]);
    expect(response.slice(40, 50)).toEqual(otherParts[3]);
    expect(response.length).toEqual(50);
  });
});
