/* eslint-disable import/no-extraneous-dependencies */
import child_process from 'child_process';
import { writeFileSync } from 'fs';
import prettyAnsi from 'pretty-ansi';
import {
  stripPrettifiedColorAndModifiers,
  visibleNewline,
} from './ansiCharacters';

export const DOWN = '\x1B\x5B\x42';
export const UP = '\x1B\x5B\x41';
export const SHIFT_AND_DOWN = '\x1B[1;2B';
export const SHIFT_AND_UP = '\x1B[1;2A';
export const SPACE = '\x20';
export const SIGINT = 'SIGINT';
export const SIGINT_VALUES = ['SIGINT', 'sigint', 'kill', '^C', '^c', '\x03'];

function writeToFile(output: string, path: string) {
  if (path) {
    writeFileSync(path, output, { flag: 'a' });
  }
}

function errorHandler(
  error: Error | null | undefined,
  output: string,
  reject: (reason?: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  if (error) {
    reject(new Error(`${error.message}\nCOMMAND OUTPUT:\n${output}`));
  }
}

function passNextInput(
  proc: child_process.ChildProcess,
  inputs: string[],
  step: number,
  reject: (reason?: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  output: string,
  debugMessage: string,
  debugFilePath: string
) {
  writeToFile(debugMessage, debugFilePath);
  // Process can be stopped using any of the values in SIGINT_VALUES as an
  // input. This does not result in a graceful exit, but instead returns
  // an error code, which must be noted when handling the result.
  if (SIGINT_VALUES.includes(inputs[step])) {
    writeToFile('>SIGINT: proc.kill()<\n', debugFilePath);
    proc.kill();
  } else {
    proc.stdin?.write(inputs[step], (error) =>
      errorHandler(error, output, reject)
    );
  }
  return step + 1;
}

function writeToEditor(
  dataStr: string,
  inputs: string[],
  step: number,
  proc: child_process.ChildProcess,
  reject: (reason?: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  output: string,
  debugFilePath: string
): [editor: boolean, breakHere: boolean, step: number] {
  if (dataStr === 'finished<newline>') {
    return [false, false, step];
  }
  if (dataStr.includes(`received ${inputs?.[step - 1]}`)) {
    return [true, true, step];
  }
  let stepToUse = step;
  if (inputs?.[step]) {
    stepToUse = passNextInput(
      proc,
      inputs,
      step,
      reject,
      output,
      `>INPUT: ${visibleNewline(inputs?.[step])}< dataStr(${dataStr})\n`,
      debugFilePath
    );
  }
  return [true, true, stepToUse];
}

function parseNewPrompt(dataStr: string, lastPrompt: string) {
  const cleanedDataStr = stripPrettifiedColorAndModifiers(dataStr);
  const possiblePrompts = cleanedDataStr.match(
    /\?(\s[A-Za-z0-9();,'"-]+)+(\?|:)/g
  );
  const possibleNewPrompts = lastPrompt
    ? possiblePrompts?.filter((prompt) => !prompt.includes(lastPrompt))
    : possiblePrompts;
  return possibleNewPrompts ? possibleNewPrompts?.[0]?.slice(2, -1) : '';
}

/**
 * Executes the command using child_process.exec() and returns the stdout
 * output of the process as a string. Passes inputs to the process, one at a
 * time, when the process prompts the user for input.
 *
 * Process can be stopped using any of the values in SIGINT_VALUES as an input.
 * This does not result in a graceful exit, but instead returns an error code,
 * which must be noted when handling the result (the command output can be
 * found from the error text).
 * @param command The command to be executed.
 * @param inputs Inputs to the process as an array of strings.
 * @param env Environment key-value pairs. Default process.env.
 * @param timeout Timeout in milliseconds. Execution is terminated after given
 *    time. Default 5000.
 * @param onlyPrompts Boolean to indicate whether the inputs are passed only
 *    when the output is identified as a distinct proper prompt. Prompts are
 *    identified based on an assumption that they start with a question mark
 *    and end in a question mark or a colon. For example Inquirer prompts can
 *    output special characters that modify the previously outputted text.
 *    These are skipped if this parameter is set to true.
 * @param skipPrompts Some prompts can be set to be skipped using this
 *    parameter. E.g. `@ignore/editor` outputs
 * @param debugFilePath Some debugging information can be printed to a file by
 *    passing a path to the file using this parameter.
 * @returns Stdout output of the process as a string.
 */
export default async function execute(
  command: string,
  inputs?: string[],
  env = process.env,
  onlyPrompts = false,
  skipPrompts: string[] = [],
  timeout = 5000,
  debugFilePath = ''
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';

    const proc = child_process.exec(command, { env, timeout }, (error) =>
      errorHandler(error, output, reject)
    );

    let step = 0;
    let lastPrompt = '';
    let beginning = true;
    let editor = false;
    let breakHere = false;

    proc.stdout?.on('data', (data: string) => {
      const dataStr = visibleNewline(prettyAnsi(data));
      output += data;

      if (data === 'ready\n') {
        writeToFile(`>IN EDITOR< dataStr(${dataStr})\n`, debugFilePath);
        editor = true;
      }

      // mock editor fails to start
      if (dataStr.includes('Error: Failed launch')) {
        output += '\nError: Inquirer failed to launch the mock editor!';
        proc.kill();
      }

      // in mockEditor
      if (onlyPrompts && editor && inputs) {
        [editor, breakHere, step] = writeToEditor(
          dataStr,
          inputs,
          step,
          proc,
          reject,
          output,
          debugFilePath
        );
        if (breakHere) {
          return;
        }
      }

      // skip irrelevant outputs
      const newPrompt = parseNewPrompt(dataStr, lastPrompt);
      if (
        onlyPrompts &&
        (!newPrompt || (!beginning && dataStr.includes(lastPrompt)))
      ) {
        writeToFile(
          `>SKIP IRRELEVANT OUTPUT< dataStr(${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // skip real prompts that are marked to be skipped with skipPrompts argument
      if (skipPrompts.some((prompt) => dataStr.includes(prompt))) {
        lastPrompt = parseNewPrompt(dataStr, lastPrompt);
        writeToFile(
          `>SKIP A PROMPT MARKED TO BE SKIPPED< (${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // a new real prompt that is answered with a string from inputs
      writeToFile(
        `>NEW PROMPT: ${newPrompt}< lastPrompt(${lastPrompt}) fullDataStr(${dataStr})\n`,
        debugFilePath
      );
      beginning = false;
      lastPrompt = newPrompt;
      if (inputs?.[step]) {
        step = passNextInput(
          proc,
          inputs,
          step,
          reject,
          output,
          `>INPUT: ${visibleNewline(inputs?.[step])}<\n`,
          debugFilePath
        );
      }
    });

    proc.on('close', () => {
      writeToFile('>close<\n', debugFilePath);
      resolve(output);
    });
  });
}
