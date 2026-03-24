# Operations Runbook

This document covers day-to-day operations for the Freedom Archives search site:
how to deploy a fix, restart the application, check logs, and restore the database from backup.

**Live site:** https://search.freedomarchives.org
**Repo:** this repository
**Stack:** Node.js / FeathersJS backend + React frontend, PostgreSQL database

---

## Access

| Resource | How to access |
|---|---|
| Source code | GitHub (this repo) |
| Web server | SSH or cPanel at search.freedomarchives.org |
| Database server | SSH from the web server (see [Database](#database) below) |
| App config & secrets | `~/work/freedom_archives_2/config/local.json` on the web server (not in repo) |

> **Config files are not in the repository.** Each server instance has a `config/local.json`
> that overrides defaults — this is where database credentials and other secrets live.
> Do not delete or overwrite this file during deployment — the deploy process does not touch it.

---

## Deployment

Deployment is fully automated via GitHub Actions ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)).
There is no manual deploy step under normal circumstances.

**Server directories:**
- Production: `~/work/freedom_archives_2`
- Staging: `~/work/freedom_archives_staging`

### Deploy to staging

Push or merge any branch to `main`. GitHub Actions will automatically build and deploy to the
staging environment. You can also trigger it manually from the Actions tab in GitHub.

### Deploy to production

Use the release script, which bumps the version, creates a tag, and pushes:

```bash
yarn release patch   # bug fixes
yarn release minor   # new features
yarn release major   # breaking changes
```

Or manually: create and push a `v*` tag and GitHub Actions will deploy it.

GitHub Actions will build the frontend, create a GitHub Release with the build artifact,
and deploy to production. The deployment:

1. Checks out the tagged commit on the server
2. Installs backend dependencies (`yarn install`)
3. Extracts the pre-built frontend into a versioned directory
4. Updates a `public_dist` symlink to point at the new frontend build
5. Runs any pending database migrations
6. Restarts the Node.js process

Up to 10 previous production releases are kept under `~/work/freedom_archives_2/deployments/`
on the server (useful for rolling back the frontend by updating the symlink).

### Required GitHub secrets

These must be configured in the repository settings under **Settings → Secrets and variables → Actions**:

- `SSH_HOST` — web server hostname
- `SSH_USER` — SSH username
- `SSH_KEY` — private SSH key for deployment
- `SSH_PORT` — SSH port

These should already be set. If a deployment fails with an SSH error, verify they are present.

---

## Restarting the Application

The Node.js process is managed by CloudLinux's Node.js Selector.

### Via cPanel (easiest)

Log in to cPanel → **Node.js** → click the **SEARCH.FREEDOMARCHIVES.ORG/** tab → click **RESTART**.

### Via SSH

```bash
/usr/sbin/cloudlinux-selector restart --interpreter nodejs \
  --app-root ~/work/freedom_archives_2 --json
```

The application runs on port 3030. A restart typically takes a few seconds.

### Activating the Node.js environment (for manual commands)

If you need to run `yarn`, `node`, or other Node.js commands manually via SSH, activate
the virtual environment first. cPanel shows this command at the top of the Node.js config page:

```bash
source ~/nodevenv/work/freedom_archives_2/20/bin/activate && cd ~/work/freedom_archives_2
```

You'll know it's active when the shell prompt changes.

---

## Logs

Application logs are written to `~/work/freedom_archives_2/logs/` on the web server:

| File | Contents | Retention |
|---|---|---|
| `logs/app-YYYY-MM-DD.log` | All application events (JSON) | 14 days |
| `logs/error-YYYY-MM-DD.log` | Errors only (JSON) | 30 days |
| `stderr.log` | Raw process stderr (Node startup errors, uncaught exceptions) | not rotated |

The `logs/` files are gzip-compressed automatically. Check `stderr.log` first if the process
won't start at all, as startup errors won't make it into the Winston logs.

To watch errors in real time via SSH:

```bash
# Structured error log (most useful)
tail -f ~/work/freedom_archives_2/logs/error-$(date +%Y-%m-%d).log | jq .

# Raw process output (startup failures, crashes)
tail -f ~/work/freedom_archives_2/stderr.log
```

---

## Database

The database is PostgreSQL, running on a separate server. It is **not** directly accessible
from the public internet — connections go through SSH from the web server.

**Database names:**
- Production: `freedom_archives`
- Staging: `freedom_archives_stage`

The database connection details (host, user, password) are in `config/production.json`
and `config/stage.json` on the web server.

### Connecting manually

SSH into the web server, then use the helper functions defined in the backup config:

```bash
cd ~/work/freedom_archives_2/db_backup/
source pg_backup.config   # sets up ssh-tunnelled psql/pg_dump/pg_restore

psql -d freedom_archives  # opens a psql shell on the production database
```

---

## Database Backups

Backups run automatically via cron at **5:50 AM daily**:

```
50 5 * * * cd ~/work/freedom_archives_2/db_backup/ && ./db_backup.sh
```

Backup files are stored at **`~/work/db_backups/`** on the web server, organized by date:

```
~/work/db_backups/
  2026-03-23-daily/
    freedom_archives.sql.gz     # plain SQL dump (for restore)
    freedom_archives.custom     # pg_dump custom format
  2026-03-16-weekly/
  2026-03-01-monthly/
```

**Retention schedule:**
- Daily backups: 7 days
- Weekly backups (taken on Fridays): 5 weeks
- Monthly backups (taken on the 1st): 1 month

Backup progress and errors are logged to `~/work/freedom_archives_2/db_backup/backup.log`.

---

## Restoring the Database

> **Warning:** A full restore will overwrite all current data. Do this only if the database
> is corrupted or lost. A restore has not been formally tested — proceed carefully and verify
> data after restoring.

Restores are run from the web server using the SSH tunnel helpers in `pg_backup.config`.
The plain SQL format (`.sql.gz`) is the simplest to restore from.

### 1. Identify the backup to restore

```bash
ls ~/work/db_backups/
# e.g. 2026-03-23-daily/freedom_archives.sql.gz
```

### 2. Set up the connection helpers

```bash
cd ~/work/freedom_archives_2/db_backup/
source pg_backup.config
# This overrides psql/pg_dump/pg_restore to tunnel through SSH to the database server
```

### 3. Stop the application (to prevent writes during restore)

Via cPanel → **Node.js** → **SEARCH.FREEDOMARCHIVES.ORG/** tab → **STOP APP**, or via SSH:

```bash
/usr/sbin/cloudlinux-selector stop --interpreter nodejs \
  --app-root ~/work/freedom_archives_2 --json
```

### 4. Restore from the plain SQL dump

```bash
gunzip -c ~/work/db_backups/2026-03-23-daily/freedom_archives.sql.gz \
  | psql -d freedom_archives
```

The `psql` command here is the SSH-tunnelled version from `pg_backup.config` — it pipes
the SQL through SSH into the database server's Docker container.

### 5. Restart the application

Via cPanel → **Node.js** → **SEARCH.FREEDOMARCHIVES.ORG/** tab → **RESTART**, or:

```bash
/usr/sbin/cloudlinux-selector restart --interpreter nodejs \
  --app-root ~/work/freedom_archives_2 --json
```

### 6. Verify

Visit https://search.freedomarchives.org and confirm search results and admin access are working.

---

## Troubleshooting

### Site is down / not responding

1. Check if the Node process is running: cPanel → **Node.js** → **SEARCH.FREEDOMARCHIVES.ORG/** tab
2. If stopped, restart it (see [Restarting the Application](#restarting-the-application))
3. Check recent error logs: `tail -50 ~/work/freedom_archives_2/logs/error-$(date +%Y-%m-%d).log`
4. If the process crashes immediately on restart, there may be a bad deploy — see [Rolling Back](#rolling-back)

### Rolling back a production deploy

The recommended way to roll back is to **re-run the deploy workflow** targeting a previous tag:

1. Go to the repo on GitHub → **Actions** → **Deploy** → **Run workflow**
2. Set **Deploy target** to `prod` and **Ref** to the tag you want to roll back to (e.g. `v1.2.1`)
3. Click **Run workflow**

> **Migration warning:** There are no down migrations. If the version you're rolling back to
> had schema changes, rolling back the code will not undo them. This is usually fine (older
> code can typically tolerate extra columns), but be aware of it. If a migration broke
> something, restoring from a pre-migration database backup is the safer path.

The last 10 frontend builds are also kept on disk under `~/work/freedom_archives_2/deployments/`
if you need to do a quick frontend-only rollback without a full deploy run:

```bash
ls ~/work/freedom_archives_2/deployments/   # list available versions
ln -sfn ~/work/freedom_archives_2/deployments/v1.2.1 \
        ~/work/freedom_archives_2/public_dist
# then restart the app
```

### Deployment failed in GitHub Actions

Check the Actions tab in GitHub for the error. Common causes:
- SSH secrets missing or expired — verify under **Settings → Secrets and variables → Actions**
- The server's git checkout is in a bad state — SSH in and run `git status` in `~/work/freedom_archives_2`
