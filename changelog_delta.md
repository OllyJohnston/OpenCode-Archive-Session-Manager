# Changelog — Archive Manager Plugin

## v1.0.0 (2026-05-05)

### Added
- `archive_list` tool — list all archived sessions with metadata
- `archive_view` tool — view session details (summary or messages mode)
- `archive_unarchive` tool — restore archived sessions to active
- `archive_delete` tool — permanently delete archived sessions
- Session ID resolution (full ID or last 8 chars)
- Confirmation guards on destructive operations
- Child session safety checks on delete

### Files
- `src/plugin.ts` — main plugin implementation
- `package.json` — dependency manifest
- `README.md` — installation and usage guide

### Installation
Plugin installed to `~/.config/opencode/plugins/archive-manager.ts`
