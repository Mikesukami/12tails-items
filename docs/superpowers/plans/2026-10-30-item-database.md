# 12 Tails Item Database Implementation Plan

> **For agentic workers:** use superpowers:executing-plans inline; the user authorized starting implementation.

**Goal:** Deliver a shared Thai item price board with owner-only writes and Netlify deployment instructions.

**Architecture:** React/Vite frontend calls Supabase Auth, PostgreSQL and Storage. RLS enforces owner allowlist; no standalone server.

**Tech Stack:** React, Vite, Supabase JS, Node test runner, React Testing Library, Vitest.

**Spec:** ../specs/2026-10-30-item-database-design.md

## Global Constraints
- Public shared board; owner-only writes; manual Gold/THB.
- Images JPEG/PNG/WebP <= 2 MiB; no service-role key in client.
- Thai UI and installation guide; Netlify dist build.

## Review Focus
- Empty, negative, nonfinite or excess-precision prices must fail.
- Viewer must never gain write access from being authenticated alone.
- Database save failure after upload must clean up new file and retain old item.
- Missing configuration, network failure and empty search have distinct states.
- Long Thai names, mobile layout and keyboard dialogs must remain usable.

## Tasks
1. Domain and repository (`src/domain.js`, `src/repository.js`, `tests/*.test.js`): write tests, observe failure, implement, verify. Interfaces `parseItem(values)`, `validateImage(file)`, `filterItems(items,query,sort)`, `createRepository(client)` returning list/isAdmin/save/remove. Test real orchestration with controlled boundary client.
2. Database (`supabase/schema.sql`, `supabase/verify-rls.sql`): constraints, grants, RLS, admin allowlist, storage policies; provide transaction-rolled-back SQL permission checks.
3. UI (`src/App.jsx`, `src/styles.css`, `src/main.jsx`, `src/client.js`, `tests/App.test.jsx`): visitor/search tests first, implement cards, login, admin editor, upload preview, confirmations, refresh, loading/errors and read-only demo. Test owner save/error paths and run suite.
4. Delivery (`README.md`, `.env.example`, `netlify.toml`, `package.json`): Thai setup, account bootstrap, deployment and acceptance checks. Run full tests and build; review all files and report actual verification and deployment limits.

## Execution ledger
- Workspace is a new empty directory, not a Git checkout; work in the user-provided directory. No existing branch to isolate or commit.
- User approved design and immediate implementation; proceed inline without another approval round.
- Sites hosting skipped because user explicitly selected Netlify; local source delivery only until their accounts are configured.
- Task 1 complete: observed missing-module failures, then 8 Node behavior tests passed (validation, denied writes, upload rollback, replacement and deletion).
- Task 2 complete: SQL schema and transaction-rolled-back permission checks supplied. Real database execution awaits the user's Supabase project.
- Task 3 complete: observed missing App failure, then 5 interaction tests passed. Independent reviewer found auth refresh could discard unsaved edits; reproduced with a failing sixth test, fixed session identity handling, and all 6 passed.
- Task 4 complete: Thai deployment guide, pinned pnpm lockfile, Netlify build/security headers and environment example supplied. Production build passed without warnings. Browser demo opened successfully and Thai name search worked; inspected desktop and 390px mobile screenshots.
- Ruling: empty remote repository verified through git ls-remote. Initialized main in the supplied folder; user explicitly requested commit and push to https://github.com/Mikesukami/12tails-items.git.
- No real Supabase/Netlify account configured; do not label the app deployed or claim live integration tests passed.
