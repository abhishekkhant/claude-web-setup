import * as fs from "fs";
import * as path from "path";
import { expandPath } from "@/lib/utils";
import type { ClaudeSettings } from "@/lib/types";

const CLAUDE_DIR = expandPath("~/.claude");
const CCPM_DIR = expandPath("~/.ccpm");

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



