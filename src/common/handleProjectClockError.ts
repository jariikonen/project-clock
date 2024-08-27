import ProjectClockError from './ProjectClockError';

export default function handleProjectClockError(
  error: unknown,
  message: string
) {
  if (error instanceof ProjectClockError) {
    console.error(`${message}:\n  "${error.message}"`);
    process.exit(1);
  }
  throw error;
}
