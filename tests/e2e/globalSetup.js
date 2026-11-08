const { spawn } = require('node:child_process');
const path = require('node:path');

module.exports = async () => {
  const apiDir = path.resolve(process.env.E2E_API_DIR ?? '../api');
  const child = spawn(process.execPath, ['src/scripts/demo-server.js', '--json'], { cwd: apiDir, stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });

  const info = await new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error(`A API de demonstração não subiu em 90 s.\n${errors}`)), 90_000);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      const line = buffer.split('\n').find((l) => l.startsWith('{'));
      if (line) { clearTimeout(timer); resolve(JSON.parse(line)); }
    });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`A API de demonstração encerrou (código ${code}). Rodou "npm install" na pasta da API?\n${errors}`)); });
  });

  // os testes (processos filhos) herdam estas variáveis
  process.env.EXPO_PUBLIC_API_URL = info.url;
  process.env.E2E_DEMO = JSON.stringify(info.demo);
  globalThis.__DEMO_API__ = child;
};
