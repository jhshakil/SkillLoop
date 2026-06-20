# SkillLoop - Learning Management System

A modern, full-featured LMS built with Next.js 16, TypeScript, Tailwind CSS, and PostgreSQL. Designed for industry-standard online education with role-based access, course management, video lessons, comments, quizzes, notes, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix Primitives) |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| State | Zustand (client), React Query (server cache) |
| HTTP | Axios (server-side API calls) |
| Email | Nodemailer (Gmail SMTP for OTP) |
| Media | ImageKit (image uploads) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## Features

### Authentication & Roles
- **4 Roles**: Super Admin, Admin, Moderator, User
- **Google OAuth** + Email/Password login
- **OTP Email Verification** on signup (Gmail)
- **Forgot Password** with OTP reset flow
- **Change Password** from user settings
- Role-based route protection via Next.js Proxy

### Course Management
- Module-wise course structure (unlimited modules per course)
- Draft/Publish workflow for courses and videos
- Public and Private courses (approved email gate for private)
- Course thumbnails via ImageKit

### Video System
- YouTube video embedding (paste URL, auto-extracts ID)
- Optional per-video descriptions
- Bulk video ordering within modules

### Comments & Community
- Nested comments with unlimited reply depth
- Admin can toggle comments on/off per video
- Moderator badge displayed beside moderator replies
- Admin/Moderator can delete comments

### Quiz (MCQ)
- Per-video multiple choice questions
- Admin can create, edit, delete, draft/publish questions
- Users see correct/incorrect feedback with green highlights
- Correct answer revealed for wrong submissions

### Notes
- Users can take notes on any video
- Notes dashboard with search, pagination, date sorting, course filter
- Click to jump directly to video

### Notifications
- Real-time notifications for admins and moderators
- New comments, enrollments, and reply alerts
- Mark as read, mark all as read, click to navigate

### Analytics
- **Admin Dashboard**: Moderator activity (replies, comment deletions)
- **Super Admin Dashboard**: Admin activity (course CRUD, video additions, updates)
- Timestamped activity logs

### UI/UX
- Dark/Light theme with system preference detection
- Responsive sidebar with collapse toggle
- Toast notifications via Sonner
- Accessible components (shadcn/ui + Radix)

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9 (install: `npm i -g pnpm`)
- **PostgreSQL** >= 14 (running instance)
- **Gmail Account** with App Password (for OTP emails)
- **Google Cloud Console** project (for OAuth)
- **ImageKit** account (for image uploads)

## Getting Started

### 1. Clone and Install

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the required values:

```env
# Database (Required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillloop?schema=public"

# NextAuth (Required)
AUTH_SECRET="openssl-rand-base64-32-output"
AUTH_URL="http://localhost:3000"

# Google OAuth (Required)
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxxxxxxxxxxx"

# Super Admin - Auto-seeded on first run (Required)
SUPER_ADMIN_EMAIL="admin@skillloop.com"
SUPER_ADMIN_PASSWORD="StrongPassword@123"
SUPER_ADMIN_NAME="Super Admin"

# Gmail for OTP emails (Required for signup/forgot-password)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"

# ImageKit for image uploads (Optional - can add later)
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
IMAGEKIT_PUBLIC_KEY="public_xxxxxxxxxxxx"
IMAGEKIT_PRIVATE_KEY="private_xxxxxxxxxxxx"
```

### 3. Database Setup

```bash
# Push schema to PostgreSQL (creates all tables)
pnpm db:push

# Seed the Super Admin (creates the user from env vars)
pnpm db:seed

# (Optional) Open Prisma Studio to inspect data
pnpm db:studio
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env`

### 5. Gmail App Password Setup

1. Enable 2-Step Verification on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a password for "Mail" → "Other"
4. Copy the 16-character password to `.env` as `GMAIL_APP_PASSWORD`

### 6. Start Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database (no migrations) |
| `pnpm db:migrate` | Create and apply migrations |
| `pnpm db:seed` | Seed super admin from env |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Public auth pages
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration with OTP
│   │   └── forgot-password/    # Password reset flow
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── admin/              # Admin: courses, notifications, analytics
│   │   ├── super-admin/        # Super Admin: analytics, user management
│   │   ├── moderator/          # Moderator: notifications
│   │   └── user/               # User: dashboard, courses, notes, settings
│   └── api/                    # REST API routes
│       ├── auth/               # Auth endpoints (register, OTP, password)
│       ├── courses/            # Course CRUD
│       ├── modules/            # Module CRUD
│       ├── videos/             # Video CRUD
│       ├── comments/           # Comment system
│       ├── notes/              # User notes
│       ├── mcqs/               # Quiz system
│       ├── notifications/      # Notification management
│       ├── analytics/          # Activity logs
│       ├── enrollments/        # Course enrollment
│       └── imagekit/           # Image upload auth
├── components/
│   ├── ui/                     # shadcn/ui components (14 components)
│   └── layout/                 # Dashboard layout, sidebar, navbar
├── lib/                        # Utilities
│   ├── auth.ts                 # NextAuth configuration
│   ├── auth.config.ts          # Auth callbacks & providers
│   ├── prisma.ts               # Prisma client singleton
│   ├── api-client.ts           # Axios instance with interceptors
│   ├── email.ts                # Nodemailer Gmail transport
│   ├── imagekit.ts             # ImageKit configuration
│   └── utils.ts                # Helpers (cn, formatDate, extractYouTubeId)
├── providers/                  # React context providers
│   ├── theme-provider.tsx      # next-themes wrapper
│   └── query-provider.tsx      # React Query wrapper
├── stores/                     # Zustand stores
│   └── use-store.ts            # Global UI state (sidebar, theme)
├── types/                      # TypeScript types
│   ├── index.ts                # Shared interfaces
│   └── next-auth.d.ts          # NextAuth type augmentation
└── proxy.ts                    # Route protection middleware
```

## Database Schema

16 models covering the full domain:

| Model | Purpose |
|-------|---------|
| User | Account with role, approval status |
| Account | OAuth provider accounts |
| Session | Auth sessions |
| Course | Course with draft/publish, public/private |
| Module | Course sections with ordering |
| Video | YouTube lessons with comments toggle |
| Comment | Nested comments with reply chains |
| Note | Per-user, per-video notes |
| MCQQuestion | Quiz questions with options and correct answer |
| MCQSubmission | User quiz responses with correctness |
| Enrollment | Course enrollment tracking |
| Notification | Admin/moderator alerts |
| AdminActivity | Admin action logs (for super admin) |
| ModeratorActivity | Moderator action logs (for admin) |
| OtpToken | One-time passwords for email verification |
| ApprovedEmail | Whitelist for private course access |

## Role Permissions

| Feature | Super Admin | Admin | Moderator | User |
|---------|:-----------:|:-----:|:---------:|:----:|
| View analytics | Admin activity | Moderator activity | - | - |
| Create/Edit courses | ✓ | ✓ | - | - |
| Add videos | ✓ | ✓ | - | - |
| Manage MCQs | ✓ | ✓ | - | - |
| Toggle comments | ✓ | ✓ | - | - |
| Reply to comments | ✓ | ✓ | ✓ (badge shown) | ✓ |
| Delete comments | ✓ | ✓ | ✓ | - |
| View notifications | ✓ | ✓ | ✓ | - |
| Enroll in courses | ✓ | ✓ | ✓ | ✓ |
| Take notes | ✓ | ✓ | ✓ | ✓ |
| Submit quizzes | ✓ | ✓ | ✓ | ✓ |
| Change user roles | ✓ | - | - | - |
| Manage approved emails | ✓ | ✓ | - | - |

## Troubleshooting

### "no matching decryption secret" (Auth Error)
- Make sure `AUTH_SECRET` in `.env` is a proper value (not a placeholder)
- Generate one with: `openssl rand -base64 32`

### "table does not exist" (Prisma Error)
- Run `pnpm db:push` to create database tables
- Ensure `DATABASE_URL` in `.env` points to a running PostgreSQL instance

### "Failed to send OTP" 
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env`
- Ensure 2-Step Verification is enabled on the Gmail account
- Use an App Password, not the account password

### Google Login Not Working
- Confirm the redirect URI in Google Cloud Console matches `http://localhost:3000/api/auth/callback/google`
- Check `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are correct

### Build Errors
- Run `pnpm db:generate` to regenerate Prisma client
- Clear `.next` directory: `rm -rf .next`
- Run `pnpm install` to ensure all dependencies are installed

## License

MIT
