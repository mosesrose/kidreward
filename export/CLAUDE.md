# KidReward — Project Context for Claude Code

## What is KidReward?
A mobile app (React Native + Expo) that rewards children for homework, chores, and good behaviour.
Parents set challenges → Children complete them → Children earn Gems (💎) → Children redeem Gems for real rewards (money, gifts, screen time, activities).

Two modes: **Parent mode** (light professional theme) and **Child mode** (dark gamified APYX LEGEND theme).

---

## Vision & Mission

**Vision:** To become the #1 app that families use to build lifelong positive habits in children — making parenting more rewarding and childhood more purposeful.

**Mission:** KidReward makes parenting more fun for everyone. Parents set challenges. Kids complete them. Everyone wins.

**Core values:**
- **Trust** — parents always approve before gems are awarded
- **Fun** — the app must feel like a game, not a chore tracker
- **Fairness** — children see exactly what they need to do and why
- **Privacy** — COPPA and GDPR compliant, no ads, no data selling

---

## Target Users

| Persona | Description |
|---------|-------------|
| **Parent** (primary) | Ages 28–50, 1–4 children, tech-comfortable, dual-income household |
| **Child** (secondary) | Ages 6–16 — the reward earners, motivated by game mechanics |
| **Market** | UK, Ireland, USA, Australia (English-speaking first) |

---

## Business Model

**Freemium SaaS.** Free tier hooks users; Premium unlocks full functionality.

| Tier | Price | Features |
|------|-------|---------|
| **Free** | $0 | 1 child, 3 active challenges, 3 active rewards, basic gem economy |
| **Premium Family** | $4.99/mo or $39.99/yr | Unlimited kids + challenges + rewards, streaks, photo evidence, push notifications, analytics |
| **Premium+** | $9.99/mo or $79.99/yr | Everything + gift card redemptions (Amazon, Roblox, Apple), grandparent accounts, multi-parent |

**Additional revenue (v2.0+):** Gift card marketplace (5–8% affiliate commission via Tango/Tremendous), brand partnerships.

**Positioning vs competitors:** GoHenry ($4.99/child), Greenlight ($5.99/family), BusyKid ($4/mo). KidReward uses per-family pricing (not per-child) as a sharp wedge, with stronger gamification.

**Unit economics targets:**
- CAC: $15–25 (paid); $5–10 (organic referral)
- Gross margin: ~85%
- LTV: $80–120 (avg 18-month retention)
- LTV:CAC ≥ 4:1 by month 18

---

## Success Metrics

**North Star:** Weekly Active Families (WAF) — families where ≥1 parent and ≥1 child are active in the same week.

| Metric | Target |
|--------|--------|
| Parents inviting ≥1 child within 24h | 60% |
| Children completing first challenge within 7 days | 70% |
| Avg challenges completed per child per week | ≥3 |
| Parent review time | <24 hours |
| Day 7 retention | >50% |
| Day 30 retention | >30% |
| Monthly churn | <5% |
| App Store rating | 4.5+ |
| Free → Premium conversion (D30) | 5–8% (v1.5+) |

---

## Product Roadmap

| Phase | Quarter | Key Features |
|-------|---------|-------------|
| **v1.0 MVP** ✅ | Q2 2026 | Parent + child roles, family invite, 14 challenge templates, gem economy, approval workflow, reward store |
| **v1.1 Engagement** | Q3 2026 | Push notifications, streak tracking + bonus gems, photo evidence on completions, weekly parent email report |
| **v1.5 Monetisation** | Q4 2026 | Freemium subscription (Stripe/RevenueCat), child levels + badges |
| **v2.0 Social** | Q1 2027 | Gift card marketplace, grandparent accounts, sibling leaderboard, AI-suggested challenges |

---

## Key P0 User Stories (all validated/done)

**Auth & Onboarding:**
- Parent signs up → family auto-created
- Child signs up via parent invite code only (no open child registration)
- Invite emails deep-link to signup with code pre-filled
- Both roles land on the correct dashboard after login

**Challenges:**
- Parent creates challenge from 14 templates or fully custom (title, category, gem reward, repeat type, assignee)
- Parent assigns challenge to all children or a specific child
- Child sees all active missions in one place
- Child submits "I Did It!" with optional note
- Parent approves or rejects; gems awarded automatically on approval

**Rewards:**
- Parent creates rewards (money, gift, screen time, activity)
- Parent controls which rewards are visible to children
- Child browses store and redeems with gems
- Parent marks reward as fulfilled

**Family:**
- Parent dashboard shows all children, pending approvals, gem totals, 4-week trend
- A family can have two parents (co-parent invite)
- Parent can see co-parents and manage their access

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile / Web | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| Backend | Supabase (Postgres 17 + Auth + RLS) |
| Deployment | Vercel (web static export) |
| Source control | GitHub |
| Push notifications | Expo Notifications |

---

## Key Credentials & Services

### Supabase (Database + Auth)
- **Project URL:** https://nvrexzvpjklwfgvqcpoe.supabase.co
- **Region:** eu-west-2 (London)
- **Anon key:** in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Management API token:** see `.secrets` (local only, never commit)
- **Dashboard:** https://supabase.com/dashboard/project/nvrexzvpjklwfgvqcpoe

### GitHub
- **Repo:** https://github.com/mosesrose/kidreward
- **Main branch:** master

### Vercel
- **Project:** `reward`
- **Project ID:** `prj_u7TjVBFCs1KR3YdXOT1xsd4mgiuF`
- **Org ID:** `team_4bK3OlSZF1ngwUWEr4Ao9Q3m`
- **Auto-deploy:** Connected to GitHub master branch

### Notion Workspace
- **Workspace:** Moshe Vered's Space
- **Integration token:** see `.secrets` as `NOTION_TOKEN`
- **Root page ID:** `376e3ac9-e7f6-80e6-95d7-eef2a0466435`
- **API base URL:** `https://api.notion.com/v1`  |  Header: `Notion-Version: 2022-06-28`
- **User Stories DB:** `376e3ac9-e7f6-815d-a738-c5199cae783d`
- **Roadmap DB:** `376e3ac9-e7f6-818c-a05e-eb789b186ba1`

### Google Drive
- **KidReward folder:** https://drive.google.com/drive/folders/1_zNn_AOgvFGaWcwr9XFbczlvrHnX-5vA

---

## Project Structure

```
app/
├── _layout.tsx              Root layout (AuthProvider + font loading)
├── index.tsx                Smart redirect by role
├── (auth)/                  welcome, login, signup-parent, signup-child, complete-profile
├── (parent)/                dashboard, challenges/, children/, rewards/, redemptions, goals/
└── (child)/                 home, join, challenges/, store/
components/
├── ActivityFeed.tsx         Recent activity list (parent dashboard)
├── CelebrationOverlay.tsx   Gem win animation (child)
├── GemHeader.tsx            Gem balance header (child screens)
├── ItemIcon.tsx             Dual-format icon: emoji char OR MaterialIcons name
└── ...
lib/
├── supabase.ts              Supabase client + all TypeScript types
├── notifications.ts         Push notification helpers
└── sounds.ts                Child mode sound effects
contexts/
└── AuthContext.tsx           Auth state, profile, family, gem membership
constants/
├── colors.ts                Design tokens (parent + child themes)
├── fonts.ts                 Font family name constants
├── challenges.ts            14 challenge templates + category colours
└── icons.ts                 MaterialIcons name lists for challenge/reward pickers
supabase/
└── schema.sql               Full DB schema (run this to recreate entire backend)
```

---

## Database Schema (8 tables)

- **profiles** — id, name, role (parent/child), avatar_emoji, push_token
- **families** — id, name, parent_id
- **family_members** — family_id, child_id, gem_balance, total_gems_earned
- **invites** — family_id, code, expires_at, used_at (6-char, 7-day expiry, single-use)
- **challenges** — family_id, child_id (nullable=all children), title, category, emoji, gem_reward, bonus_gems, repeat_type (once/daily/weekly), status (active/completed/archived)
- **completions** — challenge_id, child_id, note, status (pending/approved/rejected), gems_awarded
- **rewards** — family_id, title, emoji, gem_cost, reward_type (money/gift/screen_time/activity), is_active
- **redemptions** — reward_id, child_id, family_id, gems_spent, status (pending/fulfilled/rejected)

### Key DB Functions (SECURITY DEFINER — bypass RLS)
- `award_gems(p_child_id, p_family_id, p_gems)` — adds gems to balance + total_gems_earned
- `spend_gems(p_child_id, p_family_id, p_gems)` — deducts gems, raises exception if insufficient
- `update_streak(p_child_id, p_family_id)` — updates streak counter (v1.1)

---

## Design System (APYX LEGEND)

### Parent Theme (light professional)
- Background: `#f8f7f4` | Cards: `#ffffff` | Border: `#e8e4f0`
- Accent (sage green): `#7ca982` | Secondary bg: `#e8f0e9` | Secondary text: `#254f30`
- Text: `#1a1523` | Muted: `#9d8ba0`
- Fonts: SourceSerif4-SemiBold (headings), PlusJakartaSans (body)
- Cards: `borderRadius: 16`, soft shadow

### Child Theme (dark gaming — APYX LEGEND)
- Background: `#1a0b2e` | Cards: `#231437` | Border: `#bc13fe` (neon purple)
- Green (gems/success): `#2ff801` | Accent (cyan): `#00d4ff` | Dark: `#150629`
- Text: `#eddcff` | Muted: `#7a5f9a`
- Fonts: BricolageGrotesque-ExtraBold (display), PlusJakartaSans (body)
- Cards: `borderRadius: 0`, brutalist 4px offset shadow `#150629`

### Icon System
- The `emoji` DB column stores **MaterialIcons names** (e.g. `'cleaning-services'`, `'menu-book'`)
- Always use `<ItemIcon emoji={item.emoji} size={n} color={c} />` — never `<MaterialIcons>` directly on DB values
- `ItemIcon` auto-detects icon name vs emoji char and renders correctly

### Gem Economy Rules
- `gem_balance` = current spendable balance (decreases on redemption)
- `total_gems_earned` = lifetime total (never decreases)
- Gem mutations are **ALWAYS** via Postgres RPC functions — never direct UPDATE

---

## Running Locally

```bash
# Real data (needs .env)
npx expo start --web

# Mock mode (no Supabase needed)
EXPO_PUBLIC_USE_MOCK=true EXPO_PUBLIC_SUPABASE_URL=http://localhost EXPO_PUBLIC_SUPABASE_ANON_KEY=mock npx expo start --web --clear

# TypeScript check
npx tsc --noEmit
```

---

## Key Architecture Notes

- RLS enforced at Postgres level — not application layer
- Web uses `localStorage` for auth sessions, native uses `AsyncStorage` (see `lib/supabase.ts`)
- `metro.config.js` stubs out `@opentelemetry/api` (optional Supabase dep not needed in RN)
- `EXPO_PUBLIC_` prefix required for env vars to be available in the client bundle
- Never expose `service_role` key in the frontend — anon key + RLS is the security model
- MaterialIcons + MaterialCommunityIcons fonts are explicitly preloaded in `app/_layout.tsx` via `.font` property — required for web static export
- Push token stored in `profiles.push_token`; helper in `lib/notifications.ts`

---

## Current Status (June 2026)

- **v1.0 MVP complete** — all screens built with APYX LEGEND design, Supabase provisioned, deployed to Vercel via GitHub
- **v1.1 planned Q3 2026** — push notifications (partial, infra done), photo evidence, streaks, weekly email report
- **v1.5 planned Q4 2026** — freemium subscription via Stripe / RevenueCat
- **v2.0 planned Q1 2027** — gift card marketplace, grandparent accounts, sibling leaderboard, AI challenges
