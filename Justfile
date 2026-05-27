# Kanban Board — task runner
# Install just: cargo install just

# Default: list available commands
default:
    @just --list

# Start the app in dev mode (Vite + Tauri)
dev:
    pnpm tauri dev

# Build the app for release
build:
    pnpm tauri build

# Install frontend dependencies
install:
    pnpm install

# TypeScript type check (no emit)
typecheck:
    pnpm exec tsc --noEmit

# Rust compile check (fast, no binary)
check:
    cargo check --manifest-path src-tauri/Cargo.toml

# Run both checks
lint: typecheck check

# Create the dev database (needed for sqlx compile-time macros)
db-create:
    cd src-tauri && sqlx database create

# Run pending migrations against dev database
db-migrate:
    cd src-tauri && sqlx migrate run

# Create dev database and run migrations (first-time setup)
db-setup: db-create db-migrate

# Drop and recreate dev database from scratch
db-reset:
    cd src-tauri && sqlx database drop -y && sqlx database create && sqlx migrate run

# Add a new migration file (usage: just db-add <name>)
db-add name:
    cd src-tauri && sqlx migrate add {{ name }}
