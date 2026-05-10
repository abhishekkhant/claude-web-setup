import * as fs from "fs";
import * as path from "path";
import { expandPath, getHomeDir, generateId } from "@/lib/utils";
import type { ClaudeSettings, McpServer, PermissionRule } from "@/lib/types";

const CLAUDE_DIR = expandPath("~/.claude");
const CCPM_DIR = expandPath("~/.ccpm");

export function ensureDirectories(): void {
  const dirs = [
    CLAUDE_DIR,
    path.join(CLAUDE_DIR, "settings"),
    path.join(CLAUDE_DIR, "plugins"),
    path.join(CLAUDE_DIR, "subagents"),
    path.join(CLAUDE_DIR, "hooks"),
    path.join(CLAUDE_DIR, "skills"),
    CCPM_DIR,
    path.join(CCPM_DIR, "profiles"),
    path.join(CCPM_DIR, "projects"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function getClaudeDir(): string {
  return CLAUDE_DIR;
}

export function getCcpmDir(): string {
  return CCPM_DIR;
}

export function getSettingsPath(scope: "global" | "local" | "project", projectPath?: string): string {
  if (scope === "project" && projectPath) {
    return path.join(projectPath, ".claude", "settings.json");
  }
  if (scope === "local") {
    return path.join(CLAUDE_DIR, "settings", "local.json");
  }
  return path.join(CLAUDE_DIR, "settings.json");
}

export function readSettings(scope: "global" | "local" | "project" = "global", projectPath?: string): ClaudeSettings | null {
  const settingsPath = getSettingsPath(scope, projectPath);

  if (!fs.existsSync(settingsPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(content) as ClaudeSettings;
  } catch (error) {
    console.error("Error reading settings:", error);
    return null;
  }
}

export function writeSettings(
  settings: ClaudeSettings,
  scope: "global" | "local" | "project" = "global",
  projectPath?: string
): { success: boolean; error?: string } {
  const settingsPath = getSettingsPath(scope, projectPath);

  try {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Error writing settings:", error);
    return { success: false, error: String(error) };
  }
}

export function readSettingsSafe(scope: "global" | "local" | "project" = "global", projectPath?: string): ClaudeSettings {
  return readSettings(scope, projectPath) || {};
}

export function getGlobalSettings(): ClaudeSettings {
  return readSettingsSafe("global");
}

export function getLocalSettings(): ClaudeSettings {
  return readSettingsSafe("local");
}

export function updateGlobalSettings(settings: Partial<ClaudeSettings>): { success: boolean; error?: string } {
  const current = getGlobalSettings();
  return writeSettings({ ...current, ...settings }, "global");
}

export function updateLocalSettings(settings: Partial<ClaudeSettings>): { success: boolean; error?: string } {
  const current = getLocalSettings();
  return writeSettings({ ...current, ...settings }, "local");
}

export function getPermissionRules(): PermissionRule[] {
  const settings = getGlobalSettings();
  return settings.permissions || [];
}

export function updatePermissionRules(rules: PermissionRule[]): { success: boolean; error?: string } {
  return updateGlobalSettings({ permissions: rules });
}

export function getModelOptions(): string[] {
  return [
    "sonnet-4.6",
    "sonnet-4.5",
    "sonnet-4.0",
    "haiku-4.5",
    "haiku-4.0",
    "opus-4.6",
    "opus-4.5",
    "opus-4.0",
  ];
}

export function getEffortOptions(): number[] {
  return [1, 2, 3, 4, 5];
}

export function getInstalledPlugins(): string[] {
  const pluginsDir = path.join(CLAUDE_DIR, "plugins");

  if (!fs.existsSync(pluginsDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}