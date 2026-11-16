// Cross-platform build script for C++ cascade engine (Phase 4C)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const buildDir = path.join(root, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Ensure third_party/json.hpp exists
const tpDir = path.join(root, 'third_party');
if (!fs.existsSync(tpDir)) {
  fs.mkdirSync(tpDir, { recursive: true });
}
const tpJson = path.join(tpDir, 'json.hpp');
const rootJson = path.join(root, 'json.hpp');
if (!fs.existsSync(tpJson) && fs.existsSync(rootJson)) {
  fs.copyFileSync(rootJson, tpJson);
}

const isWin = process.platform === 'win32';
const target = isWin ? path.join(buildDir, 'cascade_cli.exe') : path.join(buildDir, 'cascade_cli');
const cliSrc = path.join(root, 'cli.cpp');

// Determine compiler
let compiler = 'g++';
if (isWin) {
  if (fs.existsSync('C:\\MinGW\\bin\\g++.exe')) {
    compiler = 'C:\\MinGW\\bin\\g++.exe';
  }
}

console.log(`Compiling C++ Cascade CLI using ${compiler}...`);
const args = ['-std=c++1z', '-O2', cliSrc, '-o', target];
const res = spawnSync(compiler, args, { stdio: 'inherit', cwd: root });

if (res.status === 0 && fs.existsSync(target)) {
  console.log(`Successfully built C++ Cascade CLI at: ${target}`);
  process.exit(0);
} else {
  console.error(`Failed to build C++ Cascade CLI (exit code ${res.status})`);
  process.exit(res.status || 1);
}

