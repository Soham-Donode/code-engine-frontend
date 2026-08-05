# Code Engine - Frontend

An interactive, modern web application for **Code Engine**, an online code execution platform. Built with Next.js (App Router), TypeScript, Tailwind CSS, Monaco Editor, and Supabase.

---

## 🚀 Features

- 💻 **Interactive Playground**: Multi-language code editor powered by Monaco Editor with syntax highlighting, custom themes, and instant code execution.
- 📊 **Dashboard**: Execution metrics, recent run history, language breakdown, and performance analytics.
- 🔐 **Authentication**: User authentication via Supabase (OAuth with GitHub/Google and Email/Password).
- 📚 **Documentation**: API guides, code engine architecture specs, and usage examples.
- 🌗 **Dark / Light Theme**: Dynamic theme toggle powered by `next-themes`.
- ⚡ **Real-time Output**: Live code execution output streaming and detailed diagnostic reports.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [tw-animate-css](https://github.com/jamiebuilds/tw-animate-css)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Base UI](https://base-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Authentication & Database**: [Supabase JS](https://supabase.com/docs) & `@supabase/ssr`
- **Toasts**: [Sonner](https://sonner.emilkowal.ski/)

---

## 📂 Directory Structure

```text
code-engine-frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/     # User dashboard and analytics page
│   │   ├── docs/          # Documentation and API reference
│   │   ├── playground/    # Code editor and execution playground
│   │   ├── globals.css    # Global styling and Tailwind directives
│   │   ├── layout.tsx     # Root layout component
│   │   └── page.tsx       # Landing / Home page
│   ├── components/        # Shared UI components (AuthModal, Navbar, ThemeProvider, etc.)
│   ├── context/           # React context providers
│   └── lib/               # Utility functions and Supabase client setup
├── public/                # Static assets
├── .env.local             # Local environment variables
└── package.json           # Project dependencies and scripts
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm**, **pnpm**, or **yarn**
- Running instance of **Code Engine Backend** (default: `http://localhost:8080`)

### Installation

1. Clone the repository and navigate to the frontend directory:

```bash
cd code-engine-frontend
```

2. Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the `code-engine-frontend` root directory with the following variables:

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
# Alternatively:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Running Locally

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `npm run dev` - Starts the development server with Hot Module Replacement.
- `npm run build` - Builds the application for production deployment.
- `npm run start` - Runs the compiled production build.
- `npm run lint` - Runs ESLint to check for code quality and formatting issues.

---

## 🔗 Backend Integration

The frontend connects to the **Code Engine Backend** service for compiling and running code snippets. Ensure your backend server is active and accessible via `NEXT_PUBLIC_API_BASE_URL`.

