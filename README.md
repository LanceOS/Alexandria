# Alexandria

A local, self-hosted learning library. This first implementation provides the application home page, library browsing shell, shared UI components, and a small server with SQLite persistence.

The catalog starts with Software, AI, and Mathematics categories and no topics. The server includes local accounts, sessions, per-user settings, and administrator catalog APIs. An optional C++ → Basics path contains six short modules, from a first program through variables, expressions, decisions, loops, and functions. The unit overview and section-based reader support both themes, next-module navigation, and further-reading links; learner progress and grading remain future work. Source books stay outside the application.

## Start locally

Use Node.js **24.8 or newer**; the latest Node 24 LTS patch is recommended.

```sh
npm ci
cp .env.example .env
npm run db:init
npm run content:check
npm run content:import -- cpp
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
| `client/src/` | Application composition, shared client code, and feature modules |
| `client/src/modules/` | Library browsing and curriculum features, each with its own implementation and tests |
| `client/src/components/ui/` | Reusable UI components; design tokens live in `client/src/styles/` |
| `client/public/` | Public assets and the initial theme bootstrap |
| `shared/` | Frontend and server contracts |
| `server/` | API, SQLite database, migrations, and maintenance commands |
| `content/` | Curriculum JSON, validation schemas, and authoring instructions |
| `deploy/` | Optional direct-service deployment example |
| `docs/` | Setup instructions and architecture plans |
| `notes/` | Future product and data-model design |

See [Getting started](docs/getting-started.md) for configuration, accounts, and database commands. [Client architecture](docs/client-architecture.md) explains the feature boundaries and shared client code. [Server architecture](docs/server-architecture.md) documents the implemented API and boundaries; [Database schema](docs/database-schema.md) describes the tables and integrity rules. The [self-hosting plan](docs/self-hosting-plan.md) remains the broader roadmap.

`npm test` discovers client and server tests recursively. Use `npm run test:client` or `npm run test:server` for a focused run. Vite still uses `client/` as its root, with `client/src/main.tsx` as the React entry and `dist/client/` as the production output.

For an existing installation, stop the server and run `npm run db:migrate` before restarting. The command creates a verified backup before applying pending migrations.

The lesson content is optional and backed by verified C++ references. See [C++ Basics content](docs/cpp-basics-content.md) for its sources and scope. Add curriculum through unit folders and one JSON file per module; [Content authoring](content/README.md) explains the format and import workflow. `content:check` validates files without opening the database. `content:import -- cpp` adds matching C++ content transactionally after a verified backup; existing published lessons remain unchanged. The original `content:cpp-basics` command remains an alias for importing C++.

The build validates curriculum and copies it to `dist/content/` for operator commands. The browser receives published lessons through the API; curriculum files are not bundled into the frontend.
