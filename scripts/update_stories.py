import os
import urllib.request, json

TOKEN = "os.environ.get("NOTION_TOKEN", "see .secrets")"
HEADERS = {
    "Authorization": "Bearer " + TOKEN,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def api(method, path, body=None):
    url = "https://api.notion.com/v1" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print("  ERR {}: {}".format(e.code, json.loads(e.read()).get("message", "")))
        return None

# page_id -> (status, test_result_note)
updates = {
    # AUTH & ONBOARDING
    "376e3ac9-e7f6-8113-84cf-d9ecce7c2be2": (
        "Validated",
        "signup.tsx: role selector works, profile insert confirmed, family auto-created for parent. Tested against profiles + families tables in Supabase."
    ),
    "376e3ac9-e7f6-81bf-adc3-ef73fc11385a": (
        "Validated",
        "signup.tsx sets avatar_emoji to default 🧒. complete-profile.tsx shows 12 emoji grid, saves to profiles table."
    ),
    "376e3ac9-e7f6-819e-9ebe-ef678d2583be": (
        "Validated",
        "index.tsx: profile.role=parent -> /(parent)/dashboard, child -> /(child)/home. Session persists via AsyncStorage (native) / localStorage (web)."
    ),
    # FAMILY PAIRING
    "376e3ac9-e7f6-81c2-af5a-fb887732a147": (
        "Validated",
        "invite.tsx: generateCode() returns 6-char alphanumeric. Inserts into invites table with 7-day expiry. Share sheet opens via Share.share()."
    ),
    "376e3ac9-e7f6-819a-ad90-efbaa3bcc91a": (
        "Validated",
        "join.tsx: validates code, queries invites (unused + not expired), inserts family_members row, marks invite used. Duplicate join caught via 23505 error."
    ),
    "376e3ac9-e7f6-8100-b6dd-f95d0b47f033": (
        "Validated",
        "children/index.tsx: fetches family_members with profiles join. Displays gem_balance and total_gems_earned per child in stat cards."
    ),
    # CHALLENGES
    "376e3ac9-e7f6-81fa-9786-ec7d75f2fe77": (
        "Validated",
        "challenges/create.tsx: CHALLENGE_TEMPLATES (14 items) displayed horizontally. Tapping fills all fields automatically. All fields customisable before saving."
    ),
    "376e3ac9-e7f6-814e-a0a8-c3bc4849612c": (
        "Validated",
        "challenges/create.tsx: title, description, emoji, gem_reward, bonus_gems, repeat_type all editable. Inserts into challenges with family_id and created_by."
    ),
    "376e3ac9-e7f6-8154-913c-df2b553b6714": (
        "Validated",
        "child challenges/index.tsx: fetches active challenges for family. Filters child_id=mine OR null (all). Completed ones shown with green tick. Repeat type shown as tag."
    ),
    "376e3ac9-e7f6-812b-b6d5-c75fff356ffc": (
        "Validated",
        "child challenges/[id].tsx: optional note TextInput. submit() inserts completions row (status=pending). Button disabled while pending or approved. Re-submit allowed after rejection."
    ),
    "376e3ac9-e7f6-81f3-a7e3-d76d35d0e03b": (
        "Validated",
        "parent challenges/[id].tsx: approve() calls award_gems RPC (atomic) + updates status=approved. reject() sets status=rejected. Child note visible before deciding."
    ),
    # REWARDS
    "376e3ac9-e7f6-81ac-843b-ddadbd67d73a": (
        "Validated",
        "rewards/create.tsx: 4 types (money/gift/screen_time/activity). Suggestion templates available. Inserts into rewards table. is_active defaults true."
    ),
    "376e3ac9-e7f6-8117-90b4-caee530e135e": (
        "Validated",
        "child rewards/index.tsx: canAfford = gem_balance >= gem_cost. Affordable = bright, unaffordable = dimmed. Redeem calls spend_gems RPC (atomic). Inserts redemption row."
    ),
    "376e3ac9-e7f6-8110-aa1d-d36024ae5706": (
        "Validated",
        "redemptions.tsx: fulfill() sets fulfilled + fulfilled_at. reject() sets rejected AND calls award_gems to refund gems. Both update redemptions table correctly."
    ),
    # GEM ECONOMY
    "376e3ac9-e7f6-8170-9ddd-cc4a81747ae3": (
        "Validated",
        "child home.tsx: membership.gem_balance shown as 52px hero number at top of dashboard. refreshFamily() re-fetches family_members. total_gems_earned also shown."
    ),
    # PLANNED (unchanged)
    "376e3ac9-e7f6-8158-b872-d8b539535cbe": (
        "Planned",
        "v1.1 - Requires Expo push notification setup + server-side trigger on completion insert."
    ),
    "376e3ac9-e7f6-8180-9508-d06e9bf9e6d3": (
        "Planned",
        "v1.1 - Requires Expo ImagePicker + Supabase Storage bucket for photo uploads."
    ),
    "376e3ac9-e7f6-8185-bd23-cba2f4f56fa4": (
        "Planned",
        "v1.1 - Requires streak tracking logic: check consecutive daily completions per challenge per child."
    ),
    # USER-ADDED STORIES
    "376e3ac9-e7f6-80eb-b8bf-d0a86b0410e8": (
        "Failed",
        "SCHEMA GAP FOUND: invite.tsx was updated with invite_type (child/parent tabs) but invites table has no invite_type column. Needs migration: ALTER TABLE invites ADD COLUMN invite_type text NOT NULL DEFAULT 'child' CHECK (invite_type IN ('child','parent')). Must fix before release."
    ),
    "376e3ac9-e7f6-80c1-950d-e7f059e07f49": (
        "Validated",
        "rewards/index.tsx updated with Switch toggle for is_active per reward. toggleActive() updates DB instantly with optimistic UI. RLS policy on child side already filters is_active=true only."
    ),
    "376e3ac9-e7f6-80fd-9606-cd470355c3f4": (
        "Planned",
        "v1.1 - Requires push notification infrastructure. Parent selects which pending tasks to send reminder for."
    ),
    "376e3ac9-e7f6-80e0-8356-f5e16dce470d": (
        "Planned",
        "v2.0 - Super-challenge = group of sub-challenges unlocking a bonus reward when all complete. Needs parent_challenge_id FK on challenges table."
    ),
    "376e3ac9-e7f6-80e9-a8dd-c7e854074492": (
        "Planned",
        "Story needs more detail before implementation can begin."
    ),
}

STATUS_MAP = {
    "Validated": "Validated",
    "Failed": "Failed",
    "Planned": "Planned",
    "Testing": "Testing",
}

NOTION_STATUS = {
    "Validated": "Validated",
    "Failed": "Failed",
    "Planned": "Planned",
    "Testing": "Testing",
}

print("\nUpdating {} user stories in Notion...\n".format(len(updates)))
ok = fail = 0

for page_id, (status_key, note) in updates.items():
    # Map to actual option name in Notion
    notion_status = {
        "Validated": "Validated",
        "Failed": "Failed",
        "Planned": "Planned",
        "Testing": "Testing",
    }[status_key]

    r = api("PATCH", "/pages/" + page_id, {
        "properties": {
            "Status": {"select": {"name": notion_status}}
        }
    })

    icon = {"Validated": "✔️ ", "Failed": "❌ ", "Planned": "📅 ", "Testing": "🧪 "}[status_key]
    if r:
        print("  {} {} — {}".format(icon, notion_status, page_id[:8]))
        ok += 1

        # Append test note as a callout block to the page
        emoji = {"Validated": "✅", "Failed": "❌", "Planned": "📅", "Testing": "🧪"}[status_key]
        color = {"Validated": "green_background", "Failed": "red_background", "Planned": "yellow_background", "Testing": "orange_background"}[status_key]
        api("PATCH", "/blocks/" + page_id + "/children", {
            "children": [{
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [{"type": "text", "text": {"content": "Test result: " + note}}],
                    "icon": {"type": "emoji", "emoji": emoji},
                    "color": color
                }
            }]
        })
    else:
        fail += 1

print("\nDone: {} updated, {} failed".format(ok, fail))
if fail > 0:
    print("Check errors above.")
