# Freedom Archives Search

Web application for the [Freedom Archives](https://freedomarchives.org/) — a public search
and browse interface for the archival collection, plus a role-based admin portal for
cataloguing and managing content.

**Live site:** https://search.freedomarchives.org

## Documentation

- [Architecture Overview](docs/architecture.md) — system design, domain model, tech stack, publish workflow
- [Local Development](docs/local-development.md) — setup, running locally, making schema changes
- [Operations Runbook](docs/runbook.md) — deploying, restarting, logs, database backup and restore

## Quick start

```bash
corepack enable
yarn install
cp config/development.json.example config/development.json
yarn start
```

See [Local Development](docs/local-development.md) for database setup and full instructions.
