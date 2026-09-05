# Agent Setup — Claude Code CLI & ChatGPT DevSpace Bridge

Fast path for Claude Code CLI to install, configure and use `claude-chatgpt-bridge`.

## Quick Start for Claude Code

1. **Install skill into Claude Code environment:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\install.ps1
   ```
   Installs cleanly to `%USERPROFILE%\.claude\skills\claude-chatgpt-bridge`.

2. **Verify local environment dependencies (Doctor check):**
   ```powershell
   $skill = "$env:USERPROFILE\.claude\skills\claude-chatgpt-bridge"
   powershell -ExecutionPolicy Bypass -File "$skill\scripts\local_bridge.ps1" -Action Doctor
   ```

3. **Configure the target project workspace:**
   ```powershell
   $controller = "$skill\scripts\bridge_controller.ps1"
   powershell -ExecutionPolicy Bypass -File $controller -Action Configure -ProjectRoot "C:\path\to\project" -AllowedRoots "C:\path\to\project" -Tunnel cloudflare -InstallCloudflared
   ```

4. **Start the bridge and obtain the public MCP URL:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File $controller -Action On
   powershell -ExecutionPolicy Bypass -File $controller -Action Status
   ```

5. **Connect to ChatGPT Solo / ia.francestudent.org:**
   Follow [chatgpt-app-setup.md](chatgpt-app-setup.md) to register the MCP endpoint in `https://ia.francestudent.org/p/40f895c5-f4a1-439c-80bf-90db9c05510e`.

6. **Lifecycle Management:**
   - Check health: `powershell -ExecutionPolicy Bypass -File $controller -Action Doctor`
   - Restart/Reboot: `powershell -ExecutionPolicy Bypass -File $controller -Action Reboot`
   - Stop bridge: `powershell -ExecutionPolicy Bypass -File $controller -Action Off`
   - Panic token rotation: `powershell -ExecutionPolicy Bypass -File "$skill\scripts\local_bridge.ps1" -Action Rotate`
