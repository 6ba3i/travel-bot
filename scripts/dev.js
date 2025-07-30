import { spawn } from 'child_process';

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

spawn('npx', ['concurrently',
  '"vite"',
  '"TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT=tsconfig.node.json nodemon --loader ts-node/esm server.mjs"'
], { stdio: 'inherit', shell: true });
