#!/usr/bin/env node

import { execSync } from 'node:child_process';

const op = execSync('echo JOO');
console.log(op.toString());
throw new Error('uusi testi');
