import fs from 'node:fs';

/**
 * Creates a test directory at the given path.
 * @param path Test directory path.
 */
export function createTestDir(path: string) {
  fs.mkdirSync(path);
}

/**
 * Removes the test directory at given path recursively.
 * @param path Test directory path.
 */
export function removeTestDir(path: string) {
  fs.rmSync(path, { recursive: true });
}
