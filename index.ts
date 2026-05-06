import { tool } from "@opencode-ai/plugin"
import type { PluginInput, PluginOptions } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import { spawnSync } from "node:child_process"
import os from "node:os"
import path from "node:path"

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

const DB_PATH = path.join(os.homedir(), ".local", "share", "opencode", "opencode.db")
const RECURSION_GUARD = "\u200B"
let isProcessingCommand = false

function truncate(s: string, n: number): string {
  if (!s) return ""
  if (s.length <= n) return s
  return s.slice(0, n) + "..."
}

function sqliteQuery(query: string, params: any[] = []): any {
  const script = `
import sqlite3, json, sys
try:
    conn = sqlite3.connect(r"${DB_PATH}")
    conn.execute("PRAGMA busy_timeout = 10000")
    cur = conn.cursor()
    if ${JSON.stringify(params)}:
        cur.execute(r"${query}", ${JSON.stringify(params)})
    else:
        cur.execute(r"${query}")
    
    if cur.description:
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        result = []
        for r in rows:
            obj = {}
            for j, v in enumerate(r):
                obj[cols[j]] = v
            result.append(obj)
        print(json.dumps(result))
    else:
        conn.commit()
        print(json.dumps({"rows": cur.rowcount}))
    conn.close()
except Exception as e:
    print(json.dumps({"error": str(e)}))
`
  const result = spawnSync("python", ["-c", script], { encoding: "utf-8", timeout: 15000 })
  if (result.error) {
    return { error: `Process error: ${result.error.message}` }
  }
  if (result.status !== 0) {
    return { error: `Python error (code ${result.status})` }
  }
  try {
    const out = (result.stdout || "").trim()
    if (!out) return { error: "No output" }
    return JSON.parse(out)
  } catch (e) {
    return { error: "Failed to parse Python output" }
  }
}

function parseSimpleArgs(argsStr: string): { session_id: string; confirm: boolean; detail: string; query: string } {
  const parts = argsStr.split(/\s+/)
  return {
    session_id: parts.find(p => !p.startsWith("-") && p.length > 3) || "",
    confirm: parts.includes("--confirm"),
    detail: parts.includes("--messages") ? "messages" : "summary",
    query: parts.filter(p => !p.startsWith("-")).join(" ")
  }
}

// ──────────────────────────────────────────────
// Plugin Export
// ──────────────────────────────────────────────

export default async (ctx: PluginInput, opts?: PluginOptions) => {
  return {
    config: async (opencodeConfig) => {
      opencodeConfig.command ??= {}
      opencodeConfig.command["archive_list"] = { template: "", description: "List archived sessions" }
      opencodeConfig.command["archive_search"] = { template: "query", description: "Search archives" }
      opencodeConfig.command["archive_view"] = { template: "session_id", description: "View details" }
      opencodeConfig.command["archive_unarchive"] = { template: "session_id", description: "Restore session" }
      opencodeConfig.command["archive_delete"] = { template: "session_id", description: "Delete session" }
    },
    "command.execute.before": async (input: { command: string; sessionID: string; arguments: string }, output: { parts: Part[] }) => {
      if (isProcessingCommand) return
      if (input.arguments.includes(RECURSION_GUARD)) return
      
      const archiveCommands = ["archive_list", "archive_search", "archive_view", "archive_unarchive", "archive_delete"]
      if (!archiveCommands.includes(input.command)) return

      isProcessingCommand = true
      let resultText = ""
      const args = parseSimpleArgs(input.arguments || "")

      try {
        switch (input.command) {
          case "archive_list": {
            const res = sqliteQuery("SELECT id, title, directory, time_archived FROM session WHERE time_archived > 0 ORDER BY time_archived DESC")
            if (res.error) throw new Error(res.error)
            if (res.length === 0) {
              resultText = "No archived sessions found."
            } else {
              const lines = res.map((s: any, i: number) => {
                const arch = new Date(s.time_archived).toLocaleString()
                return `${(i + 1).toString().padStart(2, " ")}. ${s.id.slice(-8)}  "${truncate(s.title, 40)}"  —  ${truncate(s.directory, 30)}  (${arch})`
              })
              resultText = [`Found ${res.length} archived sessions:`, "", ...lines].join("\n")
            }
            break
          }
          case "archive_search": {
            if (!args.query) {
              resultText = "Usage: /archive_search <query>"
            } else {
              const res = sqliteQuery("SELECT id, title, directory FROM session WHERE (title LIKE ? OR directory LIKE ?) AND time_archived > 0", [`%${args.query}%`, `%${args.query}%`])
              if (res.error) throw new Error(res.error)
              if (res.length === 0) resultText = `No archives found matching "${args.query}".`
              else {
                const lines = res.map((s: any, i: number) => `${i + 1}. ${s.id.slice(-8)}  "${truncate(s.title, 40)}"`)
                resultText = [`Found ${res.length} matching archives:`, "", ...lines].join("\n")
              }
            }
            break
          }
          case "archive_view": {
            if (!args.session_id) {
              resultText = "Usage: /archive_view <id>"
            } else {
              const res = sqliteQuery("SELECT * FROM session WHERE id LIKE ?", [`%${args.session_id}`])
              if (res.error) throw new Error(res.error)
              if (res.length === 0) resultText = `Session "${args.session_id}" not found.`
              else {
                const s = res[0]
                resultText = [
                  `Session: "${s.title}" (ID: ...${s.id.slice(-8)})`,
                  `Path:      ${s.id}`,
                  `Directory: ${s.directory}`,
                  `Archived:  ${new Date(s.time_archived).toLocaleString()}`,
                  `Stats:     +${s.summary_additions || 0} additions, -${s.summary_deletions || 0} deletions`,
                ].join("\n")
              }
            }
            break
          }
          case "archive_unarchive": {
            if (!args.session_id || !args.confirm) {
              resultText = "Usage: /archive_unarchive <id> --confirm"
            } else {
              const res = sqliteQuery("UPDATE session SET time_archived = NULL WHERE id LIKE ?", [`%${args.session_id}`])
              if (res.error) throw new Error(res.error)
              resultText = `Success: Session ...${args.session_id.slice(-8)} has been unarchived.`
            }
            break
          }
          case "archive_delete": {
            if (!args.session_id || !args.confirm) {
              resultText = "Usage: /archive_delete <id> --confirm"
            } else {
              const res = sqliteQuery("DELETE FROM session WHERE id LIKE ?", [`%${args.session_id}`])
              if (res.error) throw new Error(res.error)
              resultText = `Success: Session ...${args.session_id.slice(-8)} has been deleted.`
            }
            break
          }
        }

        if (resultText) {
          await ctx.client.tui.showToast({
            body: { 
              title: "Archive Manager",
              message: resultText,
              variant: "info",
              duration: 30000,
              position: "top-left" as any
            }
          })
          
          throw new Error("__STOP_TURN__")
        }
      } finally {
        isProcessingCommand = false
      }
    }
  }
}
