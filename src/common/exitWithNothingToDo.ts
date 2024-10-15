import { outputError, outputSuccess } from './outputFormatting';

/**
 * Outputs message 'Nothing to VERB.' where VERB is the verb given as argument,
 * and does a normal exit (exit value 0).
 */
export default function exitWithNothingToDo(verb: string, error = false) {
  if (error) {
    outputError(`Nothing to ${verb}.`);
    process.exit(1);
  }
  outputSuccess(`Nothing to ${verb}.`);
  process.exit(0);
}
