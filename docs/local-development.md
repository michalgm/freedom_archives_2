# Local Development

## Prerequisites

- **Node.js v20** — use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions
- **Yarn** — enabled via Corepack (ships with Node.js): `corepack enable`
- **PostgreSQL** — installed locally or running via Docker
- **jq** — used by the dbtools scripts to read config files (`brew install jq` / `apt install jq`)
- **pgschema binary** — needed only if you plan to make schema changes (see [Making schema changes](#making-schema-changes))

---

## Setup

### 1. Install dependencies

```bash
corepack enable
yarn install
```

### 2. Set up the database

The app expects a local PostgreSQL database matching the credentials in
`config/development.json` (see [Configuration](#configuration) below for how to create it):

| Setting | Value |
|---|---|
| Host | `localhost` |
| Database | `freedom_archives` |
| User | `fa_dev` |
| Password | `fa_dev` |

Create the role and database:

```sql
CREATE USER fa_dev WITH PASSWORD 'fa_dev';
CREATE DATABASE freedom_archives OWNER fa_dev;
\c freedom_archives
CREATE SCHEMA freedom_archives AUTHORIZATION fa_dev;
CREATE SCHEMA public_search AUTHORIZATION fa_dev;
```

### 3. Seed the database

**Option A — Restore from a live site backup (recommended)**

The easiest way to get a working local environment is to restore a dump from the production
server. Grab a recent backup from `~/work/db_backups/` on the web server (see the
[runbook](runbook.md#database-backups)) and restore the plain SQL dump:

```bash
gunzip -c 2026-03-23-daily/freedom_archives.sql.gz | psql -U fa_dev freedom_archives
```

**Option B — Fresh database with seed data**

Run migrations to create the schema, then the seed to insert the minimum required data
(an archive and a root collection):

```bash
yarn migrate          # runs all Knex migrations
yarn knex seed:run    # inserts archive_id=1, root collection, and a test record
```

You'll then need to create an admin user manually (see [Creating an admin user](#creating-an-admin-user) below).

### 4. Start the app

```bash
yarn start
```

This runs both the backend (port **3030**) and the frontend dev server (port **4040**)
concurrently. The frontend dev server proxies `/api` and `/images/` requests to the backend.

| URL | What |
|---|---|
| http://localhost:4040 | Public site |
| http://localhost:4040/admin | Admin portal |
| http://localhost:3030 | Backend API directly |

---

## Configuration

`config/development.json` is gitignored and must be created locally. Copy the example:

```bash
cp config/development.json.example config/development.json
```

The example contains working defaults (local DB credentials + a placeholder JWT secret).
The JWT secret can be any string for local dev — it only needs to be secret in production.

The [`dbtools/`](../dbtools/) scripts read DB credentials from `config/development.json`,
so this file is required even if you're not changing any settings.

To override any setting locally (e.g. to use a different DB password or port), create a
`config/local.json` — this file is gitignored and takes precedence over all other config files:

```json
{
  "port": 3030,
  "postgresql": {
    "connection": {
      "host": "localhost",
      "user": "fa_dev",
      "password": "yourpassword",
      "database": "freedom_archives"
    }
  }
}
```

---

## Creating an admin user

If you're starting from a fresh database (Option B above), you need to insert an admin user
directly via psql, since the users API requires authentication.

First generate a bcrypt hash for your chosen password:

```bash
node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"
```

Then insert the user:

```sql
\c freedom_archives
SET search_path TO freedom_archives;

INSERT INTO users (archive_id, username, firstname, lastname, role, password, active)
VALUES (1, 'admin', 'Admin', 'User', 'administrator', '<paste-bcrypt-hash>', true);
```

---

## Running tests

```bash
# Backend (Vitest)
yarn test

# Frontend (Vitest)
cd frontend && yarn test

# Storybook component tests
cd frontend && yarn storybook        # start dev server
cd frontend && yarn test:storybook   # run headless
```

---

## Making schema changes

Schema changes follow a two-step workflow using [pgschema](https://www.pgschema.com/), a
tool that diffs a declarative schema file against a live database and generates the SQL to
reconcile them.

### Setup: install the pgschema binary

Download the `pgschema` binary for your platform from https://www.pgschema.com/ and place it
at `dbtools/schema/pgschema`. Make it executable:

```bash
chmod +x dbtools/schema/pgschema
```

The binary is gitignored — each developer installs it locally.

### Workflow

**1. Edit the schema files directly:**

```
dbtools/schema/freedom_archives.sql   # main working schema
dbtools/schema/public_search.sql      # public read-only schema
```

**2. Apply to your local dev database to test:**

```bash
cd dbtools
./manage_schema.sh apply development
```

This runs `pgschema apply` against your local DB, diffing the schema files against the
actual database state and applying any changes. Iterate until the schema works as expected.

**3. Generate a Knex migration for production:**

```bash
./manage_schema.sh create production [migration_name]
```

This runs `pgschema plan` to diff the schema files against the production database state and
wraps the resulting SQL in a Knex migration file at `migrations/<timestamp>-[migration_name].js`.
Review the generated migration before committing.

> **Note:** There are no down migrations. The `down` export in generated migration files is
> left empty. Do not add destructive rollback logic.

**4. Edit the migration if needed, then commit both the migration and the updated schema files together.**

The schema files in `dbtools/schema/` are the source of truth for what the database should
look like. The Knex migrations are how those changes get deployed in CI/CD.

Because migrations are plain JS files, you can add data migrations alongside schema changes
in the same file — backfilling values, transforming existing rows, etc. This is the reason
for the two-step flow (pgschema for schema diffing, Knex for deployment) rather than using
pgschema's `apply` directly in production.

---

## PDF thumbnails and the custom Sharp build

The production server uses a custom-built `libvips` binary to enable PDF thumbnail
extraction — the VPS does not have the system libraries required for PDFs. This binary lives
in [`sharp-libvips/`](../sharp-libvips/) and is installed as a local npm package.

For most local development this is not needed — the default Sharp package (installed by
`yarn install`) handles all common thumbnail types. The custom build is only required if you
need to work on PDF thumbnail functionality.

If you do need it, the build script targets Linux x64:

```bash
cd sharp-libvips
./build-sharp-libvips.sh
```

**Version matching:** the `sharp` npm package version and the built `libvips` version must be
compatible. Currently `sharp@0.34.2` is installed, built against `libvips v8.16.1` (set in
`build-sharp-libvips.sh`). If you upgrade `sharp`, check its
[prebuilt binaries changelog](https://github.com/lovell/sharp-libvips/releases) to find the
matching `libvips` version and update `RELEASE_TAG` in the build script accordingly.

Note: the `pdfium.patch` may also need updating when changing the target `libvips` version.
See the [architecture doc](architecture.md#pdf-thumbnails) for more context.
