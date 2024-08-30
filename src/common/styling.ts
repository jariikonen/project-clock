import chalk from 'chalk';
import { TaskStatus } from './calculateTimes';

/** Represents a style that can be applied to text displayed in the console. */
export interface Style {
  /** Foreground color of the text. */
  color?: typeof chalk.ForegroundColor;

  /** Modifiers applied to the text. */
  modifiers?: (typeof chalk.Modifiers)[];
}

/**
 * Applies a specific color to the content (see chalk colors
 * {@link https://github.com/chalk/chalk?tab=readme-ov-file#colors}). Returns
 * a string containing the content with ANSI escape codes for setting its color.
 * @param content The text content to which the color is applied.
 * @param color A chalk foreground color.
 */
export function applyColor(
  content: string,
  color?: typeof chalk.ForegroundColor
) {
  if (!color) {
    return content;
  }

  switch (color) {
    case 'black':
      return chalk.black(content);
    case 'red':
      return chalk.red(content);
    case 'green':
      return chalk.green(content);
    case 'yellow':
      return chalk.yellow(content);
    case 'blue':
      return chalk.blue(content);
    case 'magenta':
      return chalk.magenta(content);
    case 'cyan':
      return chalk.cyan(content);
    case 'white':
      return chalk.white(content);
    case 'blackBright':
      return chalk.blackBright(content);
    case 'redBright':
      return chalk.redBright(content);
    case 'greenBright':
      return chalk.greenBright(content);
    case 'yellowBright':
      return chalk.yellowBright(content);
    case 'blueBright':
      return chalk.blueBright(content);
    case 'magentaBright':
      return chalk.magentaBright(content);
    case 'cyanBright':
      return chalk.cyanBright(content);
    case 'whiteBright':
      return chalk.whiteBright(content);
    default:
      throw new Error('switch ran out of options');
  }
}

/**
 * Applies a specific style modifier to the content (see chalk modifiers
 * {@link https://github.com/chalk/chalk?tab=readme-ov-file#modifiers}).
 * Returns a string containing the content with ANSI escape codes for setting
 * its color.
 * @param content The text content to which the modifier is applied.
 * @param color A chalk modifier.
 */
export function applyModifier(
  content?: string,
  modifier?: typeof chalk.Modifiers
) {
  if (!content || !modifier) {
    return content;
  }

  switch (modifier) {
    case 'bold':
      return chalk.bold(content);
    case 'dim':
      return chalk.dim(content);
    case 'hidden':
      return chalk.hidden(content);
    case 'inverse':
      return chalk.inverse(content);
    case 'italic':
      return chalk.italic(content);
    case 'reset':
      return chalk.reset(content);
    case 'strikethrough':
      return chalk.strikethrough(content);
    case 'underline':
      return chalk.underline(content);
    case 'visible':
      return chalk.visible(content);
    default:
      throw new Error('switch ran out of options');
  }
}

/**
 * Applies a style to the content (see Style interface).
 * @param content The text content to which the style is applied.
 * @param color A Style object.
 */
export function applyStyle(content: string, style?: Style) {
  if (!style) {
    return content;
  }
  let styledContent = applyColor(content, style.color);
  style.modifiers?.forEach((modifier) => {
    const styling = applyModifier(styledContent, modifier);
    if (styling) {
      styledContent = styling;
    }
  });

  return styledContent;
}

/**
 * Returns correct color style for a task status.
 * @param status The requested status.
 * @returns A Style object (see Style interface).
 */
export function styleTaskStatus(status: TaskStatus): Style {
  switch (status) {
    case TaskStatus.Completed:
      return { color: 'green' };
    case TaskStatus.Resumed:
      return { color: 'red' };
    case TaskStatus.Started:
      return { color: 'red' };
    case TaskStatus.Suspended:
      return { color: 'yellow' };
    case TaskStatus.Unstarted:
      return { color: 'blue' };
    default:
      throw new Error('switch ran out of options');
  }
}
