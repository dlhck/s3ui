# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (auto-starts Docker PostgreSQL)
bun run build        # Production build
bun run lint         # Run Biome linter
bun run format       # Format code with Biome
bun run db:migrate   # Run Better Auth database migrations
bun run db:seed      # Seed the database
```

## Architecture

This is a Next.js 16 web-based S3 file manager with Better Auth authentication.

### Key Layers

**Authentication** (`src/lib/auth.ts`, `src/lib/auth-server.ts`, `src/lib/auth-client.ts`)
- Better Auth with PostgreSQL backend via `pg` Pool
- Supports email/password and Google OAuth
- `requireAuth()` in auth-server.ts protects API routes

**S3 Operations** (`src/lib/s3/`)
- `client.ts` - S3Client configuration from environment variables
- `operations.ts` - All S3 operations (list, delete, copy, move, rename, presigned URLs)
- `types.ts` - TypeScript types for S3 objects and results

**API Routes** (`src/app/api/`)
- `/api/auth/[...all]` - Better Auth handler
- `/api/s3/buckets` - List buckets
- `/api/s3/objects` - List/create/delete objects (action-based POST)
- `/api/s3/objects/[...path]` - Single object operations (GET metadata, PATCH rename/move/copy)
- `/api/s3/presigned` - Generate presigned URLs for download
- `/api/s3/upload` - Server-side file upload with SSE progress (uses @aws-sdk/lib-storage)

**React Hooks** (`src/hooks/use-s3.ts`)
- TanStack Query hooks wrapping all S3 API calls
- Query keys: `["buckets"]`, `["objects", bucket, prefix]`, `["object", bucket, key]`

**UI Components** (`src/components/`)
- `file-manager/` - File browser, toolbar, dialogs (create folder, rename, delete, move, preview)
- `ui/` - shadcn/ui components (Base UI primitives)
  - **NEVER edit files in `src/components/ui/` directly**
  - To add new components: `bunx shadcn@latest add <component>`
  - To update components: `bunx shadcn@latest add <component> --overwrite`
- `auth/` - Login form, user button

### Route Structure

- `/login` - Authentication page
- `/(dashboard)/` - Protected layout with sidebar and header
- `/(dashboard)/[bucket]/[[...path]]` - File browser for bucket/path

### Environment Variables

S3 configuration: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT_URL`, `S3_FORCE_PATH_STYLE`, `S3_ALLOWED_BUCKETS`

Auth configuration: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Code Style

- Biome for linting and formatting (2-space indent)
- Path alias: `@/*` maps to `./src/*`
- React Compiler enabled
