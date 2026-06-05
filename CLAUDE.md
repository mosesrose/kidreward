# KidReward — Project Context for Claude Code

## What is KidReward?
A mobile app (React Native + Expo) that rewards children for homework, chores, and good behaviour.
Parents set challenges → Children complete them → Children earn Gems (💎) → Children redeem Gems for real rewards (money, gifts, screen time, activities).

Two modes: **Parent mode** (light theme, management) and **Child mode** (dark gamified theme).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile / Web | React Native + Expo SDK 51 |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| Backend | Supabase (Postgres 17 + Auth + RLS) |
| Source control | GitHub |

---

## Key Credentials & Services

### Supabase (Database + Auth)
- **Project URL:** https://nvrexzvpjklwfgvqcpoe.supabase.co
- **Region:** eu-west-2 (London)
- **Anon key:** in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Management API token:** see .secrets (local only, never commit)
- **Dashboard:** https://supabase.com/dashboard/project/nvrexzvpjklwfgvqcpoe

### GitHub
- **Repo:** https://github.com/mosesrose/kidreward
- **Main branch:** master

### Notion Workspace
- **Workspace:** Moshe Vered's Space
- **Integration token:** see .secrets (local only, never commit)
- **Integration name:** claude-code
- **Root page:** https://www.notion.so/376e3ac9e7f680e695d7eef2a0466435
- **Root page ID:** 376e3ac9-e7f6-80e6-95d7-eef2a0466435
- **API base URL:** https://api.notion.com/v1
- **API version header:** Notion-Version: 2022-06-28

#### Notion Workspace Structure
```
🌟 KidReward (root: 376e3ac9-e7f6-80e6-95d7-eef2a0466435)
├── 🎯 Strategy
│   ├── Vision & Mission
│   ├── Product Requirements (PRD)
│   └── Competitive Analysis
├── 📦 Product
│   ├── 🗺️ Roadmap (database — 19 items)
│   └── 📖 User Stories (database — 18 stories)
├── 🔧 Engineering
│   ├── Technical Architecture
│   ├── CI/CD Pipeline
│   └── Testing & QA Guide
├── 📣 Marketing
│   ├── Marketing Strategy
│   ├── App Store Listings
│   └── Content Calendar
├── 🚀 Releases
│   ├── v1.0 — MVP (done)
│   └── v1.1 — Engagement (planned)
└── 📊 Metrics & Goals
```

#### How to call Notion API
```bash
curl https://api.notion.com/v1/pages \
  -H "Authorization: Bearer see .secrets (local only, never commit)" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json"
```

### Google Drive
- **KidReward folder:** https://drive.google.com/drive/folders/1_zNn_AOgvFGaWcwr9XFbczlvrHnX-5vA
- Contains: PRD, User Stories, Technical Architecture, Roadmap, Testing & QA, CI/CD Pipeline, Marketing Strategy

---

## Project Structure

```
app/
├── _layout.tsx              Root layout (AuthProvider)
├── index.tsx                Smart redirect by role
├── (auth)/                  welcome, login, signup, complete-profile
├── (parent)/                dashboard, challenges/, children/, rewards/, redemptions
└── (child)/                 dashboard, join, challenges/, rewards/
lib/
└── supabase.ts              Supabase client + all TypeScript types
contexts/
└── AuthContext.tsx           Auth state, profile, family, gem membership
constants/
├── colors.ts                Design tokens (parent + child themes)
└── challenges.ts            14 challenge templates + category colours
scripts/
└── notion_setup.py          Script that built the Notion workspace
supabase/
└── schema.sql               Full DB schema (run this to recreate)
metro.config.js              Stubs @opentelemetry/api for web compatibility
```

---

## Database Schema (8 tables)

- **profiles** — id, name, role (parent/child), avatar_emoji
- **families** — id, name, parent_id
- **family_members** — family_id, child_id, gem_balance, total_gems_earned
- **invites** — family_id, code, expires_at, used_at (6-char, 7-day expiry, single-use)
- **challenges** — family_id, child_id (nullable=all children), title, category, emoji, gem_reward, bonus_gems, repeat_type (once/daily/weekly), status (active/completed/archived)
- **completions** — challenge_id, child_id, note, status (pending/approved/rejected), gems_awarded
- **rewards** — family_id, title, emoji, gem_cost, reward_type (money/gift/screen_time/activity)
- **redemptions** — reward_id, child_id, family_id, gems_spent, status (pending/fulfilled/rejected)

### Key DB Functions (SECURITY DEFINER — bypass RLS)
- `award_gems(child_id, family_id, gems)` — adds gems to balance + total_gems_earned
- `spend_gems(child_id, family_id, gems)` — deducts gems, raises exception if insufficient

---

## Running Locally

```powershell
cd C:\work\reward
npm install
npx expo start --web    # opens in browser at localhost:8081
npx expo start          # QR code for Expo Go on phone
```

TypeScript check: `npx tsc --noEmit`

---

## Design System

### Themes
- **Parent:** light (#F8F6FF bg, #FFFFFF cards, #6C3CE1 purple accent)
- **Child:** dark gamified (#1A0A3C bg, #2D1B69 cards, #00D4FF gem cyan, #FF6B35 orange accent)

### Gem Economy Rules
- `gem_balance` = current spendable balance (decreases on redemption)
- `total_gems_earned` = lifetime total (never decreases)
- Gem mutations are ALWAYS via Postgres RPC functions — never direct UPDATE

### Challenge Categories
phone, outdoor, social, family, morning, sibling, chores, room, garden, cooking, math, homework, behavior

---

## Key Architecture Notes

- RLS enforced at Postgres level — not application layer
- Web uses `localStorage` for auth sessions, native uses `AsyncStorage` (see lib/supabase.ts)
- `metro.config.js` stubs out `@opentelemetry/api` (optional Supabase dep not needed in RN)
- `EXPO_PUBLIC_` prefix required for env vars to be available in the client bundle
- Never expose `service_role` key in the frontend — anon key + RLS is the security model

---

## Current Status (June 2026)

- v1.0 MVP complete — coded, Supabase provisioned, GitHub pushed
- v1.1 planned Q3 2026 — push notifications, photo evidence, streaks
- v1.5 planned Q4 2026 — freemium subscription via Stripe / RevenueCat
- v2.0 planned Q1 2027 — sibling leaderboard, grandparent accounts, gift cards
