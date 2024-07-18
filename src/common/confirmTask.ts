import confirm from '@inquirer/confirm';

export default async function confirmTask(message: string): Promise<boolean> {
  const answer = await confirm({
    message,
  });
  return answer;
}
