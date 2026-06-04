# KidReward 🏆

A mobile app for rewarding children for homework, chores, and good behaviour. Parents set challenges; kids complete them and earn **Gems 💎** that can be redeemed for real money, gifts, screen time, and more.

---

## Features

### Parent Mode
- Dashboard with kids overview and pending approvals
- Create challenges from 14 built-in templates or custom
- Invite children via a 6-character code (share via SMS/WhatsApp)
- Review and approve/reject challenge completions
- Set up rewards (money, gifts, screen time, activities)
- Manage reward redemption requests

### Child Mode
- Gamified dashboard with gem balance
- Mission board with all active challenges
- Mark challenges as done (with optional note)
- Browse and redeem rewards from the store
- Activity history

### Challenges included
| Emoji | Challenge | Type |
|-------|-----------|------|
| 📵 | Less screen time | Daily |
| 🌳 | Play outside | Daily |
| 👫 | Hang out with friends | Weekly |
| 👨‍👩‍👧‍👦 | Family time | Daily |
| 🌅 | Up early on a school day | Daily |
| 🤝 | Help a brother or sister | Daily |
| 🧹 | Help clean the house | Weekly |
| 🛏️ | Keep room tidy | Daily |
| 🌱 | Help in the garden | Weekly |
| 🍳 | Help prepare dinner | Daily |
| 🔢 | Math homework streak | Weekly |
| 📚 | Do homework early | Daily |
| ✅ | No missing homework | Weekly |
| 😌 | No yelling all day | Daily |

---

## Tech Stack

- **Frontend:** React Native + Expo (SDK 51)
- **Navigation:** Expo Router (file-based)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Language:** TypeScript

---

## Getting Started

### 1. Clone and install

```bash
cd C:\work\reward
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run the full contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the app

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## App Structure

```
app/
├── index.tsx                  # Splash / redirect
├── (auth)/
│   ├── welcome.tsx            # Landing screen
│   ├── login.tsx
│   ├── signup.tsx             # Role selection (parent/child)
│   └── complete-profile.tsx   # Avatar picker
├── (parent)/
│   ├── dashboard.tsx          # Parent home
│   ├── challenges/
│   │   ├── index.tsx          # All challenges
│   │   ├── create.tsx         # Create challenge
│   │   └── [id].tsx           # Review submissions
│   ├── children/
│   │   ├── index.tsx          # Kids list
│   │   └── invite.tsx         # Generate & share invite code
│   ├── rewards/
│   │   ├── index.tsx          # Rewards list
│   │   └── create.tsx         # Create reward
│   └── redemptions.tsx        # Approve/reject redemptions
└── (child)/
    ├── dashboard.tsx           # Child home with gem balance
    ├── join.tsx                # Enter invite code
    ├── challenges/
    │   ├── index.tsx           # Mission board
    │   └── [id].tsx            # Submit completion
    └── rewards/
        └── index.tsx           # Reward store
```

---

## User Flow

### Parent
1. Sign up → choose **Parent** role
2. A family is auto-created
3. Go to **My Kids → Invite** to generate a 6-character code
4. Share the code with your child
5. Create challenges via **Challenges → New**
6. When child submits, approve/reject under each challenge
7. Manage **Rewards** and approve redemption requests

### Child
1. Sign up → choose **Child** role
2. Enter the invite code from parent → join the family
3. See active missions on the dashboard
4. Tap a mission → "I Did It!" to submit
5. Earn gems once parent approves
6. Spend gems in the **Reward Store**

---

## Gem Economy (suggested values)

| Action | Gems |
|--------|------|
| Daily task | 10–15 |
| Weekly task | 20–50 |
| Streak bonus | +5–20 |
| £1 pocket money | 50 |
| 30 min screen time | 30 |
| Movie night pick | 60 |
| Small gift (£5) | 100 |

---

## Development Notes

- Row Level Security (RLS) is enabled on all tables — parents only see their family's data
- The `award_gems` and `spend_gems` functions run with `security definer` to safely modify balances
- Invite codes expire after 7 days and are single-use
- Add `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` before building (1024×1024 recommended)
