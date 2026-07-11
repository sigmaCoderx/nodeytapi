#!/usr/bin/env node
import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const venvDir = path.join(rootDir, '.venv');

function run(command, args, cwd = rootDir) {
  return spawnSync(command, args, { stdio: 'pipe', encoding: 'utf8', cwd });
}

function detectPython() {
  const candidates = ['python3', 'python'];

  for (const candidate of candidates) {
    const result = run(candidate, ['--version']);
    if (result.status === 0) {
      return candidate;
    }
  }

  return null;
}

function createVenvAndInstall(pythonCommand) {
  if (!pythonCommand) {
    console.warn('[ytengine] Python 3 was not found on PATH. Install Python 3 first, then reinstall ytengine.');
    return;
  }

  console.log('[ytengine] Creating Python virtual environment...');
  const venvResult = run(pythonCommand, ['-m', 'venv', '.venv']);
  
  if (venvResult.status !== 0) {
    console.warn('[ytengine] Failed to create virtual environment.');
    console.warn(venvResult.stderr || '');
    console.warn('[ytengine] Falling back to global installation...');
    const fallbackResult = run(pythonCommand, ['-m', 'pip', 'install', 'pytubefix>=6.5.0']);
    if (fallbackResult.status === 0) {
      console.log('[ytengine] Installed pytubefix globally.');
    } else {
      console.warn('[ytengine] Failed to install pytubefix globally too.');
    }
    return;
  }

  console.log('[ytengine] Installing pytubefix inside virtual environment...');
  const isWin = os.platform() === 'win32';
  const venvPython = isWin ? path.join(venvDir, 'Scripts', 'python') : path.join(venvDir, 'bin', 'python');

  const pipResult = run(venvPython, ['-m', 'pip', 'install', 'pytubefix>=6.5.0']);
  
  if (pipResult.status === 0) {
    console.log('[ytengine] Installed pytubefix successfully in local .venv.');
  } else {
    console.warn('[ytengine] Failed to install pytubefix in virtual environment.');
    console.warn(pipResult.stderr || '');
  }
}

const pythonCommand = detectPython();
createVenvAndInstall(pythonCommand);
