import express, { type Application } from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/** One public origin serves the website and the multiplayer connection. */
export function serveWebsite(app: Application): void {
  const directory = fileURLToPath(new URL('../../web/dist/web/browser/', import.meta.url));
  const index = join(directory, 'index.html');
  if (!existsSync(index)) throw new Error('Website build missing. Run pnpm build before pnpm start.');

  app.use(express.static(directory, { setHeaders(response) {
    response.setHeader('Cache-Control', 'no-cache');
  } }));
  // Only browser routes receive HTML; missing assets and API routes stay 404s.
  app.get(['/', '/room/:code', '/join/:code'], (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache');
    response.sendFile(index);
  });
}

