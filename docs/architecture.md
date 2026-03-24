# Architecture Overview

The Freedom Archives search application is a web-based archival database with two distinct
user experiences: a **public search and browse interface** and a **role-based admin portal**
for cataloguing and managing archival content.

**Live site:** https://search.freedomarchives.org
**Scale:** ~18,000 records

---

## High-Level Architecture

```
                        Browser
                           │
                    HTTPS (port 443)
                           │
                    ┌──────▼──────┐
                    │  Web Server  │   search.freedomarchives.org
                    │  (cPanel /   │   CloudLinux VPS
                    │  CloudLinux) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Node.js    │   ~/work/freedom_archives_2
                    │  (port 3030)│   FeathersJS + Express
                    │             │
                    │  /          │ → React SPA (public site)
                    │  /admin     │ → React SPA (admin portal)
                    │  /api/*     │ → REST API
                    └──────┬──────┘
                           │  TCP (SSL)
                    ┌──────▼──────┐
                    │  PostgreSQL  │   Separate Linode server
                    │  (Docker)    │   freedomarchives.org
                    └─────────────┘
```

The Node.js process serves everything: it handles API requests, serves the React SPA for
both the public site and admin portal, and serves static assets (thumbnails, sitemap, etc.).
There is no separate reverse proxy — cPanel/CloudLinux routes traffic directly to the
Node.js process.

**Media files** (audio, video, PDFs, images) are hosted externally and referenced by URL.
The application stores only metadata, thumbnail images, and links.

---

## Application Layers

### Frontend

A React 19 single-page application built with React Router 7, located in `frontend/`.
It is built at deploy time and served as static files from `public_dist/` (a symlink to the
current release directory).

**Key frontend libraries:**

| Library | Purpose |
|---|---|
| [React Router](https://reactrouter.com/) | Client-side routing (v7, framework mode) |
| [Material UI (MUI)](https://mui.com/) | Component library — layout, forms, tables, dialogs |
| [React Hook Form](https://react-hook-form.com/) | Form state management and validation |
| [Zod](https://zod.dev/) | Schema validation (used with React Hook Form) |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight global state management |
| [TipTap](https://tiptap.dev/) | Rich text editor (used for description/notes fields) |

The frontend splits into two top-level layouts:

| Layout | URL prefix | Auth required |
|---|---|---|
| Public site | `/` | No |
| Admin portal | `/admin` | Yes (JWT) |

**Public site pages:**
- Home — featured collections, word cloud of top keywords, carousel
- Search — full-text search with faceted filters (subjects, authors, keywords, format, year range, etc.)
- Collections — hierarchical browse by collection

**Admin portal pages:**
- Records — list, search, create, edit, review intern changes
- Collections — manage collection hierarchy, featured records, thumbnails
- Edit Lists — manage controlled vocabulary (subjects, keywords, authors, publishers, etc.)
- Relationships — manage record-to-record relationships
- Users — create/manage user accounts
- Site Settings — configure site header text, featured content
- Publish Site — push working data live and manage snapshots
- Data Tools — find/merge duplicate records and list items, data cleanup

### Backend

A FeathersJS 5 (Express-based) REST API, located in `backend/`. It uses Knex.js as a query
builder against PostgreSQL.

Services split into two groups:

**Admin services** (require authentication):
`records`, `collections`, `media`, `list_items`, `relationships`, `users`, `settings`,
`snapshots`, `review_changes`, `duplicate_records`, `duplicate_list_items`, `data_cleanup`

**Public services** (no authentication, read-only):
`public_records`, `public_collections`, `public_settings`

Public services read exclusively from the `public_search` schema — a separate, denormalized
copy of the data that is only updated when an admin explicitly publishes the site (see
[Publish Workflow](#publish-workflow) below). This means edits in the admin portal are not
visible on the public site until published.

**Key backend libraries:**

| Library | Purpose |
|---|---|
| [FeathersJS](https://feathersjs.com/) | Service-oriented API framework built on Express; handles routing, hooks, auth |
| [Knex.js](https://knexjs.org/) | SQL query builder and migration runner |
| [pg-tsquery](https://github.com/caub/pg-tsquery) | Translates user search input into PostgreSQL `tsquery` expressions |
| [Sharp](https://sharp.pixelplumbing.com/) | Server-side image processing for thumbnail generation |
| [Winston](https://github.com/winstonjs/winston) | Structured logging with daily log rotation |

### Database

PostgreSQL, running in Docker on a separate server. The application uses two schemas:

| Schema | Purpose |
|---|---|
| `freedom_archives` | Working data — all admin reads/writes go here |
| `public_search` | Published snapshot — what the public site serves |

### The `_unified_*` cache tables

Within the `freedom_archives` schema, most queries hit `_unified_records` and
`_unified_collections` rather than the raw normalized tables. These are regular PostgreSQL
tables (not materialized views) that act as a read cache with pre-computed, denormalized
columns and a full set of GIN indexes for fast full-text and array-containment queries.

The pattern works as follows:

```
records / collections / media / list_items / ...
  (normalized source tables — writes go here)
          │
          │  refreshView hook runs after every create/patch/remove
          ▼
unified_records / unified_collections
  (SQL VIEWs — full join across all related tables, expensive but correct)
          │
          │  UPSERT from view → table (single row, in same transaction)
          ▼
_unified_records / _unified_collections
  (cached TABLEs — GIN indexed, fast to query, what the API actually reads)
```

After every write operation, the `refreshView` hook (in `backend/services/common_hooks/index.js`)
upserts the affected row by selecting from the corresponding view into the cached table. This
keeps the cache in sync without needing triggers or scheduled jobs, and ensures all indexes
stay current.

The canonical schema definitions for both schemas are in [`dbtools/schema/`](../dbtools/schema/).

Schema changes are managed declaratively: a developer edits the `.sql` files in `dbtools/schema/`,
uses [`dbtools/manage_schema.sh`](../dbtools/manage_schema.sh) with [pgschema](https://www.pgschema.com/)
to apply and test changes against a local database, then generates a Knex migration file
(via `manage_schema.sh create`) to deploy the same changes to production. The schema files and
the generated migration are committed together.

The `dbtools/` directory also contains one-off data migration and sync scripts used for
database maintenance — these are not part of the normal Knex migration flow.

---

## Domain Model

### Core Entities

```
Archive (forward-looking, currently one)
  └── Collections (hierarchical, tree structure)
        └── Records (~18,000)
              └── Media (URLs + thumbnails; Audio, Video, Image, PDF, Webpage)
```

**Archive** — Top-level container. The schema supports multiple archives (multi-tenant) but
currently there is only one. `archive_id` threads through most tables.

**Collection** — Hierarchical groupings of records. Collections can be nested to arbitrary
depth via `parent_collection_id` and a pre-computed `descendant_collection_ids` array.
Collections can have `featured_records` (a curated subset displayed prominently) and
`child_records`. Collections and records can both be hidden (`is_hidden`) or flagged for
review (`needs_review`).

**Record** — The primary archival item. Key fields: title, description, date, year,
vol_number, fact_number (FACT cloud backup reference). Records belong to one collection and
optionally have a parent record (for multi-part items via `parent_record_id` or continuations).

**Media** — One or more digital items associated with a record (Audio, Video, Image, PDF,
Webpage). Each media item has a URL (external), an optional thumbnail (stored locally),
a call number, and typed metadata (format, quality, generation). One media item per record
is designated `is_primary`.

**List Items** — Controlled vocabulary used across records and media. Types include:
`subject`, `author`, `keyword`, `producer`, `publisher`, `program`, `format`, `generation`,
`quality`, `call_number`. Records link to list items via `records_to_list_items`.

### Full-text Search

Search is powered by PostgreSQL full-text search (`pg-tsquery`). Records and list items have
pre-computed `fulltext` and `search_text` tsvector columns. The public search service queries
the `public_search` schema with full-text predicates plus facet filters (subjects, authors,
formats, year range, etc.).

---

## Publish Workflow

Edits made in the admin portal do not appear on the public site immediately. An admin must
explicitly publish by clicking **Publish Site** in the admin portal.

Publishing does the following in a single database transaction:

1. **Snapshot the current live data** — copies `public_search.*` tables into versioned
   `*_snapshots` tables (up to 3 snapshots are retained: "Snapshot 1", "Snapshot 2", "Snapshot 3")
2. **Refresh public data** — replaces `public_search.*` with a fresh query from the working
   schema, filtered to exclude hidden and needs-review items
3. **Denormalize collections** — builds nested `children` JSONB on each collection for
   efficient frontend rendering
4. **Cache derived data** — writes top 30 keywords (by frequency) and root collection
   structure into `public_search.config` for fast home page loads
5. **Vacuum/analyze** — runs `VACUUM ANALYZE` on public tables
6. **Regenerate sitemap** — writes a fresh `sitemap.xml` to the public directory

**Restoring a snapshot** (via the Publish Site page) replaces the current `public_search.*`
contents with the selected snapshot's data. This is the mechanism for rolling back a bad
publish.

---

## Authentication & Authorization

**Authentication:** JWT tokens issued on login, using FeathersJS local strategy. Tokens
expire after 1 day. The public API uses an anonymous strategy (no credentials required).

**User roles (least to most privileged):**

| Role | Capabilities |
|---|---|
| `intern` | Create and edit records/collections; edits are flagged `needs_review=true` until approved by staff |
| `staff` | Full CRUD on records, collections, media, list items; manage users; access data tools; publish site |
| `administrator` | Everything staff can do, plus review intern changes and manage relationships |

Role checks are enforced as FeathersJS hooks on each service method.

**Config and secrets** are stored in `config/local.json` on each server instance (not in the
repository). This file contains the database connection details and the JWT secret.

---

## Key Design Decisions

**Two-schema publish model** — The `public_search` schema decouples the public site from
in-progress admin work. The public site is always served from a stable, consistent snapshot.
The cost is that changes require an explicit publish step.

**Denormalized public data** — Records in `public_search` carry pre-computed arrays of list
item IDs (subject_ids, author_ids, etc.) rather than joining at query time. Collections carry
pre-built `children` JSONB. This keeps public search fast without caching infrastructure.

**Thumbnails stored locally** — Thumbnail images are fetched from their source URLs (Vimeo,
etc.) and cached on the server. All other media files are external and referenced by URL only.

**Custom libvips build for PDF thumbnails** — The production VPS lacks the system libraries
needed for Sharp to extract PDF thumbnails out of the box. A custom `libvips` binary is built
from source (targeting Linux x64) using [`sharp-libvips/build-sharp-libvips.sh`](../sharp-libvips/build-sharp-libvips.sh)
and installed as a local npm package. The build applies a custom patch (`pdfium.patch`) that
may need updating when upgrading the target `libvips` version. This is not needed for local
development unless you are specifically working on PDF thumbnail handling.

**Multi-archive support is forward-looking** — The schema and services support multiple
archives via `archive_id`, but only one archive is currently in use.
