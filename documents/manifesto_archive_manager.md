# Archive Manager Plugin — Developer Manifesto

This plugin should **not** reinvent session management. It should not touch the SQLite database directly. It is a thin, safe, thin layer over existing OpenCode APIs.

## 1. No Direct Database Access

The plugin MUST NOT execute SQLite queries. The session management system in OpenCode uses complex foreign key relationships and the server handles transactions, WAL management, and locking. Access the database through the SDK only:

- `session.listGlobal({ archived: true })`
- `session.get({ path })`
- `session.update({ path, body })`
- `session.delete({ path })`

## 2. Read-Only Where Possible

`archive_list` and `archive_view` must never modify data. Only `archive_unarchive` and `archive_delete` write to the database.

## 3. No Surprises

- `archive_unarchive` requires `confirm: true` by default. If the user provides it explicitly, proceed.
- `archive_delete` always requires `confirm: true`.
- Before deleting, check for child sessions and refuse if any exist in active state.

## 4. Graceful Degradation

If a session is already active, tell the user — don't fail silently. If no archived sessions exist, say so. Never show a generic error.

## 5. Respect the Registry Pattern

If this plugin is extended later (e.g., adding `archive_search` by title), all tool definitions should live in a registry object:

```typescript
const ARCHIVE_TOOLS: Record<string, ToolDefinition> = {
  archive_list: { /* ... */ },
  archive_view: { /* ... */ },
  archive_unarchive: { /* ... */ },
  archive_delete: { /* ... */ },
}
```

## 6. Error Messages Are Constructive

Every error message should include:
- What went wrong (clear cause)
- What the user can do next (actionable guidance)

Bad: "Failed to unarchive session."
Good: "Session 'abc123' is not archived. It may have been deleted or already active."

## 7. No Secrets, No Keys, No Backend URLs

There are no secrets to store for this plugin, but the pattern should be maintained. No `.env` files or hardcoded values.

## 8. Forward Compatibility

The plugin uses the stable SDK surface. It should not depend on internal APIs or private fields in the OpenCode source. If the SDK changes, the plugin should adapt — not the other way around.
