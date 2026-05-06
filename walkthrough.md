# Archive Manager Plugin — Walkthrough

## What Was Built

A complete OpenCode plugin for managing archived sessions. The plugin exports four tools that allow the LLM to interact with the session archive.

## File Structure

```
opencode-archive-manager/
├── package.json           # Plugin dependencies (opencode-ai/plugin)
├── src/
│   └── plugin.ts          # Main plugin implementation
├── documents/
│   ├── plan.md            # Technical design
│   ├── task.md            # Task list
│   └── manifesto_archive_manager.md  # Design constraints
├── README.md              # Installation and usage
└── changelog_delta.md     # Version log
```

## How the Plugin Works

### Session ID Resolution
The plugin receives session IDs as strings (often partial). It resolves them by:
1. Fetching the full archived session list
2. Checking exact match first
3. Then trying last-8-chars matching

### The Four Tools

**`archive_list`**
- Queries `client.session.list()`
- Filters for `time_archived`
- Returns a formatted table with ID, title, directory, and timestamps
- Graceful empty state: "No archived sessions found"

**`archive_search`**
- Filters `client.session.list()` in-memory by title or directory
- Case-insensitive matching
- Supports searching by full or partial ID

**`archive_view`**
- Two modes: `summary` (default) and `messages`
- Summary shows: title, duration, message count, tool call count, file diffs
- Messages mode shows: full message list with timestamps and content (bug fixed!)

**`archive_unarchive`**
- Uses `client.session.update({ path, body: { archived: null } })`
- Requires `--confirm` to prevent accidental operations

**`archive_delete`**
- Uses `client.session.delete({ path })`
- Checks for child sessions before allowing delete
- Requires `--confirm`
- `--recursive` to include children

### Error Handling
Every error includes:
- Clear cause (what went wrong)
- Actionable guidance (what to do next)

Examples:
- No session found → "Try `/archive_list` to see available sessions"
- Already active → "Session is not archived"
- Child sessions → "Set `--recursive` to include them"

## Installation

Automatically installed to `~/.config/opencode/plugins/archive-manager.ts`

Requires a restart of OpenCode to load the new plugin.

## Design Decisions

1. **Strict SDK Compliance** — As per the Developer Manifesto, the plugin uses the OpenCode SDK for all database interactions. This ensures transaction safety and prevents file-level locking conflicts that can occur with direct SQLite access.
2. **In-Memory Filtering** — Since the SDK is used, search and listing are performed by filtering the result set in TypeScript. This maintains compatibility across different OpenCode versions.
3. **Robust Command Parsing** — The plugin implements a custom argument parser for `/` commands to handle flags (like `--confirm`) and positional arguments (like session IDs) more naturally.
4. **Read-only by default** — Only unarchive/delete write state.
5. **Confirmations required** — No surprises.

## Known Limitations

- Requires OpenCode restart to load new plugin
- No `archive_search` by title (future enhancement)
- No `archive_restore_all` (intentionally omitted — too dangerous)
