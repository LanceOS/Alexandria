# Getting started

Alexandria's first implementation is a local application shell: a main page, library browsing, reusable UI components, and a server backed by SQLite. Initialization creates Software, AI, and Mathematics categories; the topic catalog is empty. There are no units, modules, accounts, content uploads, or learner records yet.

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
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite serves the client and proxies API requests to the backend on port 3000. Use `Ctrl+C` to stop development.

`db:init` creates a fresh database and applies the current schema. It refuses to replace an existing database. On later starts, run only `npm run dev`; use `npm run db:migrate` when upgrading a database to a new schema.

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

The account running Alexandria needs access to its data directory and write access for initialization, migrations, backups, and SQLite sidecar files. Keep the default loopback listener for this initial application, which has no authentication. The example environment leaves optional paths commented out so local setup works without creating system directories.

No source-book directory is configured or accessed. The runtime and backup command need only Alexandria's application database.

## Build and run

```sh
npm run typecheck
npm test
npm run build
NODE_ENV=production npm start
```

Open [localhost:3000](http://localhost:3000). The build emits the frontend in `dist/client/` and compiled server/shared code in `dist/server/` and `dist/shared/`. `npm start` runs the compiled server; it does not build or initialize storage.

Check the running server with:

```sh
curl --fail http://127.0.0.1:3000/health/live
curl --fail http://127.0.0.1:3000/health/ready
curl --fail http://127.0.0.1:3000/api/library
```

Liveness reports that the HTTP process is running. Readiness checks database access and migration history. The library endpoint provides the seeded categories and empty topic catalog. Missing databases or incompatible migration history fail startup with a maintenance instruction.

The [optional systemd example](../deploy/README.md) runs the compiled server under a dedicated Linux service account. A service installation is not needed for local development.

## Database maintenance

| Command | Behavior |
| --- | --- |
| `npm run db:init` | Creates a new database, applies migrations, and seeds the three categories |
| `npm run db:migrate` | Checks an existing database, backs it up before pending migrations, then applies them; does nothing when already current |
| `npm run db:backup` | Creates a verified SQLite snapshot and a JSON checksum manifest in `BACKUP_DIR` |

Commands report their result in structured logs. A maintenance lock prevents overlapping local maintenance commands. If an interrupted command leaves `.maintenance.lock` in the data directory, confirm no maintenance process is running before removing that stale file.

The snapshot uses SQLite's backup API; do not copy the live database file as a substitute while WAL sidecar files may hold changes. Backups include only the application database and its manifest. They do not collect configuration, source books, or arbitrary files. Automatic retention, a restore command, and full release recovery workflows are deferred. Keep another copy of successful snapshots on separate storage if you need protection from disk loss.

For an upgrade, stop the application, run `db:backup`, retain the current release, install/build the new release, run `db:migrate`, and restart. For a prepared release without development dependencies, invoke `dist/server/commands/init.js`, `migrate.js`, or `backup.js` directly with Node and the same environment used by the server.

The [self-hosting plan](self-hosting-plan.md) covers the broader architecture and future operational work. Its account, curriculum, file-storage, and recovery phases are outside this initial scaffold.
