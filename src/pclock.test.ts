import { execSync } from 'node:child_process';
import { version } from '../package.json';

test('output includes "pclock version" and the current version when run from the command line with no parameters or options', () => {
  const outputBuffer = execSync('node bin/pclock.js');
  expect(outputBuffer.toString()).toMatch(`pclock version ${version}`);
});
