/* eslint-disable import/no-extraneous-dependencies */
import child_process from 'child_process';
import { writeFileSync } from 'fs';

export const DOWN = '\x1B\x5B\x42';
export const UP = '\x1B\x5B\x41';

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

function writeToEditor(
  dataStr: string,
  inputs: string[] | undefined,
  step: number,
  proc: child_process.ChildProcess,
  reject: (reason?: any) => void, // eslint-disable-line @typescript-eslint/no-explicit-any
  debugFilePath: string
): [editor: boolean, breakHere: boolean, step: number] {
  if (dataStr === 'finished\n') {
    return [false, false, step];
  }
  if (dataStr.includes(`received ${inputs?.[step - 1]}`)) {
    return [true, true, step];
  }
  if (inputs?.[step]) {
    writeToFile(`>${inputs[step]}< dataStr(${dataStr})\n`, debugFilePath);
    proc.stdin?.write(inputs[step], (error) => {
      if (error) {
        reject(error);
      }
    });
    return [true, true, step + 1];
  }
  return [true, true, step];
}

/**
 * Executes the command using child_process.exec() and returns the stdout
 * output of the process as a string. Passes inputs to the process, one at a
 * time, when the process prompts the user for input.
 * @param command The command to be executed.
 * @param inputs Inputs to the process as an array of strings.
 * @param env Environment key-value pairs. Default process.env.
 * @param timeout Timeout in milliseconds. Execution is terminated after given
 *    time. Default 5000.
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
    const proc = child_process.exec(command, { env, timeout }, (error) => {
      if (error) {
        reject(error);
      }
    });

    let output = '';
    let step = 0;
    let lastPrompt = '';
    let beginning = true;
    let editor = false;
    let breakHere = false;

    proc.stdout?.on('data', (data: string) => {
      const dataStr = stripAnsi(data);

      if (dataStr === 'ready\n') {
        writeToFile(`editor = true dataStr(${dataStr})\n`, debugFilePath);
        editor = true;
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
          `>RETURN1< dataStr(${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // skip real prompts that are marked to be skipped with skipPrompts argument
      if (skipPrompts.some((prompt) => dataStr.includes(prompt))) {
        lastPrompt = getPrompt(dataStr);
        writeToFile(
          `>RETURN2< (${dataStr}) lastPrompt(${lastPrompt})\n`,
          debugFilePath
        );
        return;
      }

      // a new real prompt that is answered with a string from inputs
      writeToFile(`>${dataStr}< lastPrompt(${lastPrompt})\n`, debugFilePath);
      beginning = false;
      lastPrompt = getPrompt(dataStr);
      output += data;
      if (inputs?.[step]) {
        writeToFile(`>${inputs[step]}<\n`, debugFilePath);
        proc.stdin?.write(inputs[step], (error) => {
          if (error) {
            reject(error);
          }
        });
        step += 1;
      }
    });

    proc.on('close', () => {
      resolve(output);
    });
  });
}
