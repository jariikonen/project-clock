import confirm from '@inquirer/confirm';

/**
 * Asks confirmation from the user using @inquirer/confirm.
 * @param message The message shown to the user.
 */
export default async function promptToConfirm(
  message: string
): Promise<boolean> {
  const answer = await confirm({
    message,
  });
  return answer;
}
