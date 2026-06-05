import urllib.request
import json

TOKEN = "see .secrets (local only, never commit)"
ROOT_ID = "376e3ac9-e7f6-80e6-95d7-eef2a0466435"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

def api(method, path, body=None):
    url = f"https://api.notion.com/v1{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        print(f"  ERROR {e.code}: {err.get('message','')}")
        return None

def page(parent_id, title, emoji, children=None):
    body = {
        "parent": {"page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {"title": [{"type": "text", "text": {"content": title}}]},
    }
    if children:
        body["children"] = children
    r = api("POST", "/pages", body)
    if r:
        print(f"  ✅ Created page: {title}")
        return r["id"]
    return None

def add_blocks(page_id, blocks):
    r = api("PATCH", f"/blocks/{page_id}/children", {"children": blocks})
    return r is not None

def h1(text):
    return {"object":"block","type":"heading_1","heading_1":{"rich_text":[{"type":"text","text":{"content":text}}]}}

def h2(text):
    return {"object":"block","type":"heading_2","heading_2":{"rich_text":[{"type":"text","text":{"content":text}}]}}

def h3(text):
    return {"object":"block","type":"heading_3","heading_3":{"rich_text":[{"type":"text","text":{"content":text}}]}}

def para(text, bold=False):
    return {"object":"block","type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":text},"annotations":{"bold":bold}}]}}

def bullet(text):
    return {"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"type":"text","text":{"content":text}}]}}

def numbered(text):
    return {"object":"block","type":"numbered_list_item","numbered_list_item":{"rich_text":[{"type":"text","text":{"content":text}}]}}

def callout(text, emoji="💡", color="yellow_background"):
    return {"object":"block","type":"callout","callout":{"rich_text":[{"type":"text","text":{"content":text}}],"icon":{"type":"emoji","emoji":emoji},"color":color}}

def divider():
    return {"object":"block","type":"divider","divider":{}}

def toggle(title, children=None):
    b = {"object":"block","type":"toggle","toggle":{"rich_text":[{"type":"text","text":{"content":title},"annotations":{"bold":True}}]}}
    if children:
        b["toggle"]["children"] = children
    return b

def database(parent_id, title, emoji, properties, rows=None):
    body = {
        "parent": {"page_id": parent_id},
        "icon": {"type": "emoji", "emoji": emoji},
        "title": [{"type": "text", "text": {"content": title}}],
        "properties": properties,
        "is_inline": False,
    }
    r = api("POST", "/databases", body)
    if r:
        db_id = r["id"]
        print(f"  ✅ Created database: {title}")
        if rows:
            for row in rows:
                api("POST", "/pages", {"parent": {"database_id": db_id}, "properties": row})
            print(f"     → Added {len(rows)} rows")
        return db_id
    return None

# ─────────────────────────────────────────────────────────────
print("\n🏗️  Building KidReward Notion Workspace...\n")

# ── 1. STRATEGY ──────────────────────────────────────────────
print("📌 Creating Strategy section...")
strategy_id = page(ROOT_ID, "Strategy", "🎯")

# Vision & Mission
page(strategy_id, "Vision & Mission", "🌟", [
    callout("Turn good habits into amazing rewards — the gamified family app.", "💎", "purple_background"),
    divider(),
    h2("Vision"),
    para("To become the #1 app that families use to build lifelong positive habits in children — making parenting more rewarding and childhood more purposeful."),
    divider(),
    h2("Mission"),
    para("KidReward makes parenting more fun for everyone. Parents set challenges. Kids complete them. Everyone wins."),
    divider(),
    h2("Values"),
    bullet("Trust — parents always approve before gems are awarded"),
    bullet("Fun — the app must feel like a game, not a chore tracker"),
    bullet("Fairness — children see exactly what they need to do and why"),
    bullet("Privacy — COPPA and GDPR compliant, no ads, no data selling"),
    divider(),
    h2("Problem"),
    para("Parents struggle to consistently motivate children to complete homework, help around the house, reduce screen time, and build healthy routines. Traditional approaches fail digital-native children."),
    divider(),
    h2("Solution"),
    para("Gamify good behaviour with a dual parent/child app: parents set challenges, children earn Gems (💎), and redeem them for real rewards — pocket money, gifts, screen time, activities."),
])

# PRD Summary
page(strategy_id, "Product Requirements (PRD)", "📋", [
    callout("Full PRD — see Google Drive for complete version.", "📁", "gray_background"),
    divider(),
    h2("Target Users"),
    bullet("Primary: Parents aged 28–50, 1–4 children, tech-comfortable"),
    bullet("Secondary: Children aged 6–16 — the reward earners"),
    bullet("Market: UK, Ireland, USA, Australia (English-speaking first)"),
    divider(),
    h2("Core Features"),
    h3("Parent Mode"),
    bullet("Dashboard: kids overview, pending approvals, gem totals"),
    bullet("Challenge creation: 14 templates or fully custom"),
    bullet("Invite code: 6-character code, shareable via SMS / WhatsApp"),
    bullet("Completion review: approve or reject with optional notes"),
    bullet("Reward management: money, gift, screen time, activity rewards"),
    h3("Child Mode"),
    bullet("Gamified dashboard: gem balance as hero element"),
    bullet("Mission board: all active challenges with colour coding"),
    bullet("Challenge submission: I Did It! + optional note"),
    bullet("Reward store: browse and redeem with gems"),
    divider(),
    h2("Success Metrics"),
    bullet("10,000 active families within 6 months"),
    bullet("70% of children complete ≥1 challenge per week"),
    bullet("80% of parents review within 24 hours"),
    bullet("4.5+ star rating on App Store and Google Play"),
    divider(),
    h2("Out of Scope (v1)"),
    bullet("Push notifications → v1.1"),
    bullet("Photo evidence → v1.1"),
    bullet("Subscription / payment → v1.5"),
    bullet("Sibling leaderboard → v2"),
    bullet("Grandparent accounts → v2"),
])

# Competitive Analysis
page(strategy_id, "Competitive Analysis", "🔍", [
    h2("Market Landscape"),
    para("KidReward sits between general family organiser apps and chore/allowance apps, with a unique gamified gem economy."),
    divider(),
    h2("Competitors"),
    toggle("OurPact — Screen time and chore management", [
        bullet("Strengths: Screen time controls, strong parent tools"),
        bullet("Weaknesses: Not gamified, no gem economy, feels restrictive"),
        bullet("Our edge: KidReward rewards positive behaviour vs. restricting bad behaviour"),
    ]),
    toggle("Greenlight — Pocket money debit card for kids", [
        bullet("Strengths: Real money management, debit card"),
        bullet("Weaknesses: Requires bank account, no challenge/habit system"),
        bullet("Our edge: More engaging habit loop, no financial setup required"),
    ]),
    toggle("BusyKid — Chores and allowance", [
        bullet("Strengths: Chore scheduling, real money integration"),
        bullet("Weaknesses: Boring UI, not gamified, US-only features"),
        bullet("Our edge: Superior child UX, gem economy, UK-first"),
    ]),
    toggle("Cozi / FamilyWall — Family organiser", [
        bullet("Strengths: Calendars, shopping lists, general family coordination"),
        bullet("Weaknesses: Not reward-focused, no engagement for children"),
        bullet("Our edge: Purpose-built for motivation and rewards"),
    ]),
    divider(),
    h2("Our Differentiators"),
    bullet("Gamified for kids — feels like a game, not a task manager"),
    bullet("Parent-first approval — parent always has final say"),
    bullet("Flexible rewards — money, gifts, screen time, and activities"),
    bullet("Web + mobile — works on any device without app installation"),
    bullet("Zero setup friction — invite code in under 60 seconds"),
])

# ── 2. PRODUCT ────────────────────────────────────────────────
print("\n📦 Creating Product section...")
product_id = page(ROOT_ID, "Product", "📦")

# Roadmap Database
roadmap_props = {
    "Name": {"title": {}},
    "Status": {"select": {"options": [
        {"name": "✅ Done", "color": "green"},
        {"name": "🔄 In Progress", "color": "blue"},
        {"name": "📅 Planned", "color": "yellow"},
        {"name": "💡 Idea", "color": "gray"},
    ]}},
    "Phase": {"select": {"options": [
        {"name": "v1.0 MVP", "color": "purple"},
        {"name": "v1.1 Engagement", "color": "blue"},
        {"name": "v1.5 Monetisation", "color": "orange"},
        {"name": "v2.0 Social", "color": "pink"},
    ]}},
    "Quarter": {"select": {"options": [
        {"name": "Q2 2026", "color": "green"},
        {"name": "Q3 2026", "color": "yellow"},
        {"name": "Q4 2026", "color": "orange"},
        {"name": "Q1 2027", "color": "red"},
    ]}},
    "Impact": {"select": {"options": [
        {"name": "High", "color": "red"},
        {"name": "Medium", "color": "yellow"},
        {"name": "Low", "color": "gray"},
    ]}},
    "Category": {"select": {"options": [
        {"name": "Auth", "color": "blue"},
        {"name": "Challenges", "color": "purple"},
        {"name": "Rewards", "color": "orange"},
        {"name": "Notifications", "color": "yellow"},
        {"name": "Monetisation", "color": "green"},
        {"name": "Social", "color": "pink"},
        {"name": "Infrastructure", "color": "gray"},
    ]}},
}

roadmap_rows = [
    {"Name":{"title":[{"text":{"content":"Parent + Child account roles"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Auth"}}},
    {"Name":{"title":[{"text":{"content":"Family invite code pairing"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Auth"}}},
    {"Name":{"title":[{"text":{"content":"14 challenge templates"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Custom challenge creation"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Completion approval workflow"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Gem economy (award + spend)"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Rewards"}}},
    {"Name":{"title":[{"text":{"content":"Reward store (4 types)"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Rewards"}}},
    {"Name":{"title":[{"text":{"content":"Supabase backend + RLS"}}]},"Status":{"select":{"name":"✅ Done"}},"Phase":{"select":{"name":"v1.0 MVP"}},"Quarter":{"select":{"name":"Q2 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Infrastructure"}}},
    {"Name":{"title":[{"text":{"content":"Push notifications"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.1 Engagement"}},"Quarter":{"select":{"name":"Q3 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Notifications"}}},
    {"Name":{"title":[{"text":{"content":"Photo evidence on completions"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.1 Engagement"}},"Quarter":{"select":{"name":"Q3 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Streak tracking + bonus gems"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.1 Engagement"}},"Quarter":{"select":{"name":"Q3 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Weekly parent email report"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.1 Engagement"}},"Quarter":{"select":{"name":"Q3 2026"}},"Impact":{"select":{"name":"Medium"}},"Category":{"select":{"name":"Notifications"}}},
    {"Name":{"title":[{"text":{"content":"Freemium subscription model"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.5 Monetisation"}},"Quarter":{"select":{"name":"Q4 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Monetisation"}}},
    {"Name":{"title":[{"text":{"content":"Stripe / RevenueCat integration"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.5 Monetisation"}},"Quarter":{"select":{"name":"Q4 2026"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Monetisation"}}},
    {"Name":{"title":[{"text":{"content":"Child levels and badges"}}]},"Status":{"select":{"name":"📅 Planned"}},"Phase":{"select":{"name":"v1.5 Monetisation"}},"Quarter":{"select":{"name":"Q4 2026"}},"Impact":{"select":{"name":"Medium"}},"Category":{"select":{"name":"Challenges"}}},
    {"Name":{"title":[{"text":{"content":"Sibling leaderboard"}}]},"Status":{"select":{"name":"💡 Idea"}},"Phase":{"select":{"name":"v2.0 Social"}},"Quarter":{"select":{"name":"Q1 2027"}},"Impact":{"select":{"name":"Medium"}},"Category":{"select":{"name":"Social"}}},
    {"Name":{"title":[{"text":{"content":"Grandparent accounts"}}]},"Status":{"select":{"name":"💡 Idea"}},"Phase":{"select":{"name":"v2.0 Social"}},"Quarter":{"select":{"name":"Q1 2027"}},"Impact":{"select":{"name":"Medium"}},"Category":{"select":{"name":"Auth"}}},
    {"Name":{"title":[{"text":{"content":"Gift card redemption"}}]},"Status":{"select":{"name":"💡 Idea"}},"Phase":{"select":{"name":"v2.0 Social"}},"Quarter":{"select":{"name":"Q1 2027"}},"Impact":{"select":{"name":"High"}},"Category":{"select":{"name":"Rewards"}}},
    {"Name":{"title":[{"text":{"content":"AI-suggested challenges"}}]},"Status":{"select":{"name":"💡 Idea"}},"Phase":{"select":{"name":"v2.0 Social"}},"Quarter":{"select":{"name":"Q1 2027"}},"Impact":{"select":{"name":"Medium"}},"Category":{"select":{"name":"Challenges"}}},
]
database(product_id, "Roadmap", "🗺️", roadmap_props, roadmap_rows)

# User Stories Database
stories_props = {
    "Story": {"title": {}},
    "Epic": {"select": {"options": [
        {"name": "Auth & Onboarding", "color": "blue"},
        {"name": "Family Pairing", "color": "purple"},
        {"name": "Challenges", "color": "orange"},
        {"name": "Rewards", "color": "green"},
        {"name": "Gem Economy", "color": "yellow"},
        {"name": "Future", "color": "gray"},
    ]}},
    "Priority": {"select": {"options": [
        {"name": "P0 — Must Have", "color": "red"},
        {"name": "P1 — Should Have", "color": "orange"},
        {"name": "P2 — Nice to Have", "color": "gray"},
    ]}},
    "Status": {"select": {"options": [
        {"name": "✅ Done", "color": "green"},
        {"name": "🔄 In Progress", "color": "blue"},
        {"name": "📅 Planned", "color": "yellow"},
    ]}},
    "Role": {"select": {"options": [
        {"name": "Parent", "color": "purple"},
        {"name": "Child", "color": "orange"},
        {"name": "Both", "color": "blue"},
    ]}},
}

stories_rows = [
    {"Story":{"title":[{"text":{"content":"Sign up as a parent and have a family auto-created"}}]},"Epic":{"select":{"name":"Auth & Onboarding"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Sign up as a child and pick an emoji avatar"}}]},"Epic":{"select":{"name":"Auth & Onboarding"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Log in and be redirected to the correct dashboard"}}]},"Epic":{"select":{"name":"Auth & Onboarding"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Both"}}},
    {"Story":{"title":[{"text":{"content":"Generate a 6-character invite code to share with my child"}}]},"Epic":{"select":{"name":"Family Pairing"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Enter an invite code to join my parent's family"}}]},"Epic":{"select":{"name":"Family Pairing"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"See all my children with their gem balances"}}]},"Epic":{"select":{"name":"Family Pairing"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Create a challenge from a pre-built template"}}]},"Epic":{"select":{"name":"Challenges"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Create a fully custom challenge"}}]},"Epic":{"select":{"name":"Challenges"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"See all my active missions in one place"}}]},"Epic":{"select":{"name":"Challenges"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Submit I Did It! with an optional note"}}]},"Epic":{"select":{"name":"Challenges"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Approve or reject a child's challenge submission"}}]},"Epic":{"select":{"name":"Challenges"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Create rewards children can buy with gems"}}]},"Epic":{"select":{"name":"Rewards"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Browse the reward store and redeem with gems"}}]},"Epic":{"select":{"name":"Rewards"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Mark a reward as fulfilled once delivered"}}]},"Epic":{"select":{"name":"Rewards"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Always see my gem balance on the dashboard"}}]},"Epic":{"select":{"name":"Gem Economy"}},"Priority":{"select":{"name":"P0 — Must Have"}},"Status":{"select":{"name":"✅ Done"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Receive push notification when child submits"}}]},"Epic":{"select":{"name":"Future"}},"Priority":{"select":{"name":"P1 — Should Have"}},"Status":{"select":{"name":"📅 Planned"}},"Role":{"select":{"name":"Parent"}}},
    {"Story":{"title":[{"text":{"content":"Attach a photo as evidence of challenge completion"}}]},"Epic":{"select":{"name":"Future"}},"Priority":{"select":{"name":"P1 — Should Have"}},"Status":{"select":{"name":"📅 Planned"}},"Role":{"select":{"name":"Child"}}},
    {"Story":{"title":[{"text":{"content":"Earn bonus gems for a 7-day daily streak"}}]},"Epic":{"select":{"name":"Future"}},"Priority":{"select":{"name":"P1 — Should Have"}},"Status":{"select":{"name":"📅 Planned"}},"Role":{"select":{"name":"Child"}}},
]
database(product_id, "User Stories", "📖", stories_props, stories_rows)

# ── 3. ENGINEERING ────────────────────────────────────────────
print("\n🔧 Creating Engineering section...")
eng_id = page(ROOT_ID, "Engineering", "🔧")

page(eng_id, "Technical Architecture", "🏗️", [
    callout("Stack: React Native + Expo SDK 51 | Supabase (Postgres + RLS) | TypeScript | GitHub", "⚙️", "blue_background"),
    divider(),
    h2("Architecture Overview"),
    para("CLIENT (React Native + Expo)"),
    bullet("Parent App — light theme, efficiency-first"),
    bullet("Child App — dark gamified theme"),
    bullet("Web / PWA — Expo web build"),
    bullet("AuthContext — shared session, profile, family, gem membership"),
    para("↕ HTTPS via Supabase JS Client"),
    para("BACKEND (Supabase — PostgreSQL 17 + Auth)"),
    bullet("Auth (JWT) — email + password, session stored in localStorage / AsyncStorage"),
    bullet("Postgres DB + Row Level Security — 8 tables, full RLS on all"),
    bullet("DB Functions — award_gems() and spend_gems() via SECURITY DEFINER"),
    divider(),
    h2("Database Tables"),
    bullet("profiles — id, name, role (parent/child), avatar_emoji"),
    bullet("families — id, name, parent_id"),
    bullet("family_members — family_id, child_id, gem_balance, total_gems_earned"),
    bullet("invites — family_id, code (unique), expires_at, used_at"),
    bullet("challenges — family_id, child_id (nullable), title, category, emoji, gem_reward, bonus_gems, repeat_type"),
    bullet("completions — challenge_id, child_id, note, status, gems_awarded"),
    bullet("rewards — family_id, title, emoji, gem_cost, reward_type"),
    bullet("redemptions — reward_id, child_id, family_id, gems_spent, status"),
    divider(),
    h2("Security Model"),
    bullet("RLS enforced at Postgres level — not application layer"),
    bullet("Gem mutations atomic via SECURITY DEFINER functions only"),
    bullet("Negative gem balance impossible — spend_gems() raises exception"),
    bullet("Invite codes expire in 7 days, single-use, cryptographically random"),
    bullet("Anon key safe on client — RLS is the enforcement layer"),
    divider(),
    h2("Key Links"),
    bullet("GitHub: github.com/mosesrose/kidreward"),
    bullet("Supabase: nvrexzvpjklwfgvqcpoe.supabase.co"),
    bullet("Region: eu-west-2 (London — GDPR compliant)"),
])

page(eng_id, "CI/CD Pipeline", "🚀", [
    callout("GitHub Actions for CI | Expo EAS for CD | Supabase CLI for migrations", "🔄", "blue_background"),
    divider(),
    h2("Branch Strategy"),
    bullet("feature/* — feature development, no auto-deploy"),
    bullet("main — stable code, triggers staging build on merge"),
    bullet("release/vX.X.X — triggers production build + App Store submit on tag"),
    para("Rules: Direct push to main is blocked. All changes via Pull Request with 1 reviewer + all CI checks passing."),
    divider(),
    h2("CI Pipeline — Every Pull Request"),
    numbered("Checkout code"),
    numbered("Setup Node.js 22 LTS"),
    numbered("npm ci — install dependencies"),
    numbered("npx tsc --noEmit — TypeScript check"),
    numbered("npx eslint . --max-warnings 0 — lint"),
    numbered("npx jest --ci --coverage — unit tests (70% coverage minimum)"),
    para("Estimated duration: 3–5 minutes"),
    divider(),
    h2("Staging Pipeline — On Merge to Main"),
    numbered("Run full CI"),
    numbered("Apply Supabase migrations to staging DB"),
    numbered("EAS build — preview profile (iOS + Android)"),
    numbered("Distribute to TestFlight internal + Play Store internal track"),
    numbered("Post Slack alert: New preview build ready"),
    divider(),
    h2("Production Pipeline — On Release Tag"),
    numbered("Run full CI"),
    numbered("Apply Supabase migrations to production DB"),
    numbered("EAS build — production profile"),
    numbered("EAS submit — iOS App Store"),
    numbered("EAS submit — Google Play"),
    numbered("Build + deploy web (Cloudflare Pages / Vercel)"),
    numbered("Create GitHub Release with changelog"),
    para("Estimated build time: 20–30 minutes"),
    divider(),
    h2("Required GitHub Secrets"),
    bullet("EXPO_PUBLIC_SUPABASE_URL"),
    bullet("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
    bullet("SUPABASE_SERVICE_ROLE_KEY — migration step only"),
    bullet("SUPABASE_ACCESS_TOKEN — Supabase CLI auth"),
    bullet("EAS_TOKEN — EAS builds and submit"),
    bullet("APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD — App Store"),
    bullet("GOOGLE_SERVICE_ACCOUNT_KEY — Play Store"),
])

page(eng_id, "Testing & QA Guide", "🧪", [
    callout("Run the full manual checklist on iOS + Android + Web before every release.", "⚠️", "red_background"),
    divider(),
    h2("Testing Layers"),
    bullet("Layer 1 — Unit tests (Jest): run on every commit via CI"),
    bullet("Layer 2 — E2E tests (Playwright / Detox): run before every release"),
    bullet("Layer 3 — Manual checklist: run by a human before App Store submission"),
    divider(),
    h2("Manual Pre-Release Checklist"),
    h3("A — Authentication"),
    bullet("New user can sign up as parent"),
    bullet("New user can sign up as child"),
    bullet("Login redirects to correct dashboard by role"),
    bullet("Session persists after closing and reopening app"),
    bullet("Sign out returns to welcome screen"),
    h3("B — Family Pairing"),
    bullet("Parent generates a 6-character invite code"),
    bullet("Invite code is shareable (Share sheet opens)"),
    bullet("Child enters code and joins family"),
    bullet("Parent sees child in My Kids list after joining"),
    bullet("Invalid / expired / used code shows clear error"),
    h3("C — Challenges"),
    bullet("Parent creates challenge from template"),
    bullet("Parent creates custom challenge"),
    bullet("Challenge appears in child's mission board"),
    bullet("Child submits I Did It! with optional note"),
    bullet("Child cannot submit again while pending"),
    bullet("Parent approves — gems awarded correctly"),
    bullet("Parent rejects — child sees rejection, no gems"),
    bullet("Child can re-submit after rejection"),
    h3("D — Rewards"),
    bullet("Parent creates all 4 reward types"),
    bullet("Affordable rewards shown brightly, unaffordable dimmed"),
    bullet("Child redeems reward — gems deducted"),
    bullet("Child cannot redeem if insufficient gems"),
    bullet("Parent fulfils redemption"),
    bullet("Parent rejects redemption — gems refunded"),
    h3("E — Gem Economy"),
    bullet("Gem balance updates immediately after approval"),
    bullet("Gem balance decreases immediately after redemption"),
    bullet("Gem balance never goes below zero"),
    bullet("Total gems earned never decreases"),
    h3("F — Edge Cases"),
    bullet("App works with no internet (cached data, no crash)"),
    bullet("Empty states shown correctly"),
    bullet("Challenge assigned to all children appears for all siblings"),
    bullet("Challenge assigned to one child NOT shown to other"),
    divider(),
    h2("Release Sign-Off Process"),
    numbered("All TypeScript errors resolved (tsc --noEmit passes)"),
    numbered("All unit tests passing (jest passes)"),
    numbered("Full manual checklist completed on iOS device"),
    numbered("Full manual checklist completed on Android device"),
    numbered("Web checklist completed on Chrome"),
    numbered("Code review approved on GitHub PR"),
    numbered("EAS build on TestFlight / Internal track — smoke test"),
    numbered("Release submitted to App Store / Google Play"),
])

# ── 4. MARKETING ──────────────────────────────────────────────
print("\n📣 Creating Marketing section...")
mkt_id = page(ROOT_ID, "Marketing", "📣")

page(mkt_id, "Marketing Strategy", "🎯", [
    callout("Tagline: Turn good habits into amazing rewards", "💬", "purple_background"),
    divider(),
    h2("Positioning"),
    bullet("For parents: Finally, a system that actually works"),
    bullet("For children: Your effort = real rewards. No waiting, no forgetting"),
    bullet("Category: between family organiser apps and allowance apps — with gamification"),
    divider(),
    h2("Target Segments"),
    toggle("Primary — Parents aged 28–42 (High priority)", [
        bullet("Tech-comfortable, 2–3 children, frustrated with manual chore charts"),
        bullet("Willing to pay for a solution that works"),
        bullet("Channels: Instagram Reels, Facebook Groups, word of mouth"),
    ]),
    toggle("Secondary — Parents aged 42–55 (Medium priority)", [
        bullet("Less tech-savvy, motivated by school homework specifically"),
        bullet("Need simpler onboarding and setup"),
        bullet("Channels: Facebook, email, school newsletters"),
    ]),
    divider(),
    h2("Channel Strategy"),
    h3("Organic Social"),
    bullet("Instagram: 4x/week — 2 Reels + 2 Stories (parent transformation content)"),
    bullet("TikTok: 5x/week — viral challenge content, kid reactions, relatable parenting"),
    bullet("Facebook: 3x/week — Groups (parenting, ADHD, family organising)"),
    h3("Paid Ads (Month 3–6 Budget: £2,000/month)"),
    bullet("Facebook / Instagram: £1,200/mo — video ads, carousel, UGC-style"),
    bullet("TikTok Ads: £500/mo — short-form, trend-led"),
    bullet("Google App campaigns: £300/mo — intent-based"),
    h3("Influencer Marketing"),
    bullet("Nano (5K–20K followers): gifted — authentic, high trust"),
    bullet("Micro (20K–100K): £100–£300/post — best ROI for family apps"),
    bullet("Focus: family lifestyle, home organisation, ADHD parenting"),
    h3("App Store Optimisation (ASO)"),
    bullet("iOS name: KidReward — Chores & Rewards"),
    bullet("Subtitle: Earn Gems for Good Habits"),
    bullet("Keywords: chores, pocket money, kids, reward chart, homework tracker"),
    bullet("Rating prompt: after first parent approval (highest intent moment)"),
    h3("SEO & Content"),
    bullet("Target: chore chart app for kids, reward chart app, pocket money app uk"),
    bullet("Publish 2 blog articles/week targeting informational keywords"),
    h3("Email Marketing"),
    bullet("Welcome series → setup guide → first challenge ideas"),
    bullet("Re-engagement at day 7 if no activity"),
    bullet("Premium upsell when child completes 5 tasks"),
    divider(),
    h2("6-Month Budget"),
    bullet("Paid social (Meta / TikTok): £8,000"),
    bullet("Google App campaigns: £1,500"),
    bullet("Influencer outreach: £3,000"),
    bullet("Content / SEO: £2,000"),
    bullet("Design (ads, ASO): £1,500"),
    bullet("Email tool + App Store fees: £480"),
    bullet("TOTAL: £16,480"),
    divider(),
    h2("Key Metrics"),
    bullet("CPI (Cost per Install) — target < £1.50"),
    bullet("CPA (Cost per Active Family) — target < £5.00"),
    bullet("D7 retention — target > 50%"),
    bullet("D30 retention — target > 30%"),
    bullet("Free → Premium conversion — target 15%"),
])

page(mkt_id, "App Store Listings", "📱", [
    h2("iOS App Store"),
    h3("Name"),
    para("KidReward — Chores & Rewards"),
    h3("Subtitle"),
    para("Earn Gems for Good Habits"),
    h3("Keywords"),
    para("chores, pocket money, kids, reward chart, homework tracker, family organiser, allowance, behaviour, parenting"),
    h3("Short Description"),
    para("Reward your kids for chores, homework and good behaviour with Gems"),
    h3("Full Description"),
    para("KidReward makes parenting more fun — for everyone."),
    para("Parents set challenges. Kids complete them. Everyone wins."),
    para("FOR PARENTS — Create personalised challenges in seconds from our library of 14 ready-to-use tasks or build your own. Review your child's submissions and approve with one tap. You stay in control."),
    para("FOR KIDS — Earn Gems for every challenge you complete. Watch your balance grow. Spend Gems in the Reward Store on real things — screen time, pocket money, a trip to the park, or that toy you've been wanting."),
    para("CHALLENGES INCLUDE: Less phone time, more outdoor time, family time, helping with dinner, keeping your room tidy, homework streaks, being kind to siblings, no yelling — and many more."),
    para("EASY FAMILY SETUP — Parents generate a 6-character invite code. Kids enter it in seconds. No complex account linking."),
    divider(),
    h2("Screenshots Priority Order"),
    numbered("Child dashboard — gem balance hero (emotional hook)"),
    numbered("Mission board — shows product value"),
    numbered("Parent approval screen — builds parent trust"),
    numbered("Reward store — shows what gems unlock"),
    numbered("Family pairing — shows simplicity"),
])

page(mkt_id, "Content Calendar", "📅", [
    callout("Plan social posts 2 weeks ahead. Update this page each Monday.", "📌", "yellow_background"),
    divider(),
    h2("Content Pillars"),
    bullet("Transformation — before KidReward vs. after (parent perspective)"),
    bullet("Product demo — how it works in 60 seconds"),
    bullet("UGC / social proof — real families, real gem balances"),
    bullet("Tips — parenting hacks, challenge ideas, reward inspiration"),
    bullet("Milestones — app updates, feature launches"),
    divider(),
    h2("Top Content Ideas"),
    toggle("Instagram Reels", [
        bullet("How I finally got my kids to clean their room 🛏️"),
        bullet("Week 1 vs Week 4 using KidReward"),
        bullet("14 challenges to try this week with your kids"),
        bullet("My 8-year-old spent 2,000 gems on this reward 😂"),
    ]),
    toggle("TikTok", [
        bullet("Kid's reaction to seeing their gem balance 💎"),
        bullet("I tried this parenting app for 30 days — here's what happened"),
        bullet("Homework done without being asked??? 👀"),
        bullet("The reward my son saved 500 gems for..."),
    ]),
    toggle("Facebook Groups", [
        bullet("Post in parenting groups: Any parents using reward apps?"),
        bullet("Share milestone: Son earned his first £5 via KidReward!"),
        bullet("Share tips: We use the morning challenge every school day"),
    ]),
])

# ── 5. RELEASES ───────────────────────────────────────────────
print("\n🚀 Creating Releases section...")
releases_id = page(ROOT_ID, "Releases", "🚀")

page(releases_id, "v1.0 — MVP", "✅", [
    callout("Released — Q2 2026. Core loop fully working end-to-end.", "✅", "green_background"),
    divider(),
    h2("What shipped"),
    bullet("Parent + Child account roles with role-based dashboards"),
    bullet("Family creation and invite code pairing"),
    bullet("14 challenge templates across 13 categories"),
    bullet("Custom challenge creation with repeat types"),
    bullet("Child mission board with category colour coding"),
    bullet("Completion submission with optional note"),
    bullet("Parent approval / rejection workflow"),
    bullet("Gem award on approval — atomic Postgres RPC"),
    bullet("Reward store with 4 reward types"),
    bullet("Reward redemption and fulfilment workflow"),
    bullet("Gem deduction — atomic, no negative balance possible"),
    bullet("Supabase backend with full Row Level Security"),
    bullet("Web version via Expo"),
    bullet("GitHub repository: github.com/mosesrose/kidreward"),
    bullet("Supabase project: nvrexzvpjklwfgvqcpoe.supabase.co"),
    divider(),
    h2("Known Issues"),
    para("None currently — initial MVP release."),
    divider(),
    h2("Next: v1.1"),
    bullet("Push notifications"),
    bullet("Photo evidence on completions"),
    bullet("Streak tracking"),
])

page(releases_id, "v1.1 — Engagement (Planned)", "📅", [
    callout("Target: Q3 2026. Focus: increase child engagement and reduce parent friction.", "📅", "yellow_background"),
    divider(),
    h2("Planned Features"),
    bullet("Push notifications — parent on submission, child on review"),
    bullet("Photo evidence — child attaches photo to completion"),
    bullet("Streak tracking — 7-day streak = bonus gems"),
    bullet("Weekly parent email summary"),
    bullet("Challenge due dates"),
    bullet("Improved onboarding with guided tour"),
    divider(),
    h2("Success Criteria"),
    bullet("D7 retention improves by 15%"),
    bullet("Parent review time drops below 12 hours (from 24h target)"),
    bullet("70%+ of children use the streak feature"),
])

# ── 6. METRICS ────────────────────────────────────────────────
print("\n📊 Creating Metrics section...")
metrics_id = page(ROOT_ID, "Metrics & Goals", "📊")

add_blocks(metrics_id, [
    callout("Update weekly. These are the numbers that matter.", "📈", "green_background"),
    divider(),
    h2("North Star Metric"),
    para("Weekly Active Families (WAF) — the number of families where at least one parent and one child are active in the same week."),
    divider(),
    h2("Activation"),
    bullet("% parents who invite ≥1 child within 24h of signup → target 60%"),
    bullet("% children who complete first challenge within 7 days → target 70%"),
    divider(),
    h2("Engagement"),
    bullet("Avg challenges completed per child per week → target ≥3"),
    bullet("Parent review time → target <24 hours"),
    bullet("WAF growth month-over-month → increasing"),
    divider(),
    h2("Retention"),
    bullet("Day 7 retention → target >50%"),
    bullet("Day 30 retention → target >30%"),
    bullet("Monthly churn rate → target <5%"),
    divider(),
    h2("Quality"),
    bullet("App Store rating → target 4.5+"),
    bullet("Crash-free rate → target >99%"),
    divider(),
    h2("Monetisation (from v1.5)"),
    bullet("Free → Premium conversion → target 15%"),
    bullet("MRR growth MoM → target +20%"),
    bullet("LTV per family → track from launch"),
    divider(),
    h2("Marketing"),
    bullet("CPI (Cost per Install) → target <£1.50"),
    bullet("CPA (Cost per Active Family) → target <£5.00"),
    bullet("Email open rate → target >30%"),
])

print("\n✅ KidReward Notion workspace fully built!")
print(f"🔗 Open: https://www.notion.so/{ROOT_ID.replace('-','')}")
