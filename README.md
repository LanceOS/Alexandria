# Alexandria

A local, self-hosted learning library. This first implementation provides the application home page, library browsing shell, shared UI components, and a small server with SQLite persistence.

The catalog starts with Software, AI, and Mathematics categories and no topics. The server includes local accounts, sessions, per-user settings, and administrator catalog APIs. A small C++ starter path can be installed explicitly: C++ → Basics → Your first C++ program. The unit overview and section-based reader support both themes; learner progress and grading remain future work. Source books stay outside the application.

## Start locally

Use Node.js **24.8 or newer**; the latest Node 24 LTS patch is recommended.

```sh
npm ci
cp .env.example .env
npm run db:init
npm run content:cpp-basics
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

See [Getting started](docs/getting-started.md) for configuration, accounts, and database commands. [Server architecture](docs/server-architecture.md) documents the implemented API and boundaries; [Database schema](docs/database-schema.md) describes the tables and integrity rules. The [self-hosting plan](docs/self-hosting-plan.md) remains the broader roadmap.

For an existing installation, stop the server and run `npm run db:migrate` before restarting. The command creates a verified backup before applying pending migrations.

The starter content is optional and backed by verified C++ references. See [C++ starter content](docs/cpp-basics-content.md) for its sources, installation behavior, and scope.
