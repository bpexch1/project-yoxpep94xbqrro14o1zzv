# AI Gateway / AI SDK example

This repository uses Bun (see `bun.lock`). The root `index.ts` is a **server-side CLI example**, not part of the browser Vite bundle.

## Local setup

1. Install Bun, if needed.
2. Run `bun install --frozen-lockfile`.
3. Copy `.env.local.example` to `.env.local` using `cp .env.local.example .env.local`.
4. In a **local editor**, set `AI_GATEWAY_API_KEY` in `.env.local` using an AI Gateway API key created from the Vercel dashboard: https://vercel.com/docs/ai-gateway/getting-started
5. Run `bun index.ts` from the project root.

Bun automatically loads `.env.local`. The example calls `moonshotai/kimi-k3` through AI Gateway using `generateText` from `ai`, then prints its generated holiday and traditions. A successful end-to-end test requires that text to appear in the terminal.

**Security:** Never check in `.env.local`, print the key, paste the key into chat, or prefix the key with `VITE_`. Client-side Vite code must never hold the server-side AI Gateway key.

**Troubleshooting:** If authentication fails, check local key setup without exposing the value. Gateway usage may incur charges.
