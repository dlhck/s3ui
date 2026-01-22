# S3UI

A web-based file manager for Amazon S3 and S3-compatible storage services. Browse, upload, and manage files in your S3 buckets through a clean, modern interface.

## Features

- Browse S3 buckets and navigate folder structures
- Upload and download files
- User authentication with Better Auth
- Responsive UI built with Next.js and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16
- **Authentication**: Better Auth
- **Database**: PostgreSQL
- **S3 Client**: AWS SDK v3
- **UI**: shadcn/ui, Tailwind CSS
- **Data Fetching**: TanStack Query

## Prerequisites

- [Bun](https://bun.sh) runtime
- Docker and Docker Compose
- S3-compatible storage (AWS S3, MinIO, etc.)

## Getting Started

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Copy the environment file and configure your settings:

```bash
cp .env.example .env
```

3. Start the development server (includes Docker services):

```bash
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server with Docker services |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun lint` | Run Biome linter |
| `bun format` | Format code with Biome |
| `bun db:migrate` | Run database migrations |
| `bun db:seed` | Seed the database |

## License

MIT
