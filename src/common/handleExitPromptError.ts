import { ExitPromptError } from '@inquirer/core';
import { outputSuccess } from './outputFormatting';

/**
 * Handles the ExitPromptError from inquirer by displaying a message telling
 * that the user force closed the process and by doing a normal exit (without
 * error code).
 * @param error
 * @throws All other exceptions but the @inquirer/core.ExitPromptError.
 */
export default function handleExitPrompError(error: unknown) {
  if (!(error instanceof ExitPromptError)) {
    throw error;
  }
  outputSuccess('Exiting; user force closed the process.');
  process.exit(0);
}
