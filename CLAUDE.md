# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** is an AI-powered React component generator with live preview. Users describe UI components in natural language, Claude generates them, and they're displayed in a live preview iframe — all without writing files to disk.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run db:reset     # Drop and recreate the database
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

Requires a `.env` file with `ANTHROPIC_API_KEY`. Without it, a mock provider is used.

## Architecture

### Core Flow

1. User sends a message describing a component
2. `POST /api/chat` (`src/app/api/chat/route.ts`) streams a response from Claude (Haiku model via Vercel AI SDK)
3. Claude uses two tools to modify the virtual file system:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create/edit file contents
   - `file_manager` (`src/lib/tools/file-manager.ts`) — rename/delete files
4. The virtual file system (`src/lib/file-system.ts`) updates in-memory
5. The preview iframe re-renders with the new component code via JSX transformation

### Key Architectural Concepts

**Virtual File System:** All generated component code lives in memory (`src/lib/file-system.ts`). Nothing is written to disk. The FS is serializable to JSON for database storage.

**Preview Generation:** Components are transformed for browser execution in `src/lib/preview/`. This includes Babel JSX transpilation, import map creation for CDN dependencies, and HTML generation. The result is injected into an iframe.

**AI Provider:** `src/lib/provider.ts` exports the model. Falls back to a mock provider if `ANTHROPIC_API_KEY` is not set. The system prompt for component generation is in `src/lib/prompts/generation.tsx`.

**Authentication:** JWT sessions (7-day expiry) with bcrypt passwords. `src/middleware.ts` guards protected routes. Server actions in `src/actions/` handle auth and project CRUD.

**Project Persistence:** Authenticated users get their projects saved to SQLite via Prisma. Projects store messages and virtual file system state as JSON blobs. Anonymous users work in ephemeral state only.

### Directory Structure

```
src/
  app/
    api/chat/route.ts    # Streaming chat endpoint
    [projectId]/page.tsx # Project page
    main-content.tsx     # Root UI layout (resizable panels)
  lib/
    file-system.ts       # Virtual FS implementation
    provider.ts          # AI model configuration
    prompts/             # Claude system prompts
    tools/               # Claude tool implementations
    preview/             # JSX transform + iframe HTML generation
    auth.ts              # JWT utilities
  actions/               # Next.js server actions (auth, project CRUD)
  components/            # React components (auth, chat, editor, preview, ui)
  hooks/                 # Custom React hooks
prisma/
  schema.prisma          # User + Project models (SQLite)
```

### Database Schema

- `User`: id, email, hashedPassword, timestamps
- `Project`: id, name, userId (nullable — anonymous projects), messages (JSON), data (JSON), timestamps

### Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **AI:** Claude via `@ai-sdk/anthropic` (Vercel AI SDK), with prompt caching
- **Database:** Prisma + SQLite
- **Styling:** Tailwind CSS v4
- **Code Editor:** Monaco Editor
- **UI:** shadcn/ui + Radix UI primitives
- **Testing:** Vitest + Testing Library
- **Build:** Turbopack
