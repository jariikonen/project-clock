import { execSync } from 'child_process';
import { version } from '../../../package.json';

describe('Command is run without any arguments', () => {
  test('Output includes a name string and the current version when run without any arguments', () => {
    let error = '';
    try {
      // by default a commander app that receives no arguments exits with code 1
      // => { stdio: 'pipe' } is used to prevent the stderr to be printed on
      // screen
      execSync('node bin/pclock.js', { stdio: 'pipe' });
    } catch (err) {
      const e = err as Error;
      error = e.message;
    }
    expect(error).toMatch(`pclock (Project Clock) v${version}\n`);
  });
});
