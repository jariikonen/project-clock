/* eslint-disable import/no-extraneous-dependencies */
import child_process from 'child_process';
import { writeFileSync } from 'fs';

export const DOWN = '\x1B\x5B\x42';
export const UP = '\x1B\x5B\x41';
export const SIGINT = 'SIGINT';
export const SIGINT_VALUES = ['SIGINT', 'sigint', 'kill', '^C', '^c', '\x03'];

function writeToFile(output: string, path: string) {
  if (path) {
    writeFileSync(path, output, { flag: 'a' });
  }
}

function stripAnsi(data: string): string {
  return data.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, // eslint-disable-line no-control-regex
    ''
  );
}

function getPrompt(data: string): string {
  const trimmedData = data.slice(data.indexOf('?'));
  const endIndex = trimmedData.lastIndexOf('?')
    ? trimmedData.lastIndexOf('?')
    : trimmedData.lastIndexOf(':');
  return data.slice(data.indexOf('?') + 2, endIndex);
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
  inputs: string[] | undefined,
  step: number,
  reject: (reason?: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  output: string,
  debugMessage: string,
  debugFilePath: string
) {
  if (inputs?.[step]) {
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
  return step;
}

function writeToEditor(
  dataStr: string,
  inputs: string[] | undefined,
  step: number,
  proc: child_process.ChildProcess,
  reject: (reason?: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  output: string,
  debugFilePath: string
): [editor: boolean, breakHere: boolean, step: number] {
  if (dataStr === 'finished\n') {
    return [false, false, step];
  }
  if (dataStr.includes(`received ${inputs?.[step - 1]}`)) {
    return [true, true, step];
  }
  let stepToUse = step;
  stepToUse = passNextInput(
    proc,
    inputs,
    step,
    reject,
    output,
    `>${inputs?.[step]}< dataStr(${dataStr})\n`,
    debugFilePath
  );
  return [true, true, stepToUse];
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
  timeout = 5000,
  onlyPrompts = false,
  skipPrompts: string[] = [],
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
      const dataStr = stripAnsi(data);

      if (dataStr === 'ready\n') {
        writeToFile(`>IN EDITOR< dataStr(${dataStr})\n`, debugFilePath);
        editor = true;
      }

      // mock editor fails to start
      if (dataStr.includes('Error: Failed launch')) {
        output += '\nError: Inquirer failed to launch the mock editor!';
        proc.kill();
      }

      // in mockEditor
      if (onlyPrompts && editor) {
        output += dataStr;
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
      if (
        onlyPrompts &&
        (!dataStr.match('\\? ') || (!beginning && dataStr.includes(lastPrompt)))
      ) {
        writeToFile(
          `>SKIP IRRELEVANT OUTPUT< dataStr(${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // skip real prompts that are marked to be skipped with skipPrompts argument
      if (skipPrompts.some((prompt) => dataStr.includes(prompt))) {
        lastPrompt = getPrompt(dataStr);
        writeToFile(
          `>SKIP A PROMPT MARKED TO BE SKIPPED< (${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // a new real prompt that is answered with a string from inputs
      writeToFile(`>${dataStr}< lastPrompt(${lastPrompt})\n`, debugFilePath);
      beginning = false;
      lastPrompt = getPrompt(dataStr);
      output += data;
      step = passNextInput(
        proc,
        inputs,
        step,
        reject,
        output,
        `>${inputs?.[step]}<\n`,
        debugFilePath
      );
    });

    proc.on('close', () => {
      writeToFile('>close<\n', debugFilePath);
      resolve(output);
    });
  });
}
