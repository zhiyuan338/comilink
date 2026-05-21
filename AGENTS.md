# ComiLink Development Instructions

This is ComiLink, an NFC social exchange MVP.

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Product Rules
- MVP only.
- Do not add chat, feed, ranking, missions, OAuth, or registration.
- Users log in with QQ number and password.
- No public registration.
- Admin can import users and reset password to QQ number.
- NFC scan opens a user profile page and creates a collection relationship.

## Development Rules
- Read docs/ before implementing.
- Do not rewrite large parts unless necessary.
- Implement one feature at a time.
- Keep changes small and reviewable.
- After code changes, explain:
  1. changed files
  2. how to run
  3. how to test
  4. risks or TODOs

## Commands
- npm run dev
- npm run lint
- npx prisma validate