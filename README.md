# OpenCode Archive Manager

A native, TUI-driven administrative tool for globally managing archived sessions in Opencode. 

Unlike the built-in session management which is often workspace-isolated, this plugin uses a direct SQLite bridge to provide a global view of all archived sessions across every project on your system.

## Why this exists

While Opencode provides a button to archive sessions, it does not currently provide a native way to list or restore them. Users who accidentally archive a session often find themselves searching the internet for ways to manually edit the SQLite database. This plugin bridges that gap, providing a safe and immediate way to retrieve your data without manual DB hacking.

> [!IMPORTANT]
> **Note for Desktop/Electron Users**: Slash commands do not work in the Opencode Electron Desktop app. To use this plugin, you must use the **Opencode TUI** version.
> 1. Download the latest release for your OS (e.g., `opencode-windows-x64.zip` or `opencode-linux-x64.zip`) from the [Opencode Releases](https://github.com/anomalyco/opencode/releases).
> 2. Extract it to a separate folder from your Desktop version.
> 3. Run the `opencode` executable from your terminal. **Note for Windows**: Use **CMD** (Command Prompt), as Opencode currently has known stability/UI issues in PowerShell.
> 4. You can then use the `/archive_` commands listed below.

## Features

- **Global Visibility**: Lists and manages archived sessions from any workspace.
- **AI Turn Suppression**: Uses a "Silent Throw" pattern and TUI Toasts to ensure administrative commands don't trigger unnecessary AI reasoning turns.
- **Fast & Lightweight**: Direct database access via Python/SQLite for high performance.
- **Safety First**: Destructive actions (unarchive, delete) require an explicit `--confirm` flag.

## Installation

### Method 1: Release Zip (Recommended)

1. **Prerequisites**: Ensure you have [Python](https://www.python.org/) installed and available in your system path.
2. **Download**: Grab the latest `archive-manager-v1.0.0.zip` from the [Releases](https://github.com/OllyJohnston/OpenCode-Archive-Session-Manager/releases) page.
3. **Extract**: Unzip the folder to a permanent location (e.g., `C:\Plugins\ArchiveManager`).
4. **Register**: Add the folder path to your Opencode `opencode.jsonc` (on Windows) or via the TUI plugins menu:
   ```json
   {
     "plugins": [
       "C:/Plugins/ArchiveManager"
     ]
   }
   ```

### Method 2: From Source (For Developers)

1. **Clone**: `git clone https://github.com/OllyJohnston/OpenCode-Archive-Session-Manager.git`
2. **Build**: 
   ```bash
   npm install
   npm run build
   ```
3. **Register**: Add the project directory path to your Opencode plugins list.

## Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/archive_list` | | Lists all archived sessions in a formatted table. |
| `/archive_search` | `<query>` | Searches archives by title or directory name. |
| `/archive_view` | `<id>` | Displays detailed metadata and stats for a session. |
| `/archive_unarchive` | `<id> --confirm` | Restores an archived session to active status. |
| `/archive_delete` | `<id> --confirm` | Permanently deletes a session and all its messages. |

## Architecture

This plugin bypasses the standard SDK session listing (which is restricted to the current workspace) by using a **Python Bridge**. 

When you run a command, the plugin:
1. Spawns a lightweight Python process.
2. Connects directly to the Opencode SQLite database (`~/.local/share/opencode/opencode.db`).
3. Executes the query/update with a 10s busy timeout to handle locks.
4. Returns the result to a **TUI Toast** (top-right "box").
5. **Aborts the Turn**: Immediately throws an internal error to prevent the AI from seeing or responding to the administrative output.

## License

MIT
