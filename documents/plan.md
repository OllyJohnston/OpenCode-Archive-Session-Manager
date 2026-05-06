# Archive Manager Plugin — Technical Design

## 1. Overview

A Bun/TypeScript plugin for OpenCode that exposes tools for viewing, managing, and restoring archived sessions. Sessions archived via `/archive` become inaccessible to the TUI but remain on disk; this plugin restores visibility and control.

## 2. Plugin Registration

The plugin exports a single default function registered using the standard OpenCode plugin pattern:

```typescript
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export const ArchiveManager: Plugin = async (ctx) => {
  return {
    tool: {
      archive_list: tool({ /* ... */ }),
      archive_view: tool({ /* ... */ }),
      archive_unarchive: tool({ /* ... */ }),
      archive_delete: tool({ /* ... */ }),
    },
    event: async (input) => {
      if (input.event === "session.created") {
        // optional: log session creation
      }
    },
  }
}
```

**Loading location:** Place in `~/.config/opencode/plugins/archive-manager.ts`.

**Alternative approach — direct tools:** OpenCode also supports dropping tool files directly into `.opencode/tools/` where each exported `tool()` becomes a standalone tool (no plugin wrapper, no event hooks). Use the plugin approach for this project since we need event hooks.

## 3. Tool Definitions

### 3.1 `archive_list`

**Purpose:** List all archived sessions across the current project.

**Implementation:**
```typescript
const sessions = await ctx.client.session.listGlobal({ archived: true })
```

**Returns:**
- `id` — session ID (UUID)
- `title` — human-readable title
- `slug` — URL-friendly slug
- `directory` — project directory
- `time_created` / `time_updated` — timestamps
- `time_archived` — archive timestamp
- `message_count` — derived from `await ctx.client.session.messages(path)`
- `has_children` — boolean (parent_id on child sessions)

**User-facing output:** Table-formatted list with columns: `# | ID (truncated) | Title | Archive Date | Messages | Directory`

### 3.2 `archive_view`

**Purpose:** View a specific archived session's details. Takes a session ID or slug.

**Parameters:**
- `session_id` (required) — the session's UUID or last 8 chars
- `detail` (optional) — `summary` (default) or `messages`

**Implementation:**
```typescript
const session = await ctx.client.session.get({ path })
const messages = await ctx.client.session.messages({ path })
```

**Returns (summary mode):**
- Session metadata (title, dates, directory)
- Summary statistics (additions, deletions, files)
- Last few messages with content preview
- Duration since creation

**Returns (messages mode):**
- Full message list with timestamps
- Message contents (role, content)
- Tool call information

### 3.3 `archive_unarchive`

**Purpose:** Restore an archived session to active state.

**Parameters:**
- `session_id` (required) — the session's UUID
- `confirm` (optional, default `false`) — confirmation flag

**Implementation:**
```typescript
await ctx.client.session.update({ 
  path, 
  body: { archived: null } 
})
```

**Note:** This is the equivalent of `PATCH /sessions/:sessionID` with `archived: null`.

### 3.4 `archive_delete`

**Purpose:** Permanently delete an archived session and all associated data.

**Parameters:**
- `session_id` (required)
- `recursive` (optional, default `false`) — delete child sessions too

**Implementation:**
```typescript
await ctx.client.session.delete({ path })
// For recursive: find children, delete each
```

**Note:** This removes the session record and cascades to messages, parts, and todos via the FK constraints.

## 4. Session ID Resolution

Sessions are often identified by a shortened ID. The plugin resolves partial IDs by querying a mapping table:

```typescript
// Map from last 8 chars of ID -> full session object
const idMapping: Record<string, Session> = {}
const sessions = await ctx.client.session.listGlobal({ archived: true })
sessions.forEach(s => {
  idMapping[s.id.slice(-8)] = s
})
```

## 5. Error Handling

| Error Case | Response |
|---|---|
| Session not found | "No session found with ID '{id}'. Use `archive_list` to see available sessions." |
| Empty archive | "No archived sessions found." |
| Already active | "Session '{id}' is not archived." |
| Delete in use | "Cannot delete session with active sessions. Please unarchive first." |
| Delete child of active | "Cannot delete — '{id}' is the parent of active session '{child}'." |

## 6. Optional: Event Hook

```typescript
event: async (input) => {
  if (input.event === "session.archived") {
    // Track archive events for analytics
    // No-op by default, extendable
  }
}
```

## 7. Testing Strategy

| Layer | Test |
|---|---|
| Unit | Tool argument parsing, ID resolution |
| Module | `plugin()` returns correct hooks |
| Integration | End-to-end: archive → list → view → unarchive → verify active |

**Approach:** Use the existing `session.listGlobal({ archived })`, `session.get()`, `session.update()`, and `session.delete()` SDK methods — no direct SQLite access needed.

## 8. Dependencies

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^*"
  }
}
```

## 9. Installation

Place at `~/.config/opencode/plugins/archive-manager.ts` or publish to npm and register in `opencode.json`:

```json
{
  "plugin": ["@user/opencode-archive-manager"]
}
```

## 10. User Journey (before implementation)

1. **Entry:** User starts a conversation with "show me my archived sessions"
2. **Input:** No arguments required for listing
3. **Action:** Plugin lists sessions in a formatted table
4. **State Change:** User sees session count and titles
5. **Data Consequence:** No changes to the database — read-only query
6. **Resolution:** User selects a specific session by ID or by scrolling

---

## Decision Log

| Decision | Rationale |
|---|---|
| Use `session.listGlobal({ archived: true })` over direct SQL | Leverages existing SDK; respects session filters; avoids SQLite locking issues |
| Register as tool plugin, not event-only plugin | Provides interactive commands; integrates with `/` completions |
| No direct DB access | SDK methods handle all FK cascading and transaction management |
| Include `archive_delete` | Completes the lifecycle; archived sessions are dead weight |
| No `restore-all` by default | Risky operation; too dangerous for a tool |
