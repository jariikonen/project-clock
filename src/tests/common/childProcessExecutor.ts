import child_process from 'child_process';

export const DOWN = '\x1B\x5B\x42';
export const UP = '\x1B\x5B\x41';

/**
 * Executes the command using child_process.exec() and returns the stdout
 * output of the process as a string. Passes inputs to the process, one at a
 * time, when the process prompts the user for input.
 * @param command The command to be executed.
 * @param inputs Inputs to the process as an array of strings.
 * @returns Stdout output of the process as a string.
 */
export default async function execute(
  command: string,
  inputs?: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = child_process.exec(command, (error) => {
      if (error) {
        reject(error);
      }
    });

    let output = '';
    let step = 0;

    proc.stdout?.on('data', (data) => {
      output += data;
      if (inputs?.[step]) {
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
