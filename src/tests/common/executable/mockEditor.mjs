#!/usr/local/bin/node
/**
 * This script works as a mock editor that can be started by the
 * inquirer/editor prompt. Inquirer passes it a path to a temporary file
 * where the content from the editor must be written. In the beginning the
 * file contains the default value given to the inquirer prompt. The editor
 * first reads the file to a variable called `content`. After that it outputs
 * the word 'ready' to `stdout` and waits for input. It then responds to every
 * input with words 'received INPUT' and adds the input to the `content`
 * variable, which is in the end written to the temporary file. If the input
 * is the word 'clear', the `content` variable is cleared from the previous
 * contents.
 *
 * The shebang path above must point to a node binary that supports ESM
 * imports. Make also sure that this file is executable (chmod 755
 * mockEditor.mjs).
 */
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
