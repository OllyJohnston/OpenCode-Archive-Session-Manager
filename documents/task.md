# Archive Manager Plugin — Task List

## Phase 0: Project Setup — [✅ COMPLETE]

- [x] Create `src/` directory
- [x] Create `package.json` with `@opencode-ai/plugin` as dependency
- [x] Minimal plugin structure in place

## Phase 1: Plugin Skeleton — [✅ COMPLETE]

- [x] Create `src/plugin.ts` exporting the plugin function
- [x] Structured with: ID resolution, 4 tools, helpers
- [x] Follows documented plugin pattern

## Phase 2: archive_list Tool — [✅ COMPLETE]

- [x] Implemented using `session.listGlobal({ archived: true })`
- [x] Formatted output with `# | ID | Title | Created | Archived`
- [x] Handles empty archive gracefully

## Phase 3: archive_view Tool — [✅ COMPLETE]

- [x] Implemented with `session_id` and `detail` parameters
- [x] Summary mode (default) — metadata, message count, duration
- [x] Messages mode — full message list with timestamps
- [x] Handles partial ID matching (last 8 chars)
- [x] Shows summary diffs when available

## Phase 4: archive_unarchive Tool — [✅ COMPLETE]

- [x] Implemented with `session_id` and `confirm` parameters
- [x] Uses `session.update({ path, body: { archived: null } })`
- [x] Requires confirmation by default
- [x] Error message for already-active sessions

## Phase 5: archive_delete Tool — [✅ COMPLETE]

- [x] Implemented with `session_id`, `recursive`, and `confirm` parameters
- [x] Checks for child sessions before allowing delete
- [x] Uses `session.delete({ path })`
- [x] Requires confirmation by default
- [x] Reports on child sessions when found

## Phase 6: Error Handling & Polish — [✅ COMPLETE + BUGFIX]

- [x] All tools have schema hints (helpful descriptions)
- [x] Session ID resolution fallback
- [x] Installation guide in README.md
- [x] Helper functions (formatDuration, truncate)
- [x] **BUGFIX: SDK method calls fixed** — `ctx.client.session()` → `ctx.client.session`, `listGlobal` → `list`, `path` parameter format corrected

## Phase 7: Fix Export Pattern — [✅ COMPLETE]

- [x] Changed `export const ArchiveManager: Plugin` → `export default async (ctx, opts?)` (v1 plugin format)
- [x] Updated imports: `PluginInput`, `PluginOptions` types
- [x] Rebuild + copy to `~/.config/opencode/plugins/archive-manager.ts`
- [ ] Verified tools appear in OpenCode menu (awaiting user restart and confirmation)
