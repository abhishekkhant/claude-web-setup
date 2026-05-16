import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId, parseArgsString } from "@/lib/utils";
import type { Hook, HookFormData } from "@/lib/types";
import { getGlobalSettings, updateGlobalSettings } from "./config";

const CLAUDE_DIR = expandPath("~/.claude");
const HOOKS_DIR = path.join(CLAUDE_DIR, "hooks");

export function ensureHooksDir(): void {
  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }
}

export function getGlobalHooks(): Hook[] {
  const settings = getGlobalSettings();
  const hooks = settings.hooks || {};

  return Object.entries(hooks).map(([name, config]) => ({
    id: generateId(),
    name,
    type: config.type || "before",
    command: config.command || "",
    args: config.args || [],
    env: config.env || {},
    async: config.async || false,
    enabled: true,
  }));
}

export function getHook(name: string): Hook | null {
  const hooks = getGlobalHooks();
  return hooks.find((h) => h.name === name) || null;
}

export function addHook(hookData: HookFormData): { success: boolean; error?: string; id?: string } {
  const settings = getGlobalSettings();
  const hooks = settings.hooks || {};

  if (hooks[hookData.name]) {
    return { success: false, error: "Hook already exists" };
  }

  hooks[hookData.name] = {
    type: hookData.type,
    command: hookData.command,
    args: parseArgsString(hookData.args),
    env: hookData.env,
    async: hookData.async,
  };

  const result = updateGlobalSettings({ hooks });

  if (result.success) {
    return { success: true, id: generateId() };
  }

  return { success: false, error: result.error };
}

export function updateHook(
  name: string,
  updates: Partial<HookFormData>
): { success: boolean; error?: string } {
  const settings = getGlobalSettings();
  const hooks = settings.hooks || {};

  if (!hooks[name]) {
    return { success: false, error: "Hook not found" };
  }

  hooks[name] = {
    type: updates.type || hooks[name].type,
    command: updates.command || hooks[name].command,
    args: updates.args ? parseArgsString(updates.args) : hooks[name].args,
    env: updates.env || hooks[name].env,
    async: updates.async !== undefined ? updates.async : hooks[name].async,
  };

  return updateGlobalSettings({ hooks });
}

export function deleteHook(name: string): { success: boolean; error?: string } {
  const settings = getGlobalSettings();
  const hooks = settings.hooks || {};

  if (!hooks[name]) {
    return { success: false, error: "Hook not found" };
  }

  delete hooks[name];

  return updateGlobalSettings({ hooks });
}

export function toggleHook(name: string, enabled: boolean): { success: boolean; error?: string } {
  // For now, we store enabled state in the hook config
  const settings = getGlobalSettings();
  const hooks = settings.hooks || {};

  if (!hooks[name]) {
    return { success: false, error: "Hook not found" };
  }

  // In a full implementation, we'd track enabled state separately
  // For now, we just return success
  return { success: true };
}

export function testHook(hook: Hook): { success: boolean; output?: string; error?: string } {
  try {
    const { execSync } = require("child_process");

    const cmd = hook.command;
    const result = execSync(cmd, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: "pipe",
    });

    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getHookTypes(): { value: string; label: string; description: string }[] {
  return [
    { value: "before", label: "Before", description: "Run before Claude responds" },
    { value: "after", label: "After", description: "Run after Claude responds" },
    { value: "prompt", label: "Prompt", description: "Modify the prompt" },
    { value: "http", label: "HTTP", description: "HTTP webhook" },
  ];
}

export function getHookDisplayCommand(hook: Hook): string {
  const args = hook.args.length > 0 ? ` ${hook.args.join(" ")}` : "";
  return `${hook.command}${args}`;
}

// Template hooks for common use cases
export function getHookTemplates(): { name: string; type: string; command: string; description: string }[] {
  return [
    {
      name: "log-conversation",
      type: "after",
      command: "tee",
      description: "Log conversation to file",
    },
    {
      name: "preprocess-prompt",
      type: "prompt",
      command: "sed",
      description: "Preprocess prompt with sed",
    },
    {
      name: "webhook-notify",
      type: "http",
      command: "curl",
      description: "Send notification to webhook",
    },
  ];
}

// Hook ordering
export function getHookOrder(): string[] {
  const hooks = getGlobalHooks();
  return hooks.map((h) => h.name);
}

export function setHookOrder(order: string[]): { success: boolean; error?: string } {
  // Hooks order is stored in settings
  const settings = getGlobalSettings();
  settings.hooks = settings.hooks || {};

  // Reorder hooks based on the order array
  const reordered: Record<string, unknown> = {};
  for (const name of order) {
    if (settings.hooks[name]) {
      reordered[name] = settings.hooks[name];
    }
  }

  return updateGlobalSettings({ hooks: reordered as Record<string, { command: string; type?: "before" | "after" | "prompt" | "http"; async?: boolean; args?: string[]; env?: Record<string, string> }> });
}