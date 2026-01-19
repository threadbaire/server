# Threadbaire Server

When your markdown files get too long, this is what comes next.

## What this is

A simple database and API for the [Threadbaire method](https://github.com/threadbaire/method). Instead of copying and pasting markdown files into every AI chat, you give the AI a URL. It reads your entries directly.

You run it yourself, locally or deployed to your own Vercel account. Your data stays yours.

## Where this is at

**v0.1** — This works, but it's early.

What that means:
- It does what it says (stores entries, serves them via API, runs locally or on Vercel)
- It hasn't been security audited
- It hasn't been stress-tested
- Some AI models work smoothly, others need workarounds (ChatGPT can't modify URL parameters, Gemini gets blocked by bot protection)
- The API is simple and might change

This is a tool I built for my own use and am sharing because others might find it useful. If you're running it locally or on your own Vercel account for personal use, you'll probably be fine. If you're thinking of exposing it to the public internet or storing sensitive data, wait for a more mature version.

Contributions and bug reports welcome.

## Why bother

The markdown files work great until they don't. After a few months of active logging, the Addendum gets long. AI context windows have limits. You start truncating, summarizing, losing detail.

This server fixes that:
- Store entries in a database instead of a growing file
- Query by project, date, keyword, get just what you need
- AI models read via API, no more copy-paste
- Same receipts, same structure, just searchable

## What you get

- **A database** — SQLite locally, Postgres when deployed
- **A REST API** — any AI model can read it (standard JSON)
- **A simple UI** — for creating and browsing entries
- **Your data** — runs on your machine or your Vercel account

## Quick start

### 1. Clone and install
```bash
git clone https://github.com/threadbaire/server.git
cd server
npm install
```

### 2. Configure
```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API key:
```
API_KEY=your-secret-key-here
```

Edit `lib/config.ts` to add your project names.

### 3. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter your API key at the login screen.

The database (`entries.db`) creates itself on first run.

## Using with AI models

Give the AI your server URL with the token:
```
https://your-server.vercel.app/api/entries?token=YOUR_API_KEY
```

The AI fetches your entries as JSON and uses them for context. Works with Claude, ChatGPT, and anything else with HTTP access.

**Note:** Most AI chat interfaces can't set custom headers. The `?token=` parameter works around this.

You can filter what the AI sees:
```
?project=my-project
?after=2025-01-01
?q=keyword
```
## AI agent integration

This server includes a `/api/rundown` endpoint that follows the [RundownAPI spec](https://github.com/threadbaire/rundownapi).

Point an AI agent at `/api/rundown` and it will learn how to use the API on its own — what endpoints exist, how to authenticate, and when to use them.

No auth required to read the rundown. The AI will ask you for the token when it needs to make authenticated requests.

## Deploying to Vercel

When you're ready to access your entries from anywhere:

1. Fork this repo to your GitHub
2. Connect it to Vercel
3. Add Neon Postgres via Vercel Marketplace (free tier works)
4. Set `API_KEY` in Vercel environment variables
5. Push — it deploys automatically
6. Visit `/api/init` once to create the database table

## API reference

All endpoints need authentication — either `Authorization: Bearer <key>` header or `?token=<key>` parameter.

| Method | Endpoint           | What it does                    |
| ------ | ------------------ | ------------------------------- |
| GET    | `/api/entries`     | List entries (supports filters) |
| GET    | `/api/entries/:id` | Get one entry                   |
| POST   | `/api/entries`     | Create entry                    |
| PUT    | `/api/entries/:id` | Update entry                    |
| DELETE | `/api/entries/:id` | Soft delete entry               |

**Filters for GET /api/entries:**
- `project` — filter by project name
- `document_type` — "addendum" or "dev_log"
- `after` / `before` — date range (YYYY-MM-DD)
- `q` — keyword search
- `limit` / `offset` — pagination

## Scripts

Export SQLite database to JSON:
```bash
node scripts/export-sqlite.js
```

Import JSON to Postgres:
```bash
POSTGRES_URL=your-connection-string node scripts/import-to-postgres.js
```

## If you don't need this

The markdown files still work. Most projects never outgrow them.

This server is for when you do, when the Addendum is too long to paste, when you want to query instead of scroll, when you're running multiple projects and want them in one place.

Start with the [method](https://github.com/threadbaire/method). Come back here when you need it.

## Questions

**Do I need this to use Threadbaire?**
No. The markdown templates are the method. This is optional infrastructure for when they get unwieldy.

**Is my data safe?**
It's on your machine (SQLite) or your Vercel account (Postgres). Nothing is sent anywhere else. The code is open, you can verify this yourself.

**Can I use this without Vercel?**
Yes. Any hosting that runs Node.js works. You'll need to set up your own Postgres database.

**What if I want to go back to markdown?**
Export your entries to JSON (`node scripts/export-sqlite.js`), convert to markdown however you like. Your data is always portable.
