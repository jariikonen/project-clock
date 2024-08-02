import { ExitPromptError } from '@inquirer/core';

/**
 * Handles the ExitPromptError from inquirer by displaying message telling that
 * user force closed the process and doing a normal exit (without error code).
 * @param error
 * @throws All other exceptions but the @inquirer/core.ExitPromptError.
 */
export default function handleExitPrompError(error: unknown) {
  if (!(error instanceof ExitPromptError)) {
    throw error;
  }
  console.log('exiting; user force closed the process');
  process.exit(0);
}
