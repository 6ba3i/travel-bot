import { concurrently } from 'concurrently';

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

const commands = [
  { command: 'vite', name: 'vite', prefixColor: 'cyan' },
  {
    command: 'nodemon --loader ts-node/esm server.mjs',
    name: 'server',
    prefixColor: 'gray',
    env: {
      TS_NODE_TRANSPILE_ONLY: 'true',
      TS_NODE_PROJECT: 'tsconfig.node.json'
    }
  }
];

const { result } = concurrently(commands, { prefix: 'name' });
result.catch(() => process.exit(1));
