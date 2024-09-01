import prettyAnsi from 'pretty-ansi';
import {
  createSeparatedSectionsStr,
  sideHeadingText,
  sideHeadingTextMultiple,
  splitIntoLinesAccordingToWidth,
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
      width,
      padEnd,
      paddingRight,
      indentAccordingToLongest
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
      width,
      padEnd,
      paddingRight,
      indentAccordingToLongest
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
      width,
      padEnd,
      paddingRight,
      indentAccordingToLongest
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
      width,
      padEnd,
      paddingRight,
      indentAccordingToLongest
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
      width,
      padEnd,
      paddingRight,
      indentAccordingToLongest
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
