This is a Next.js pottery tracker for following pieces through studio stages.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

`npm run dev` only binds to your local machine. Use `npm run dev:lan` when you intentionally want to test from a phone on the same network.

## Shared Storage

The app now reads and writes through Next API routes. In development, if Azure settings are not present, records are stored in `.data/pottery-store.json`.

Before hosting it publicly, set these server-only environment variables in the deployed app:

```bash
POTTERY_APP_PASSWORD=<a password only you two know>
POTTERY_AUTH_SECRET=<a long random secret>
```

Generate `POTTERY_AUTH_SECRET` with something like `openssl rand -base64 32`. Do not prefix these or the Azure variables with `NEXT_PUBLIC_`; that would expose them to the browser. In production, the app locks itself if the password settings are missing. In local development, auth is optional unless those password variables are set.

To sync the same records between phone and desktop, create an Azure Cosmos DB for NoSQL account and add these server-only variables:

```bash
AZURE_COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/
AZURE_COSMOS_KEY=<primary-or-secondary-key>
AZURE_COSMOS_DATABASE_ID=pottery-tracker
AZURE_COSMOS_CONTAINER_ID=pots
```

Use a manual throughput container at 400 RU/s to stay under the Cosmos DB free-tier allowance for this app's expected scale. The first time an existing browser opens the updated app, old IndexedDB records are copied into the shared API store if matching pot IDs are not already there.

Photos are resized in the browser before upload so a single photo document stays comfortably below the Cosmos DB item limit. The app also stores a small `thumbnailDataUrl` on each pot document so category pages do not need to read full photo documents.

For existing Cosmos records, generate missing thumbnails from the latest photo with a dry run first:

```bash
npm run backfill:thumbnails
npm run backfill:thumbnails -- --write
```

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
