import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";
import { readSettingsSafe, getGlobalSettings, updateGlobalSettings } from "@/lib/claude/config";

const CLAUDE_DIR = expandPath("~/.claude");

// Get MCPs - supports global and project level
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get("projectPath");

    // If project path provided, get project-level MCPs
    if (projectPath) {
      const mcpJsonPath = path.join(projectPath, ".mcp.json");
      const settingsPath = path.join(projectPath, ".claude", "settings.json");

      let mcpServers: Record<string, unknown> = {};

      // First check .mcp.json (new format)
      if (fs.existsSync(mcpJsonPath)) {
        try {
          const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
          mcpServers = mcpJson.mcpServers || {};
        } catch {}
      }
      // Fall back to settings.json
      else if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
          mcpServers = settings.mcpServers || {};
        } catch {}
      }

      const mcps = Object.entries(mcpServers).map(([name, config]) => ({
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

      return NextResponse.json({ success: true, data: mcps });
    }

    // Otherwise get global MCPs
    const settings = getGlobalSettings();
    const mcpServers = settings.mcpServers || {};

    const mcps = Object.entries(mcpServers).map(([name, config]) => ({
      id: generateId(),
      name,
      command: config.command || "",
      args: config.args || [],
      env: config.env || {},
      scope: "global",
      enabled: true,
      status: "stopped" as const,
    }));

    return NextResponse.json({ success: true, data: mcps });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Add MCP - global or project level
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, command, args, env, scope, projectPath } = body;

    if (scope === "project" && projectPath) {
      // Add to project level
      const mcpJsonPath = path.join(projectPath, ".mcp.json");
      const settingsPath = path.join(projectPath, ".claude", "settings.json");

      let mcpServers: Record<string, unknown> = {};

      // Try .mcp.json first
      if (fs.existsSync(mcpJsonPath)) {
        try {
          const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
          mcpServers = mcpJson.mcpServers || {};
        } catch {}
      } else if (fs.existsSync(settingsPath)) {
        // Fall back to settings.json
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
          mcpServers = settings.mcpServers || {};
        } catch {}
      }

      mcpServers[name] = { command, args: args || [], env: env || {} };

      // Write to .mcp.json (preferred) or settings.json
      const targetPath = fs.existsSync(mcpJsonPath) ? mcpJsonPath : settingsPath;
      const dir = path.dirname(targetPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(mcpJsonPath)) {
        const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
        mcpJson.mcpServers = mcpServers;
        fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpJson, null, 2), "utf-8");
      } else {
        let settings = {};
        if (fs.existsSync(settingsPath)) {
          try {
            settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
          } catch {}
        }
        const newSettings = { ...settings, mcpServers };
        fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), "utf-8");
      }

      return NextResponse.json({ success: true, id: generateId() });
    } else {
      // Add to global
      const settings = getGlobalSettings();
      const mcpServers = settings.mcpServers || {};

      mcpServers[name] = { command, args: args || [], env: env || {} };

      const result = updateGlobalSettings({ mcpServers: mcpServers });

      if (result.success) {
        return NextResponse.json({ success: true, id: generateId() });
      }

      return NextResponse.json({ success: false, error: result.error });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Delete MCP
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const projectPath = searchParams.get("projectPath");

    if (!name) {
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    }

    if (projectPath) {
      // Delete from project
      const mcpJsonPath = path.join(projectPath, ".mcp.json");
      const settingsPath = path.join(projectPath, ".claude", "settings.json");

      let targetPath = mcpJsonPath;
      if (!fs.existsSync(mcpJsonPath) && fs.existsSync(settingsPath)) {
        targetPath = settingsPath;
      }

      if (!fs.existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "Project MCP config not found" }, { status: 404 });
      }

      const config = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      if (targetPath.endsWith(".mcp.json")) {
        delete config.mcpServers?.[name];
        fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf-8");
      } else {
        delete config.mcpServers?.[name];
        fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), "utf-8");
      }

      return NextResponse.json({ success: true });
    } else {
      // Delete from global
      const settings = getGlobalSettings();
      const mcpServers = settings.mcpServers || {};

      if (!mcpServers[name]) {
        return NextResponse.json({ success: false, error: "MCP server not found" }, { status: 404 });
      }

      delete mcpServers[name];
      const result = updateGlobalSettings({ mcpServers: mcpServers });

      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}