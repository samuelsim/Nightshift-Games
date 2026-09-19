# Deploy on Render

One free Node web service serves the Angular website and Colyseus multiplayer server.
The root `render.yaml` selects Singapore, the free plan, and automatic deploys on commits.

## First deployment

1. Put this project in a GitHub repository, including `pnpm-lock.yaml` and `render.yaml`.
   Keep `node_modules`, build output and local environment files out of Git (see `.gitignore`).
2. Create an account at https://dashboard.render.com/ and choose **New → Blueprint**.
3. Connect the repository, select its main development branch, and deploy the blueprint.
   Confirm the service shows **Free**. Use the generated HTTPS `onrender.com` address.

Render reads the build/start commands and health check from the blueprint. No database,
custom domain, Docker setup or separate frontend service is needed.

## Future updates

Commit and push to the connected branch. Render builds and redeploys automatically.
Redeploy between play sessions: rooms live in memory and disappear on restart.
Personal records stay in each browser. Refresh the app after a deployment; an already
open installed/PWA tab can keep its previous version until it is reopened.

## Free-tier expectations

An idle free service sleeps after 15 minutes; the first visitor can wait about a minute
for it to wake up. Incoming WebSocket messages count as activity. Free usage quotas apply.
Without a payment method on file, Render suspends services if applicable included quotas
are exhausted rather than charging overages.

Official references: [free hosting](https://render.com/docs/free),
[Git-based redeploys](https://render.com/docs/deploy-node-express-app),
[Blueprint settings](https://render.com/docs/blueprint-spec).

## Local production check

Run `pnpm build`, then `pnpm start` with `NODE_ENV=production` and an available `PORT`.
The website and WebSocket endpoint use that same port. Development stays at port 4200
for Angular and 2567 for Colyseus via `pnpm dev`.

Verified locally: production build, root/room/invite HTTP routes, health endpoint,
missing-asset 404, and two browser players creating/joining/starting a multiplayer game.
The production browser bundle no longer points to `ws://localhost:2567`.
Public Render deployment remains pending account/repository connection.
