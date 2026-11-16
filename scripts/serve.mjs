import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { root } from './sync-content.mjs';

export async function startServer(port = 4321) {
  const base = resolve(root, 'dist');
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = resolve(base, `.${pathname}`);
      if (file !== base && !file.startsWith(base + sep)) throw new Error('Invalid path');
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(resolve(base, '404.html')).catch(() => Buffer.from('Not found')));
    }
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  return server;
}

if (process.argv[1]?.endsWith('serve.mjs')) {
  const server = await startServer(Number(process.env.PORT || 4321));
  console.log(`Local: http://127.0.0.1:${server.address().port}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
