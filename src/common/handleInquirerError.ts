import { ExitPromptError } from '@inquirer/core';

export default function handleInquirerError(error: unknown) {
  if (!(error instanceof ExitPromptError)) {
    throw error;
  }
  console.log('exiting; user force closed the process');
  process.exit(0);
}
