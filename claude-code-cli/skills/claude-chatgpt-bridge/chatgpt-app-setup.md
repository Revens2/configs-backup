# ChatGPT App Setup & ia.francestudent.org Integration

How to connect ChatGPT Solo (including `https://ia.francestudent.org/p/40f895c5-f4a1-439c-80bf-90db9c05510e`) or ChatGPT Web to your local Claude Code DevSpace MCP bridge.

---

## Architecture & Credentials

- **Local MCP Server:** `@waishnav/devspace` running locally on port 7676 (or configured port).
- **Public Tunnel:** Cloudflare Quick Tunnel (`https://*.trycloudflare.com/mcp`) or Cloudflare Worker KV Proxy.
- **Client Interface:** ChatGPT Solo on `https://ia.francestudent.org/p/40f895c5-f4a1-439c-80bf-90db9c05510e` or standard ChatGPT interface.
- **Authentication:** OAuth 2.0 with Owner Password (`ownerToken` stored in `%USERPROFILE%\.devspace\auth.json`).

---

## Setup Steps

### 1. Start the Local Bridge via Controller

```powershell
$skill = "$env:USERPROFILE\.claude\skills\claude-chatgpt-bridge"
$controller = "$skill\scripts\bridge_controller.ps1"

# Configure target project root and allowed workspace boundaries
powershell -ExecutionPolicy Bypass -File $controller -Action Configure -ProjectRoot "C:\path\to\your\project" -Tunnel cloudflare -InstallCloudflared

# Start bridge and retrieve the public MCP endpoint
powershell -ExecutionPolicy Bypass -File $controller -Action On
```

Read the controller status to get the active `mcpUrl`:
```powershell
powershell -ExecutionPolicy Bypass -File $controller -Action Status
```

### 2. Connect in ia.francestudent.org / ChatGPT Solo

1. Navigate to your session on [ia.francestudent.org](https://ia.francestudent.org/p/40f895c5-f4a1-439c-80bf-90db9c05510e).
2. Open Settings / Connectors / MCP Tools configuration.
3. Add a new MCP Server / Custom App:
   - **Name:** `Claude Code ChatGPT Bridge` (or `DevSpace MCP`)
   - **URL:** The generated `mcpUrl` (e.g. `https://random-subdomain.trycloudflare.com/mcp` or your stable Worker URL ending in `/mcp`).
   - **Authentication:** `OAuth 2.0` (or Authorization Code flow).
4. When prompted in the browser popup for the **Owner Password**, open:
   `%USERPROFILE%\.devspace\auth.json`
   Copy the `ownerToken` value and paste it into the browser authorization form.

### 3. Read-Only Smoke Test

Before giving ChatGPT any complex reasoning or analysis task, verify that the workspace is correctly scoped:

```text
Open the current workspace through the DevSpace MCP bridge and list only the top-level files.
Do not write any files and do not run any mutating commands.
```

Verify that the listed files match only your configured `ProjectRoot` / `AllowedRoots`.

### 4. Stopping & Safety

- Use `powershell -ExecutionPolicy Bypass -File $controller -Action Off` when done. This immediately closes the tunnel and stops the listener while keeping your ChatGPT app configuration ready for the next session.
- If tokens or credentials are suspected to be exposed, run panic rotation:
  `powershell -ExecutionPolicy Bypass -File "$skill\scripts\local_bridge.ps1" -Action Rotate`
