import { exec, spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";
import type { CliStatus, CliLaunchParams, CliSession, LaunchProfile } from "@/lib/types";
import { getCcpmDir } from "./config";
import { getGlobalMcpServers, getProjectMcpServersList } from "./mcp";

let currentProcess: ChildProcess | null = null;

export function checkClaudeInstallation(): CliStatus {
  try {
    // Check for Claude CLI in common locations
    const possiblePaths = [
      "/usr/local/bin/claude",
      "/usr/bin/claude",
      expandPath("~/.local/bin/claude"),
      expandPath("~/bin/claude"),
    ];

    for (const cliPath of possiblePaths) {
      if (fs.existsSync(cliPath)) {
        const version = getClaudeVersion(cliPath);
        return {
          installed: true,
          version,
          path: cliPath,
        };
      }
    }

    // Try using which command
    const { execSync } = require("child_process");
    try {
      const whichPath = execSync("which claude", { encoding: "utf-8" }).trim();
      if (whichPath) {
        const version = getClaudeVersion(whichPath);
        return {
          installed: true,
          version,
          path: whichPath,
        };
      }
    } catch {
      // Not found via which
    }

    return {
      installed: false,
      error: "Claude CLI not found in common locations",
    };
  } catch (error) {
    return {
      installed: false,
      error: String(error),
    };
  }
}

function getClaudeVersion(cliPath: string): string | undefined {
  try {
    const { execSync } = require("child_process");
    const version = execSync(`${cliPath} --version`, { encoding: "utf-8" }).trim();
    return version;
  } catch {
    return undefined;
  }
}

export function getCliStatus(): CliStatus {
  return checkClaudeInstallation();
}

export function getCliVersion(): string | undefined {
  const status = getCliStatus();
  return status.version;
}

export function launchClaude(
  params: CliLaunchParams,
  onOutput?: (data: string) => void,
  onError?: (data: string) => void
): { success: boolean; sessionId?: string; error?: string } {
  const status = getCliStatus();

  if (!status.installed || !status.path) {
    return { success: false, error: "Claude CLI not installed" };
  }

  const sessionId = generateId();
  const args: string[] = [];

  // Add model if specified
  if (params.model) {
    args.push("--model", params.model);
  }

  // Add effort if specified
  if (params.effort) {
    args.push("--effort", params.effort.toString());
  }

  // Add MCP servers if specified
  if (params.mcpServers && params.mcpServers.length > 0) {
    for (const mcp of params.mcpServers) {
      args.push("--mcp", mcp);
    }
  }

  // Add the project path
  args.push(params.projectPath);

  try {
    currentProcess = spawn(status.path, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    currentProcess.stdout?.on("data", (data) => {
      if (onOutput) {
        onOutput(data.toString());
      }
    });

    currentProcess.stderr?.on("data", (data) => {
      if (onError) {
        onError(data.toString());
      }
    });

    currentProcess.on("error", (error) => {
      console.error("Claude process error:", error);
    });

    currentProcess.on("exit", (code) => {
      console.log("Claude process exited with code:", code);
      currentProcess = null;
    });

    return { success: true, sessionId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function stopClaude(): { success: boolean; error?: string } {
  if (!currentProcess) {
    return { success: false, error: "No Claude process running" };
  }

  try {
    currentProcess.kill();
    currentProcess = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function isClaudeRunning(): boolean {
  return currentProcess !== null;
}

// Profiles management
export function getProfilesDir(): string {
  const ccpmDir = getCcpmDir();
  return path.join(ccpmDir, "profiles");
}

export function ensureProfilesDir(): void {
  const profilesDir = getProfilesDir();
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
}

export function getLaunchProfiles(): LaunchProfile[] {
  ensureProfilesDir();
  const profilesDir = getProfilesDir();

  try {
    const entries = fs.readdirSync(profilesDir, { withFileTypes: true });
    const profiles: LaunchProfile[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;

      const profilePath = path.join(profilesDir, entry.name);
      try {
        const content = fs.readFileSync(profilePath, "utf-8");
        const profile = JSON.parse(content) as LaunchProfile;
        profiles.push(profile);
      } catch {
        // Skip invalid profiles
      }
    }

    return profiles;
  } catch {
    return [];
  }
}

export function getProfile(id: string): LaunchProfile | null {
  const profiles = getLaunchProfiles();
  return profiles.find((p) => p.id === id) || null;
}

export function createLaunchProfile(profile: Omit<LaunchProfile, "id" | "createdAt">): {
  success: boolean;
  error?: string;
  id?: string;
} {
  ensureProfilesDir();
  const profilesDir = getProfilesDir();

  const id = generateId();
  const newProfile: LaunchProfile = {
    ...profile,
    id,
    createdAt: new Date(),
  };

  try {
    const profilePath = path.join(profilesDir, `${id}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(newProfile, null, 2), "utf-8");
    return { success: true, id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function updateLaunchProfile(id: string, updates: Partial<LaunchProfile>): {
  success: boolean;
  error?: string;
} {
  const profile = getProfile(id);

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  const updatedProfile = { ...profile, ...updates };

  try {
    const profilePath = path.join(getProfilesDir(), `${id}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(updatedProfile, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function deleteLaunchProfile(id: string): { success: boolean; error?: string } {
  const profile = getProfile(id);

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  try {
    const profilePath = path.join(getProfilesDir(), `${id}.json`);
    fs.unlinkSync(profilePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function launchWithProfile(
  profileId: string,
  projectPath: string,
  onOutput?: (data: string) => void,
  onError?: (data: string) => void
): { success: boolean; sessionId?: string; error?: string } {
  const profile = getProfile(profileId);

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  return launchClaude(
    {
      projectPath,
      model: profile.model,
      effort: profile.effort,
      mcpServers: profile.mcpServers,
    },
    onOutput,
    onError
  );
}

// Default profiles
export function getDefaultProfiles(): Omit<LaunchProfile, "id" | "createdAt">[] {
  return [
    {
      name: "Quick Chat",
      model: "haiku-4.5",
      effort: 1,
      mcpServers: [],
      permissions: ["read"],
      skills: [],
      scope: "global",
    },
    {
      name: "Deep Analysis",
      model: "sonnet-4.6",
      effort: 5,
      mcpServers: [],
      permissions: ["read", "write"],
      skills: ["explain-code"],
      scope: "global",
    },
    {
      name: "Code Review",
      model: "sonnet-4.6",
      effort: 3,
      mcpServers: [],
      permissions: ["read", "edit"],
      skills: ["review-code"],
      scope: "global",
    },
  ];
}