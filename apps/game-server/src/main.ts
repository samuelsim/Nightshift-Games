import cors from 'cors';
import express from 'express';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { NightshiftRoom } from './rooms/nightshift-room';
import { serveWebsite } from './website';

const port = Number(process.env['PORT'] ?? 2567);

const gameServer = new Server({
  transport: new WebSocketTransport(),
  express: (app) => {
    app.use(cors());
    app.use(express.json());
    app.get('/health', (_request, response) => {
      response.json({ ok: true, service: 'nightshift-game-server' });
    });
    if (process.env['NODE_ENV'] === 'production') serveWebsite(app);
  }
});

gameServer.define('nightshift_room', NightshiftRoom);

await gameServer.listen(port, '0.0.0.0');
console.log(`Nightshift game server listening on http://localhost:${port}`);
