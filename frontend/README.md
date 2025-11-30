# DM Companion - Frontend (Next.js)

This is the Next.js 14 App Router frontend for DM Companion, migrated from React + TanStack Router.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** Chakra UI
- **State Management:** TanStack React Query
- **Form Handling:** React Hook Form
- **HTTP Client:** Axios
- **Styling:** Emotion (via Chakra UI)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file based on `.env.local.example`:

```bash
cp .env.local.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (authenticated)/      # Protected routes (requires login)
│   │   ├── admin/            # Admin user management
│   │   ├── chat/             # AI chat interface
│   │   ├── settings/         # User settings
│   │   ├── layout.tsx        # Auth layout with sidebar
│   │   └── page.tsx          # Dashboard (chats list)
│   ├── login/                # Login page
│   ├── signup/               # Sign up page
│   ├── recover-password/     # Password recovery
│   ├── reset-password/       # Password reset
│   ├── layout.tsx            # Root layout with providers
│   ├── providers.tsx         # Chakra + React Query providers
│   └── page.tsx              # Root page (redirects to login)
├── client/                   # Auto-generated OpenAPI client
├── components/               # Reusable UI components
│   ├── Admin/                # Admin-specific components
│   ├── Common/               # Shared components (Sidebar, Navbar, etc.)
│   ├── Items/                # Item/Chat CRUD components
│   └── UserSettings/         # User settings components
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   └── useCustomToast.ts     # Toast notifications
├── theme.ts                  # Chakra UI theme configuration
└── utils.ts                  # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

Quick setup

1. Install dependencies

```bash
cd frontend2
npm install
```

2. Start development server

```bash
npm run dev
```

Notes

- Files under `src/app` use the Next.js App Router. Copy or port your existing React pages/components into `src/components` and `src/app/*` routes.
- Set backend base URL via `NEXT_PUBLIC_API_BASE_URL` in an `.env.local` file.

Example `.env.local`

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If you want, I can:

- copy selected components or routes from `frontend/` into this scaffold automatically
- convert a representative page (e.g. chat or login) end-to-end to show data fetching and auth integration
