import fs from 'node:fs';

export function createTestDir(path: string) {
  fs.mkdirSync(path);
}

export function removeTestDir(path: string) {
  fs.rmSync(path, { recursive: true });
}
