# Kanban Board

> **Work in progress.** I'm building this project to learn Rust — expect rough edges and ongoing refactoring.

A native desktop Kanban board manager built with Rust + Tauri. Supports multiple projects, multiple boards per project, drag & drop, labels, due dates, and Markdown descriptions.

## Stack

- **Backend** — Rust, Tauri v2, SQLite (sqlx)
- **Frontend** — React, TypeScript, Tailwind CSS v4, shadcn/ui
- **State** — Zustand
- **Drag & drop** — @dnd-kit

## Getting started

```bash
# Install dependencies
just install

# Set up the dev database (required once for sqlx compile-time checks)
just db-setup

# Start the app
just dev
```

## Commands

```bash
just dev          # Start app in dev mode
just build        # Release build
just typecheck    # TypeScript check
just check        # Rust compile check
just lint         # Both checks
just db-setup     # Create dev.db + run migrations (first time)
just db-migrate   # Run pending migrations
just db-reset     # Drop and recreate dev.db
just db-add name  # Create a new migration file
```

## Data location

The database is stored in the platform's standard app data directory:

- **Windows** — `%APPDATA%\com.moige.kanban-board\kanban.db`
- **macOS** — `~/Library/Application Support/com.moige.kanban-board/kanban.db`
- **Linux** — `~/.local/share/com.moige.kanban-board/kanban.db`

## License

[MIT](LICENSE)

## NOTE

For now, Windows 11 is the only tested OS.