#!/usr/local/bin/node
// The shebang path above must point to a recent enough node binary.
// Script seems to work at least in version 20.11.0.

import fs from 'node:fs';

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
