# Getting started

Alexandria's first implementation is a local application shell: a main page, library browsing, reusable UI components, and a server backed by SQLite. Initialization creates Software, AI, and Mathematics categories; the topic catalog is empty. The server also provides local authentication, per-user settings, and administrator catalog APIs. The optional curriculum includes C++ core and advanced units, supporting subjects, and application tracks using the same overview and three-section reader. The account menu supports sign-in and saved reading progress, weekly goals, XP, and activity milestones. C++ Basics includes optional self-check challenges. Uploads and assessment graders remain future work. See [Learning progress and quests](learning-progress.md).

## Requirements and rationale

Install Node.js **24.8 or newer**, preferably the latest Node 24 LTS patch, with npm. The client uses React 19, TypeScript, Vite, and Anime.js. Fastify serves the API and built frontend from one process in production.

The server uses Node's built-in `node:sqlite`, including prepared statements and its backup API, so no separate database service or native npm driver is required. See the [Node 24.8 SQLite documentation](https://nodejs.org/download/release/v24.8.0/docs/api/sqlite.html). This project sets a higher Node minimum than Vite itself; see [Vite's runtime requirements](https://vite.dev/guide/). Some Node versions print an experimental SQLite warning when starting the server or commands.

Use a local filesystem for SQLite and run one application instance per data directory. Building or installing dependencies can require internet access; the prepared application serves its assets locally and has no required cloud service.

## Development

Run these commands from the checkout using a POSIX shell:

```sh
npm ci
cp .env.example .env
npm run db:init
npm run content:check
npm run content:import -- cpp
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite serves the client and proxies API requests to the backend on port 3000. Use `Ctrl+C` to stop development.

`db:init` creates a fresh database and applies the current schema. It refuses to replace an existing database. On later starts, run only `npm run dev`; use `npm run db:migrate` when upgrading a database to a new schema.

Client code lives under `client/src/`. Shared layout, UI, hooks, utilities, and application pages sit beside the `modules/library/` and `modules/curriculum/` features. Each feature keeps its own pages, components, hooks, utilities, types, styles, and tests together. See [Client architecture](client-architecture.md) for the import boundaries and where to add new behavior.

Vite still uses `client/` as its root. `client/index.html` loads `client/src/main.tsx`; `client/public/theme.js` applies the initial color theme before React starts. The reusable UI formerly in the root `library/` directory now lives in `client/src/components/ui/`.

## Tests

```sh
npm test
npm run test:client
npm run test:server
```

`npm test` runs both scopes. The focused commands select just client or server tests. The shared runner discovers `.test.ts` and `.test.tsx` files recursively, including tests inside feature folders, and uses Node's test runner with the existing TypeScript runtime. There is no separate test dependency to install.

Client tests cover navigation, feature data and reader behavior, rendered component output, and import boundaries. They do not replace browser checks for responsive layouts, keyboard focus, native dialogs, and theme appearance. Run `npm run typecheck` for TypeScript checks and `npm run build` to verify the production build.

## Configuration

The development and database commands read `.env` from the working directory. `npm start` loads it through Node's `--env-file-if-exists` option. Shell environment variables take precedence. `.env` is local configuration and is excluded from Git.

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | API and production listener |
| `PORT` | `3000` | API and production port |
| `APP_ORIGIN` | Unset | Optional canonical HTTP(S) browser origin; no credentials, path, query, or fragment |
| `DATA_DIR` | `$HOME/.local/share/alexandria` | Persistent application data directory |
| `DATABASE_PATH` | `<DATA_DIR>/database/alexandria.sqlite` | Database file inside the data directory |
| `BACKUP_DIR` | Sibling `<DATA_DIR name>-backups` | Snapshot destination; normally `$HOME/.local/share/alexandria-backups` |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent` |
| `NODE_ENV` | Unset | Set to `production` for the compiled server |

Configured storage paths must be absolute. `$HOME` above describes the default; `.env` does not expand shell variables or `~`. Data and backup directories must be outside the checkout and separate from each other, with neither containing the other. Database paths must remain inside the data directory, including when resolving symbolic links.

The account running Alexandria needs access to its data directory and write access for initialization, migrations, backups, and SQLite sidecar files. Keep the default loopback listener for local development. For a reverse proxy, terminate HTTPS at the proxy and set APP_ORIGIN to the exact public HTTPS origin; this enables Secure session cookies. The proxy must preserve the expected host and must not expose the backend directly. Forwarded client IP headers are not trusted, so sign-in IP limits apply to the proxy address. The example environment leaves optional paths commented out so local setup works without creating system directories.

No source-book directory is configured or accessed. The runtime and backup command need only Alexandria's application database.

## Build and run

```sh
npm run typecheck
npm test
npm run build
NODE_ENV=production npm start
```

Open [localhost:3000](http://localhost:3000). The build validates curriculum JSON, emits the frontend in `dist/client/` and compiled server/shared code in `dist/server/` and `dist/shared/`, then copies the content directory to `dist/content/`. Curriculum files are used by operator commands and are not bundled into the frontend. `npm start` runs the compiled server; it does not build, initialize storage, or import curriculum.

Check the running server with:

```sh
curl --fail http://127.0.0.1:3000/health/live
curl --fail http://127.0.0.1:3000/health/ready
curl --fail http://127.0.0.1:3000/api/library
```

Liveness reports that the HTTP process is running. Readiness checks database access and migration history. The library endpoint provides the seeded categories and any published topics; installing the C++ starter adds one topic. Missing databases or incompatible migration history fail startup with a maintenance instruction.

The [optional systemd example](../deploy/README.md) runs the compiled server under a dedicated Linux service account. A service installation is not needed for local development.

## Database maintenance

| Command | Behavior |
| --- | --- |
| `npm run db:init` | Creates a new database, applies migrations, and seeds the three categories |
| `npm run db:migrate` | Checks an existing database, backs it up before pending migrations, then applies them; does nothing when already current |
| `npm run content:check` | Validates every curriculum root without opening the database; add `-- cpp` to check only C++ |
| `npm run content:import -- cpp` | Backs up the database and imports the `content/units/cpp/` hierarchy; adds new content, preserves matching records, and refuses conflicts |
| `npm run content:import -- --all` | Imports every topic after one backup; any failure rolls back all topic additions |
| `npm run content:test-examples` | Authoring check: compiles reviewed C++20 examples and compares their expected output; requires a C++ compiler |
| `npm run content:cpp-basics` | Compatibility alias for importing the C++ hierarchy |
| `npm run db:backup` | Creates a verified SQLite snapshot and a JSON checksum manifest in `BACKUP_DIR` |
| `npm run account:create -- --username lanceos` | Creates a local administrator using a hidden password prompt |
| `npm run account:password -- --username lanceos` | Resets a password and revokes all sessions for that user |

Commands report their result in structured logs. A maintenance lock prevents overlapping local maintenance commands. If an interrupted command leaves `.maintenance.lock` in the data directory, confirm no maintenance process is running before removing that stale file.

The snapshot uses SQLite's backup API; do not copy the live database file as a substitute while WAL sidecar files may hold changes. Backups include only the application database and its manifest. They do not collect configuration, source books, or arbitrary files. Automatic retention, a restore command, and full release recovery workflows are deferred. Keep another copy of successful snapshots on separate storage if you need protection from disk loss.

For an upgrade, stop the application, run `db:backup`, retain the current release, install/build the new release, run `db:migrate`, and restart. For a prepared release without development dependencies, invoke `dist/server/commands/init.js`, `migrate.js`, or `backup.js` directly with Node and the same environment used by the server.

The [self-hosting plan](self-hosting-plan.md) covers the broader architecture and future operational work. The implemented boundaries are documented in [Server architecture](server-architecture.md) and [Database schema](database-schema.md). File storage, curriculum authoring APIs, assessed exercise workers, and automated recovery remain future work. Optional local C++20 execution has a separate [runner setup](code-runner.md).


## Local accounts

After initialization or migration, create your own administrator account:

```sh
npm run account:create -- --username lanceos --display-name LanceOS
```

The command asks for a password and confirmation without echoing it. Passwords require 12–256 characters, at most 1,024 UTF-8 bytes. Usernames are case-insensitive ASCII names of 3–40 characters. To create a regular learner account, add `--role member`. Account creation is an operator command, with no public registration endpoint. No default account or password is installed.

Use `npm run account:password -- --username lanceos` to reset a password; this invalidates all existing sessions for that account. Automation can use `--password-stdin` with a single password line from a protected input source. Never pass a password as a command-line argument. For a prepared production release, use `dist/server/commands/account-create.js` or `account-password.js` with Node and the same environment as the service.

Use **Sign in** in the application to save reading progress and run C++ examples. The library still uses its existing local theme preference; account-synced UI settings have not been added.


## C++ Basics path

On an initialized, current database, validate the files with `npm run content:check`, stop the server, and run `npm run content:import -- --all`, then restart it. For C++ alone, use `npm run content:import -- cpp`. Open the library and choose C++, then open **Your first C++ program** under **C++ → Basics**. C++ contains the seven preserved Basics lessons plus core and advanced subunits; the other subjects follow the same layout. See the [curriculum map](curriculum-map.md) for the complete hierarchy and the [evidence policy](curriculum-evidence.md) for the source and example checks. Reimporting matching content leaves it untouched; conflicts stop the operation instead of overwriting authored material. Import creates a verified backup before installation.

The reader provides section and next-module navigation, copyable code examples, ungraded reflection prompts, and module-specific further reading. Reading links are always visible at the bottom of each module's final section and expandable in earlier sections. Section position is represented in the URL, so direct links, reloads, and browser history work. Signed-in learners can mark sections read, earn reading XP, and set a weekly goal. C++ examples include an **Edit and run** code area; execution requires the optional [local runner](code-runner.md). See [content provenance](cpp-basics-content.md) for the documentation and book references.

Add curriculum with a unit folder, its `unit.json`, and one JSON file per module; see [Content authoring](../content/README.md). File validation is independent of the database. Import publishes new content and explicit sequential releases while preserving matching records and previous published history.

For a prepared release, use the same storage environment as the server:

```sh
node dist/server/commands/content-check.js cpp
node dist/server/commands/content-import.js cpp
```

Compiled commands resolve curriculum from `dist/content/` relative to their own installation, independently of the working directory. When invoking them from elsewhere, use the absolute command path and explicitly supply the service environment or an absolute `--env-file` path. The `cpp` argument names a root inside the packaged `content/units/` directory.
