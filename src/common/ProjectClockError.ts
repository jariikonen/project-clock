/**
 * Error class used within the Project Clock application.
 *
 * These errors can usually be handled by the application code, or the message
 * is printed to console.error while the process is exited with error code 1.
 */
export default class ProjectClockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectClockError';
  }
}
