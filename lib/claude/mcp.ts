import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId, parseArgsString } from "@/lib/utils";
import type { McpServer, McpFormData } from "@/lib/types";
import { getGlobalSettings, getSettingsPath, writeSettings, readSettingsSafe, updateGlobalSettings } from "./config";

const CLAUDE_DIR = expandPath("~/.claude");

export function getGlobalMcpServers(): McpServer[] {
  const settings = readSettingsSafe("global");
  const mcpServers = settings.mcpServers || {};

  return Object.entries(mcpServers).map(([name, config]) => ({
    id: generateId(),
    name,
    command: config.command || "",
    args: config.args || [],
    env: config.env || {},
    scope: "global",
    enabled: true,
    status: "stopped" as const,
  }));
}

export function getProjectMcpServersList(projectPath: string): McpServer[] {
  const settingsPath = path.join(projectPath, ".claude", "settings.json");

  if (!fs.existsSync(settingsPath)) {
    return [];
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    const mcpServers = settings.mcpServers || {};

    return Object.entries(mcpServers).map(([name, config]) => ({
      id: generateId(),
      name,
      command: (config as { command?: string }).command || "",
      args: (config as { args?: string[] }).args || [],
      env: (config as { env?: Record<string, string> }).env || {},
      scope: "project",
      projectPath,
      enabled: true,
      status: "stopped" as const,
    }));
  } catch {
    return [];
  }
}

export function getAllMcpServers(projectPaths?: string[]): McpServer[] {
  const globalMcps = getGlobalMcpServers();
  const projectMcps: McpServer[] = [];

  if (projectPaths) {
    for (const projectPath of projectPaths) {
      const mcps = getProjectMcpServersList(projectPath);
      projectMcps.push(...mcps);
    }
  }

  return [...globalMcps, ...projectMcps];
}

export function addMcpServer(mcpData: McpFormData): { success: boolean; error?: string; id?: string } {
  const settings = getGlobalSettings();
  const mcpServers = settings.mcpServers || {};

  const id = generateId();
  mcpServers[mcpData.name] = {
    command: mcpData.command,
    args: parseArgsString(mcpData.args),
    env: mcpData.env,
  };

  const result = updateGlobalSettings({ mcpServers: mcpServers });

  if (result.success) {
    return { success: true, id };
  }

  return { success: false, error: result.error };
}

export function updateMcpServer(
  name: string,
  updates: Partial<McpFormData>
): { success: boolean; error?: string } {
  const settings = getGlobalSettings();
  const mcpServers = settings.mcpServers || {};

  if (!mcpServers[name]) {
    return { success: false, error: "MCP server not found" };
  }

  mcpServers[name] = {
    ...mcpServers[name],
    command: updates.command || mcpServers[name].command,
    args: updates.args ? parseArgsString(updates.args) : mcpServers[name].args,
    env: updates.env || mcpServers[name].env,
  };

  return updateGlobalSettings({ mcpServers: mcpServers });
}

export function deleteMcpServer(name: string): { success: boolean; error?: string } {
  const settings = getGlobalSettings();
  const mcpServers = settings.mcpServers || {};

  if (!mcpServers[name]) {
    return { success: false, error: "MCP server not found" };
  }

  delete mcpServers[name];

  return updateGlobalSettings({ mcpServers: mcpServers });
}

export function addProjectMcpServer(
  projectPath: string,
  mcpData: McpFormData
): { success: boolean; error?: string } {
  const settingsPath = path.join(projectPath, ".claude", "settings.json");
  const dir = path.dirname(settingsPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  const mcpServers = (settings as { mcpServers?: Record<string, unknown> }).mcpServers || {};
  mcpServers[mcpData.name] = {
    command: mcpData.command,
    args: parseArgsString(mcpData.args),
    env: mcpData.env,
  };

  const newSettings = { ...settings, mcpServers };

  try {
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function deleteProjectMcpServer(
  projectPath: string,
  name: string
): { success: boolean; error?: string } {
  const settingsPath = path.join(projectPath, ".claude", "settings.json");

  if (!fs.existsSync(settingsPath)) {
    return { success: false, error: "Project settings not found" };
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    const mcpServers = settings.mcpServers || {};

    if (!mcpServers[name]) {
      return { success: false, error: "MCP server not found" };
    }

    delete mcpServers[name];
    settings.mcpServers = mcpServers;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function testMcpConnection(mcp: McpServer): { success: boolean; error?: string } {
  // In a real implementation, this would spawn the MCP server and check if it responds
  // For now, we just check if the command exists
  try {
    const { execSync } = require("child_process");
    const cmdParts = mcp.command.split(" ");
    const baseCmd = cmdParts[0];

    // Try to get version or help
    execSync(`${baseCmd} --version`, { stdio: "pipe" });
    return { success: true };
  } catch {
    return { success: false, error: "Command not found or not executable" };
  }
}

export function detectBrokenMcps(): string[] {
  const mcps = getGlobalMcpServers();
  const broken: string[] = [];

  for (const mcp of mcps) {
    const result = testMcpConnection(mcp);
    if (!result.success) {
      broken.push(mcp.name);
    }
  }

  return broken;
}

export function getMcpCommandDisplay(mcp: McpServer): string {
  const args = mcp.args.length > 0 ? ` ${mcp.args.join(" ")}` : "";
  return `${mcp.command}${args}`;
}

export function getMcpEnvDisplay(mcp: McpServer): string {
  if (!mcp.env || Object.keys(mcp.env).length === 0) {
    return "None";
  }
  return Object.entries(mcp.env)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

// Default MCP configurations from requirements
export function getDefaultMcpTemplates(): Omit<McpServer, "id" | "status">[] {
  return [
    {
      name: "sequential-thinking",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      env: {},
      scope: "global",
      enabled: true,
    },
    {
      name: "context7",
      command: "npx",
      args: ["-y", "@upstash/context7-mcp@latest"],
      env: {},
      scope: "global",
      enabled: true,
    },
  ];
}