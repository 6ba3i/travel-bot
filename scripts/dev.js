import { spawn } from 'child_process';
import { platform } from 'os';

// Remove proxy environment variables that can cause issues
const proxyVars = [
  'http_proxy',
  'https_proxy',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'npm_config_http_proxy',
  'npm_config_https_proxy'
];

let cleaned = false;
for (const v of proxyVars) {
  if (process.env[v]) {
    delete process.env[v];
    cleaned = true;
  }
}

if (cleaned) {
  console.log('[dev] Removed HTTP proxy environment variables to avoid connection errors.');
}

// Use concurrently to run both server and client
const isWindows = platform() === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting TravelBot Development Server...\n');

// Run both server and client
const proc = spawn(npm, ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

proc.on('error', (err) => {
  console.error('Failed to start development server:', err);
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});