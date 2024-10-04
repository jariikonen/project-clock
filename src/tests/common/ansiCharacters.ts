/** Returns the data string stripped of ANSI special characters. */
export function stripAnsi(data: string) {
  return data.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, // eslint-disable-line no-control-regex
    ''
  );
}

/** Returns the data string with newline characters changed to <newline>. */
export function visibleNewline(data: string) {
  return data.replace(/\n/g, '<newline>');
}

/**
 * Returns the data string stripped of the color and modifier tags made visible
 * by prettyAnsi.
 */
export function stripPrettifiedColorAndModifiers(data: string) {
  const colors =
    /<black>|<red>|<green>|<yellow>|<blue>|<magenta>|<cyan>|<white>|<gray>|<\/color>/;
  const brightColors =
    /<brightBlack>|<brightRed>|<brightGreen>|<brightYellow>|<brightBlue>|<brightMagenta>|<brightCyan>|<brightWhite>/;
  const modifiers =
    /<bold>|<dim>|<\/intensity>|<italic>|<\/italic>|<underline>|<\/underline>|<inverse>|<\/inverse>|<hidden>|<\/hidden>|<strikethrough>|<\/strikethrough>|<overline>|<\/overline>/;
  const backgroundColors =
    /<backgroundBlack>|<backgroundRed>|<backgroundGreen>|<backgroundYellow>|<backgroundBlue>|<backgroundMagenta>|<backgroundCyan>|<backgroundWhite>|<\/background>/;
  const brightBackroundColors =
    /<backgroundGray>|<backgroundBrightRed>|<backgroundBrightGreen>|<backgroundBrightYellow>|<backgroundBrightBlue>|<backgroundBrightMagenta>|<backgroundBrightCyan>|<backgroundBrightWhite>/;
  const regex = new RegExp(
    `(${colors.source}|${brightColors}|${modifiers.source}|${backgroundColors}|${brightBackroundColors})+`,
    'g'
  );
  return data.replace(regex, '');
}
