# Alexandria

A local, self-hosted learning library. This first implementation provides the application home page, library browsing shell, shared UI components, and a small server with SQLite persistence.

The catalog starts with Software, AI, and Mathematics categories and no topics. Units, modules, accounts, learning progress, and content authoring are deferred. Source books stay outside the application.

## Start locally

Use Node.js **24.8 or newer**; the latest Node 24 LTS patch is recommended.

```sh
npm ci
cp .env.example .env
npm run db:init
npm run dev
```

Open [Alexandria](http://localhost:5173). The development server proxies API requests to the local server on port 3000. Database creation is explicit: normal startup never creates a replacement for a missing database.

```sh
npm run typecheck
npm test
npm run build
NODE_ENV=production npm start
```

The production server serves the frontend and API together at [localhost:3000](http://localhost:3000).

## Project layout

| Directory | Purpose |
| --- | --- |
| `client/` | Main application pages |
| `library/` | Reusable UI components and design tokens |
| `shared/` | Frontend and server contracts |
| `server/` | API, SQLite database, migrations, and maintenance commands |
| `deploy/` | Optional direct-service deployment example |
| `docs/` | Setup instructions and architecture plans |
| `notes/` | Future product and data-model design |

See [Getting started](docs/getting-started.md) for configuration and database commands. [The self-hosting plan](docs/self-hosting-plan.md) describes the broader roadmap; later phases are not implemented by this scaffold.
