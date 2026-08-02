# Wacca - Event Platform

イベント主催者とキッチンカー・屋台出店者をマッチングするWebプラットフォーム。

## Architecture

モノレポ構成で3つの独立した Next.js アプリを持つ:

| App | Dir | Port | Theme | 対象 |
|-----|-----|------|-------|------|
| Store | `store/` | 3001 | Green (#10b981) | 出店者 (Exhibitor) |
| Organizer | `organizer/` | 3002 | Orange (#f97316) | 主催者 |
| Admin | `admin/` | 3000 | Blue | 管理者 |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS)
- **Auth**: Email/Password + LINE Login (OAuth)
- **AI**: OpenAI API (GPT-4o mini) — 営業許可証の自動読み取り (store のみ)
- **UI**: Lucide React (icons), clsx + tailwind-merge
- **Forms** (organizer): react-hook-form + zod
- **Deploy**: Vercel (3 separate projects, each with own Root Directory)
- **Font**: Noto Sans JP

## Project Structure

```
eventplatform/
├── store/          # 出店者アプリ (green)
├── organizer/      # 主催者アプリ (orange)
├── admin/          # 管理者アプリ (blue)
├── supabase/       # SQL migration scripts
├── design-screens/ # Static HTML design mockups (ds-, store-, org-, admin-)
└── package.json    # Workspace root (store + organizer)
```

各アプリ内の共通構造:
```
app/
├── api/auth/line/       # LINE OAuth routes
├── auth/callback/       # Supabase auth callback
├── login/, signup/      # Auth pages
├── onboarding/          # Initial profile setup
├── profile/             # Profile management
├── events/              # Event CRUD
├── applications/        # Application management
├── notifications/       # In-app notifications
├── globals.css          # Tailwind + theme CSS variables
├── layout.tsx           # Root layout
└── page.tsx             # Dashboard
components/
├── layout/              # Header, UserNav
├── ui/                  # Button, etc.
└── profile/             # ProfileForm, sidebars
lib/supabase/
├── server.ts            # Server-side Supabase client
├── middleware.ts         # Auth middleware
└── admin.ts             # Service role client (store/organizer)
```

## Development

```bash
# All apps (store + organizer)
npm run dev

# Individual
cd store && npm run dev      # localhost:3001
cd organizer && npm run dev  # localhost:3002
cd admin && npm run dev      # localhost:3000

# Design mockups
cd design-screens && python3 -m http.server 8888
```

## Environment Variables

各アプリの `.env.local` に設定:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=          # Vercel deploy URL (auth redirect)
LINE_CHANNEL_ID=              # LINE Login
LINE_CHANNEL_SECRET=
OPENAI_API_KEY=               # store only (document AI)
```

## Key Conventions

- PC-first design (1440px base), responsive
- No emoji in UI
- Japanese language throughout
- Supabase RLS for all data access
- `design-screens/` has static HTML mockups matching each app screen
