# Artisan

An AI-powered conversational media generation app.

## Setup

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Install dependencies and run migrations:

```bash
bun install
bun run db:migrate
```

Start the dev server:

```bash
bun dev
```

## Stack

- SvelteKit 5 + Svelte 5
- PostgreSQL + Drizzle ORM
- fal.ai for media generation
- OpenRouter for LLM
- Better-auth (Google OAuth)
- S3-compatible storage
- Redis for resumable streams

## Commands

```bash
bun dev          # Start dev server
bun run build    # Build for production
bun preview      # Preview production build
bun check        # Type check
bun lint         # Format + lint
bun db:generate  # Generate migrations
bun db:migrate   # Run migrations
```
