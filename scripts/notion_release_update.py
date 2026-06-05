"""
notion_release_update.py
Called by GitHub Actions after each release tag.
Creates a test round summary page in Notion under Releases.

Usage:
  python3 scripts/notion_release_update.py \
    --version v1.0.1 \
    --ts success \
    --unit success \
    --schema success \
    --overall passed
"""
import os, sys, json, urllib.request, argparse
from datetime import datetime, timezone

TOKEN = os.environ.get("NOTION_TOKEN", "")
ROOT_ID = os.environ.get("NOTION_ROOT_PAGE_ID", "376e3ac9-e7f6-80e6-95d7-eef2a0466435")
HEADERS = {
    "Authorization": "Bearer " + TOKEN,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

def api(method, path, body=None):
    url = "https://api.notion.com/v1" + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print("API error {}: {}".format(e.code, e.read().decode()))
        return None

def find_releases_page():
    """Find the Releases sub-page under root."""
    r = api("POST", "/search", {
        "query": "Releases",
        "filter": {"value": "page", "property": "object"}
    })
    if not r:
        return None
    for result in r.get("results", []):
        title = result.get("properties", {}).get("title", {}).get("title", [])
        if title and "Releases" in title[0].get("plain_text", ""):
            return result["id"]
    return None

def find_stories_db():
    """Find the User Stories database."""
    r = api("POST", "/search", {
        "query": "User Stories",
        "filter": {"value": "database", "property": "object"}
    })
    if not r:
        return None
    for result in r.get("results", []):
        title = result.get("title", [])
        if title and "User Stories" in title[0].get("plain_text", ""):
            return result["id"]
    return None

def get_done_stories(db_id, statuses=("Validated",)):
    """Fetch all stories with given statuses."""
    results = []
    for status in statuses:
        r = api("POST", "/databases/{}/query".format(db_id), {
            "filter": {"property": "Status", "select": {"equals": status}}
        })
        if r:
            results.extend(r.get("results", []))
    return results

def icon(result):
    return "✅" if result == "success" else "❌"

def status_color(result):
    return "green_background" if result == "success" else "red_background"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--ts", required=True)
    parser.add_argument("--unit", required=True)
    parser.add_argument("--schema", required=True)
    parser.add_argument("--overall", required=True)
    args = parser.parse_args()

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    passed = args.overall == "passed"

    print("Creating Notion test round for {}...".format(args.version))

    # Find Releases page
    releases_id = find_releases_page()
    if not releases_id:
        print("Could not find Releases page — creating under root.")
        releases_id = ROOT_ID

    # Find User Stories DB
    db_id = find_stories_db()
    validated_stories = get_done_stories(db_id, ("Validated",)) if db_id else []
    planned_stories = get_done_stories(db_id, ("Planned",)) if db_id else []
    failed_stories = get_done_stories(db_id, ("Failed",)) if db_id else []

    def story_title(s):
        titles = s.get("properties", {}).get("Story", {}).get("title", [])
        return titles[0]["plain_text"] if titles else "Untitled"

    # Build blocks for the release test page
    overall_emoji = "✅" if passed else "❌"
    overall_color = "green_background" if passed else "red_background"
    overall_text = "PASSED — All checks passed for {}".format(args.version) if passed \
                   else "FAILED — One or more checks failed for {}".format(args.version)

    blocks = [
        {"object":"block","type":"callout","callout":{
            "rich_text":[{"type":"text","text":{"content":overall_text}}],
            "icon":{"type":"emoji","emoji":overall_emoji},
            "color":overall_color
        }},
        {"object":"block","type":"paragraph","paragraph":{
            "rich_text":[{"type":"text","text":{"content":"Run at: {}".format(now)},
                          "annotations":{"color":"gray"}}]
        }},
        {"object":"block","type":"divider","divider":{}},
        {"object":"block","type":"heading_2","heading_2":{
            "rich_text":[{"type":"text","text":{"content":"CI Check Results"}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"{} TypeScript check: {}".format(icon(args.ts), args.ts)}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"{} Unit tests: {}".format(icon(args.unit), args.unit)}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"{} Schema validation: {}".format(icon(args.schema), args.schema)}}]
        }},
        {"object":"block","type":"divider","divider":{}},
        {"object":"block","type":"heading_2","heading_2":{
            "rich_text":[{"type":"text","text":{"content":"User Story Coverage"}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"✔️ Validated: {} stories".format(len(validated_stories))}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"📅 Planned: {} stories".format(len(planned_stories))}}]
        }},
        {"object":"block","type":"bulleted_list_item","bulleted_list_item":{
            "rich_text":[{"type":"text","text":{"content":"❌ Failed: {} stories".format(len(failed_stories))}}]
        }},
        {"object":"block","type":"divider","divider":{}},
    ]

    # List validated stories
    if validated_stories:
        blocks.append({"object":"block","type":"heading_3","heading_3":{
            "rich_text":[{"type":"text","text":{"content":"Validated Stories"}}]
        }})
        for s in validated_stories:
            blocks.append({"object":"block","type":"bulleted_list_item","bulleted_list_item":{
                "rich_text":[{"type":"text","text":{"content":"✔️ " + story_title(s)}}]
            }})

    # List failed stories
    if failed_stories:
        blocks.append({"object":"block","type":"heading_3","heading_3":{
            "rich_text":[{"type":"text","text":{"content":"Failed Stories — Action Required"}}]
        }})
        for s in failed_stories:
            blocks.append({"object":"block","type":"bulleted_list_item","bulleted_list_item":{
                "rich_text":[{"type":"text","text":{"content":"❌ " + story_title(s)}}]
            }})

    # Create the page
    result = api("POST", "/pages", {
        "parent": {"page_id": releases_id},
        "icon": {"type": "emoji", "emoji": "✅" if passed else "❌"},
        "properties": {
            "title": [{"type": "text", "text": {"content": "Test Round — {} ({})".format(args.version, now[:10])}}]
        },
        "children": blocks
    })

    if result:
        page_url = "https://www.notion.so/{}".format(result["id"].replace("-", ""))
        print("Test round page created: {}".format(page_url))
        print("Overall: {}".format(args.overall.upper()))
    else:
        print("Failed to create Notion page.")
        sys.exit(1)

if __name__ == "__main__":
    main()
