import { outputSuccess } from './outputFormatting';

/**
 * Outputs message 'Nothing to VERB.' where VERB is the verb given as argument,
 * and does a normal exit (exit value 0).
 */
export default function exitWithNothingToDo(verb: string) {
  outputSuccess(`Nothing to ${verb}.`);
  process.exit(0);
}
