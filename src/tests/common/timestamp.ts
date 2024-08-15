/** Checks if the provided timestamp is valid or not. */
export default function isValidTimestamp(timestamp: string): boolean {
  return new Date(timestamp).toISOString() === timestamp;
}
