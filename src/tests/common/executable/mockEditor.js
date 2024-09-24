/**
 * The mockEditor.exe single executable application (SEA) used in Windows tests
 * is built from this file according to these instructions:
 * https://nodejs.org/api/single-executable-applications.html. The powershell
 * script buildMockEditor.ps1 can be used for building the .exe file.
 */
const fs = require('node:fs');

const tempFilePath = process.argv[2];

let content = '';

if (tempFilePath) {
  content = fs.readFileSync(tempFilePath, { encoding: 'utf8' });
}

console.log('ready');

process.stdin.setEncoding('utf8').on('readable', () => {
  let chunk = '';
  while (chunk !== null) {
    chunk = process.stdin.read();
    if (chunk === 'clear') {
      content = '';
      console.log(`received clear; cleared content`);
    } else if (chunk !== null) {
      console.log(`received ${chunk}`);
      content += chunk;
    }
  }
  fs.writeFileSync(tempFilePath, content, { encoding: 'utf8' });
  console.log('finished');
  process.exit(0);
});
