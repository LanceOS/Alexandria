# Optional direct service

The first scaffold runs as one Node process with a local SQLite database. [alexandria.service](alexandria.service) is an example for a Linux host using systemd; it is not an installer. Docker packaging and broader operational automation are deferred.

1. Build the application with `npm ci` and `npm run build`. Place the release in `/opt/alexandria` with `dist/`, `package.json`, `package-lock.json`, and production dependencies installed using `npm ci --omit=dev`. Keep the release readable by the service account.
2. Create a dedicated `alexandria` user/group, and create `/srv/alexandria/data` and `/srv/alexandria/backups` owned by that account. The service needs write access to both directories.
3. Create `/etc/alexandria.env` with the configuration below. Restrict it to the service account and administrator.
4. Confirm `/usr/bin/node` is Node 24.8 or newer. Update `ExecStart` if Node is installed elsewhere; a shell version manager is not loaded by systemd.

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=http://localhost:3000
DATA_DIR=/srv/alexandria/data
DATABASE_PATH=/srv/alexandria/data/database/alexandria.sqlite
BACKUP_DIR=/srv/alexandria/backups
LOG_LEVEL=info
```

Initialize a fresh database explicitly as the service account:

```sh
sudo -u alexandria /usr/bin/node --env-file=/etc/alexandria.env /opt/alexandria/dist/server/commands/init.js
```

Install the reviewed service file at `/etc/systemd/system/alexandria.service`, then start it:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now alexandria
sudo systemctl status alexandria
```

Open [Alexandria](http://localhost:3000) on the host. The example binds to loopback. Create accounts with the compiled `account-create.js` command under the same service account and environment. For HTTPS behind a reverse proxy, set `APP_ORIGIN` to the public HTTPS origin so session cookies are Secure. View logs with `journalctl -u alexandria`; stop the service with `sudo systemctl stop alexandria`.

Before replacing a release, stop the service and run the compiled `backup.js` maintenance command using the same account and `--env-file`. Apply the new release's compiled `migrate.js` command before restarting. Keep the prior release and backup until the updated application passes a local check. Startup rejects a missing database or incompatible schema.

Runtime data belongs on a local filesystem outside `/opt/alexandria`. Only application storage is needed; source-book directories are never mounted, copied, or served. Installation may download dependencies; a prepared release with Node and production dependencies already present runs without a package download.
