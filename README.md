# Alexandria

A local, self-hosted learning library. This first implementation provides the application home page, library browsing shell, shared UI components, and a small server with SQLite persistence.

The catalog starts with Software, AI, and Mathematics categories and no topics. The server includes local accounts, sessions, per-user settings, and administrator catalog APIs. The optional curriculum contains C++ core and advanced units, supporting computing subjects, and application tracks, all using the established three-section lesson format. All 89 modules provide detailed explanations, worked and contrasting examples, and practice with explained answers under the standing [curriculum depth standard](notes/curriculum-depth.md). The original seven C++ Basics lessons retain their identities and published history. The unit overview and section-based reader support both themes, next-module navigation, and further-reading links; signed-in learners can save section completion, earn reading XP, set a weekly goal, and collect activity milestones. C++ Basics also includes optional self-check quests and a final challenge. See [Learning progress and quests](docs/learning-progress.md) for the rules and upgrade steps. Source books stay outside the application.

## Start locally

Use Node.js **24.8 or newer**; the latest Node 24 LTS patch is recommended.

```sh
npm ci
cp .env.example .env
npm run db:init
npm run content:check
npm run content:import -- --all
npm run dev
```

Open [Alexandria](http://localhost:5173). The development server proxies API requests to the local server on port 3000. Database creation is explicit: normal startup never creates a replacement for a missing database.

C++ examples include an **Edit and run** area with editable source, program input, output, and compiler diagnostics. To enable execution on a Linux host with rootless Podman and cgroups v2, run `npm run runner:setup` and `npm run runner:check` as the account that runs Alexandria. The compiler image is downloaded during setup; learner code runs locally. See [Code area and runner](docs/code-runner.md) for requirements and limits.

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

The lesson content is optional. See the [curriculum map](docs/curriculum-map.md) for the subject boundaries and lessons, the [evidence policy](docs/curriculum-evidence.md) for documentation and research standards, and [C++ Basics content](docs/cpp-basics-content.md) for the original sources. Add curriculum through unit folders and one JSON file per module; [Content authoring](content/README.md) explains the format and import workflow. `content:check` validates files and cross-topic identities without opening the database. `content:import -- --all` imports the complete catalog after one verified backup, rolling back all additions if any topic fails. Use `content:import -- cpp` for C++ alone. Reviewed corrections publish new lesson versions while retaining previous releases and learner history; the original `content:cpp-basics` command remains an alias for importing C++.

Authors can run `npm run content:test-examples` to compile and execute reviewed C++ examples with GCC (or the compiler executable selected by `CXX`) and compare their documented output. This requires a C++20 compiler and is separate from the server, importer, and ordinary application tests.

The build validates curriculum and copies it to `dist/content/` for operator commands. The browser receives published lessons through the API; curriculum files are not bundled into the frontend.
