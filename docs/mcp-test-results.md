# MCP Tool Test Results

This document records the results of manually testing the `github-mcp-server` MCP tools against this repository.

---

## 1. `pull_request_read` — PR #1

**Tool:** `github-mcp-server/pull_request_read`  
**Parameters:** `{ method: "get", owner: "dakomi", repo: "HouseholdACTracker", pullNumber: 1 }`

**Response snippet (sensitive paths redacted):**

```json
{
  "number": 1,
  "title": "Fix TypeScript build errors, backend persistence, and first-run setup experience",
  "state": "open",
  "draft": true,
  "merged": false,
  "mergeable_state": "clean",
  "html_url": "https://github.com/dakomi/HouseholdACTracker/pull/1",
  "user": {
    "login": "Copilot",
    "id": "[REDACTED]",
    "profile_url": "https://github.com/apps/copilot-swe-agent"
  },
  "assignees": ["dakomi", "Copilot"],
  "head": {
    "ref": "copilot/build-ac-usage-tracker",
    "repo": { "full_name": "dakomi/HouseholdACTracker" }
  },
  "base": {
    "ref": "main",
    "repo": { "full_name": "dakomi/HouseholdACTracker" }
  },
  "additions": 12905,
  "deletions": 2,
  "changed_files": 73,
  "commits": 11,
  "created_at": "2026-03-04T05:41:04Z",
  "updated_at": "2026-03-05T07:47:42Z"
}
```

---

## 2. `issue_read` — Issue #1

**Tool:** `github-mcp-server/issue_read`  
**Parameters:** `{ method: "get", owner: "dakomi", repo: "HouseholdACTracker", issue_number: 1 }`

> **Note:** In GitHub's API, pull requests are also issues. Issue #1 and PR #1 refer to the same object, so both calls return equivalent data.

**Response snippet (sensitive paths redacted):**

```json
{
  "number": 1,
  "title": "Fix TypeScript build errors, backend persistence, and first-run setup experience",
  "state": "open",
  "draft": true,
  "html_url": "https://github.com/dakomi/HouseholdACTracker/pull/1",
  "user": {
    "login": "Copilot",
    "id": "[REDACTED]",
    "profile_url": "https://github.com/apps/copilot-swe-agent"
  },
  "author_association": "NONE",
  "assignees": ["dakomi", "Copilot"],
  "reactions": {
    "total_count": 0,
    "+1": 0,
    "-1": 0,
    "laugh": 0,
    "confused": 0,
    "heart": 0,
    "hooray": 0,
    "rocket": 0,
    "eyes": 0
  },
  "created_at": "2026-03-04T05:41:04Z",
  "updated_at": "2026-03-05T07:47:42Z"
}
```

---

## Summary

Both MCP tool calls completed successfully:

| Tool | Target | Status |
|---|---|---|
| `pull_request_read` (method: `get`) | PR #1 | ✅ 200 OK |
| `issue_read` (method: `get`) | Issue #1 | ✅ 200 OK |

The `github-mcp-server` tools are working correctly and can read pull request and issue data from this repository.
