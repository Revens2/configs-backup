/**
 * Sync MCP Servers between Claude Desktop (claude_desktop_config.json) and Claude CLI (.mcp.json)
 * Solves Windows incompatibility of `claude mcp add-from-claude-desktop`
 */

const fs = require('fs');
const path = require('path');

const userHome = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Juliann';
const desktopConfigPath = path.join(process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
const cliConfigPath = path.join(userHome, '.mcp.json');

function loadJson(filePath, defaultObj = {}) {
  try {
    if (fs.existsSync(filePath)) {
      let raw = fs.readFileSync(filePath, 'utf8');
      raw = raw.replace(/^\uFEFF/, ''); // Strip BOM
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultObj;
}

function saveJson(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

function syncConfigs() {
  const desktopConfig = loadJson(desktopConfigPath, { mcpServers: {} });
  const cliConfig = loadJson(cliConfigPath, { mcpServers: {} });

  desktopConfig.mcpServers = desktopConfig.mcpServers || {};
  cliConfig.mcpServers = cliConfig.mcpServers || {};

  let desktopUpdated = false;
  let cliUpdated = false;
  const syncedServers = new Set();

  // Merge Desktop -> CLI
  for (const [serverName, serverConfig] of Object.entries(desktopConfig.mcpServers)) {
    if (!cliConfig.mcpServers[serverName] || JSON.stringify(cliConfig.mcpServers[serverName]) !== JSON.stringify(serverConfig)) {
      cliConfig.mcpServers[serverName] = serverConfig;
      cliUpdated = true;
      syncedServers.add(serverName);
    }
  }

  // Merge CLI -> Desktop
  for (const [serverName, serverConfig] of Object.entries(cliConfig.mcpServers)) {
    if (!desktopConfig.mcpServers[serverName] || JSON.stringify(desktopConfig.mcpServers[serverName]) !== JSON.stringify(serverConfig)) {
      desktopConfig.mcpServers[serverName] = serverConfig;
      desktopUpdated = true;
      syncedServers.add(serverName);
    }
  }

  if (cliUpdated) {
    saveJson(cliConfigPath, cliConfig);
    console.log(`[Sync MCP] Updated CLI config: ${cliConfigPath}`);
  }

  if (desktopUpdated) {
    saveJson(desktopConfigPath, desktopConfig);
    console.log(`[Sync MCP] Updated Desktop config: ${desktopConfigPath}`);
  }

  if (!cliUpdated && !desktopUpdated) {
    console.log(`[Sync MCP] Already synchronized. (${Object.keys(cliConfig.mcpServers).length} MCP servers active in both versions)`);
  } else {
    console.log(`[Sync MCP] Synchronized ${syncedServers.size} server(s): ${Array.from(syncedServers).join(', ')}`);
  }
}

syncConfigs();

