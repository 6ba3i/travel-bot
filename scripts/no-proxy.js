import { spawn } from 'child_process';

const proxyVars = [
  'http_proxy',
  'https_proxy',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'npm_config_http_proxy',
  'npm_config_https_proxy'
];

for (const v of proxyVars) {
  delete process.env[v];
}

spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

