# Founders Stack

> Dump your thoughts. Get structured actions.

Founders Stack is an AI-powered action extraction tool built for startup founders. Paste messy notes, upload a WhatsApp chat, drop a PDF, or record a voice note — the AI extracts structured action items instantly and saves them to your personal dashboard.

---

## What It Does

Founders have too much going on. Investor calls, product bugs, team follow-ups, hiring — all living in their heads, WhatsApp threads, and scattered notes. Founders Stack converts that chaos into clear, prioritized action cards in seconds.

---

## Features

- **Multi-format input** — Text, Image, WhatsApp chat (.txt), PDF/DOCX, Voice notes
- **AI extraction** — Pulls out tasks, follow-ups, and reminders with priority, owner, urgency, and deadline
- **Smart prioritization** — Detects urgency from context ("still waiting", "tonight", "hasn't replied")
- **Action dashboard** — Filter by Urgent, Follow-ups, Reminders, Tasks, Snoozed, Done
- **Deadline tracking** — Color-coded cards: red (today), orange (1-3 days), gray (overdue)
- **Insights** — Charts showing action breakdown by type, priority, owner, and weekly trend
- **AI Console** — Chat with your actions. Ask "What's urgent today?" or "Summarize my week"
- **Auth** — Sign up / sign in with Supabase Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI Model | OpenRouter (Llama 3.3 70B) |
| Icons | Material Symbols |
| Font | Inter |

---

## Project Structure

```
founders-stack/
├── app/
│   ├── page.tsx                  # Redirects to /extract
│   ├── layout.tsx                # Root layout with BottomNav
│   ├── extract/page.tsx          # Extract page (main input)
│   ├── actions/page.tsx          # Actions dashboard
│   ├── insights/page.tsx         # Charts and insights
│   ├── console/page.tsx          # AI chat console
│   └── api/
│       ├── input/route.ts        # Extract actions from text
│       ├── console/route.ts      # AI console chat
│       ├── parse-whatsapp/route.ts
│       ├── parse-image/route.ts
│       ├── parse-document/route.ts
│       └── parse-voice/route.ts
├── components/
│   ├── BottomNav.tsx
│   └── BottomNavWrapper.tsx
└── lib/
    └── supabase.ts
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/founders-stack.git
cd founders-stack
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

Get your keys from:
- [supabase.com](https://supabase.com) → Project Settings → API
- [openrouter.ai](https://openrouter.ai) → Keys

### 3. Set up the database

Run this SQL in your Supabase SQL Editor:

```sql
create table actions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  owner text default 'Founder',
  priority text check (priority in ('high', 'medium', 'low')),
  due_date text,
  due_date_parsed timestamp with time zone,
  status text default 'todo' check (status in ('todo', 'done', 'snoozed')),
  type text default 'task' check (type in ('task', 'follow-up', 'reminder')),
  urgency text default 'normal' check (urgency in ('urgent', 'normal')),
  confidence float,
  raw_input text
);

create index if not exists idx_actions_priority on actions(priority);
create index if not exists idx_actions_type on actions(type);
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Input Formats Supported

| Format | How to use |
|---|---|
| Text | Type or paste directly |
| Image | Screenshot, whiteboard photo, handwritten notes |
| WhatsApp | Export chat → Without Media → upload .txt |
| PDF / DOCX | Drop any document |
| Voice | Upload .m4a, .mp3, .wav, .webm |

---

## Demo Test Input

```
Okay so a lot going on. Investor wants updated numbers by EOD tomorrow. 
Ali still hasn't sent the revised contract, someone needs to chase him. 
Not sure if we deployed the hotfix Sam pushed last night. 
Team is asking about the quarterly review meeting, no date set yet. 
Oh and the landing page copy feels off, maybe redesign it someday.
```

Expected output: 5 action cards with correct priorities, types, owners, and urgency.

---

## License

MIT
