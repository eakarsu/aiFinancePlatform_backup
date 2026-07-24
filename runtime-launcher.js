'use strict';

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const apiPort = Number(process.env.BACKEND_PORT);
const uiPort = Number(process.env.FRONTEND_PORT);
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  env: { ...process.env, PORT: String(apiPort), HOST: '127.0.0.1' },
  stdio: 'inherit',
});

const uiProxy = http.createServer((request, response) => {
  const upstream = http.request({
    hostname: '127.0.0.1', port: apiPort, path: request.url, method: request.method,
    headers: { ...request.headers, host: `127.0.0.1:${apiPort}` },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on('error', (error) => {
    if (!response.headersSent) response.writeHead(502, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'API upstream unavailable', detail: error.code || 'UPSTREAM_ERROR' }));
  });
  request.pipe(upstream);
});
uiProxy.listen(uiPort, '127.0.0.1');

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  uiProxy.close();
  backend.kill(signal);
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(signal));
backend.on('error', (error) => {
  console.error('Unable to start backend', error);
  process.exitCode = 1;
  stop();
});
backend.on('exit', (code, signal) => uiProxy.close(() => process.exit(code ?? (signal ? 1 : 0))));
