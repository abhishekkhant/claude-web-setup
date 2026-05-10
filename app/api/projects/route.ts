import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId, getProjectName } from "@/lib/utils";
import { getCcpmDir } from "@/lib/claude/config";

const CLAUDE_DIR = expandPath("~/.claude");

function getDiscoveredProjects(): Array<{
  id: string;
  name: string;
  path: string;
  hasClaudeMd: boolean;
  hasClaudeFolder: boolean;
  mcpCount: number;
  lastModified: Date;
}> {
  const ccpmDir = getCcpmDir();
  const projectsFile = path.join(ccpmDir, "projects.json");

  if (!fs.existsSync(projectsFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(projectsFile, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveDiscoveredProjects(projects: Array<{
  id: string;
  name: string;
  path: string;
  hasClaudeMd: boolean;
  hasClaudeFolder: boolean;
  mcpCount: number;
  lastModified: Date;
}>): void {
  const ccpmDir = getCcpmDir();

  if (!fs.existsSync(ccpmDir)) {
    fs.mkdirSync(ccpmDir, { recursive: true });
  }

  const projectsFile = path.join(ccpmDir, "projects.json");
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf-8");
}

function createProjectFromPath(projectPath: string): {
  id: string;
  name: string;
  path: string;
  hasClaudeMd: boolean;
  hasClaudeFolder: boolean;
  mcpCount: number;
  lastModified: Date;
} | null {
  try {
    if (!fs.existsSync(projectPath)) {
      return null;
    }

    const claudeDir = path.join(projectPath, ".claude");
    const claudeMdPath = path.join(projectPath, "CLAUDE.md");
    const mcpJsonPath = path.join(projectPath, ".mcp.json");

    const hasClaudeFolder = fs.existsSync(claudeDir);
    const hasClaudeMd = fs.existsSync(claudeMdPath);

    let lastModified = new Date();
    if (hasClaudeFolder) {
      const stats = fs.statSync(claudeDir);
      lastModified = stats.mtime;
    }

    // Use folder name from path (not package.json name)
    let name = getProjectName(projectPath);

    let mcpCount = 0;
    if (fs.existsSync(mcpJsonPath)) {
      try {
        const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
        mcpCount = mcpJson.mcpServers ? Object.keys(mcpJson.mcpServers).length : 0;
      } catch {}
    } else if (hasClaudeFolder) {
      const settingsPath = path.join(claudeDir, "settings.json");
      if (fs.existsSync(settingsPath)) {
        try {
          const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
          mcpCount = settings.mcpServers ? Object.keys(settings.mcpServers).length : 0;
        } catch {}
      }
    }

    return {
      id: generateId(),
      name,
      path: projectPath,
      hasClaudeMd,
      hasClaudeFolder,
      mcpCount,
      lastModified,
    };
  } catch (error) {
    console.error(`Error creating project from ${projectPath}:`, error);
    return null;
  }
}

function scanProjects(): Array<{
  id: string;
  name: string;
  path: string;
  hasClaudeMd: boolean;
  hasClaudeFolder: boolean;
  mcpCount: number;
  lastModified: Date;
}> {
  const projects: Array<{
    id: string;
    name: string;
    path: string;
    hasClaudeMd: boolean;
    hasClaudeFolder: boolean;
    mcpCount: number;
    lastModified: Date;
  }> = [];
  const searchDirs = [
    expandPath("~/Astro/Projects"),
    expandPath("~/Projects"),
    expandPath("~/"),
  ];

  for (const searchDir of searchDirs) {
    if (!fs.existsSync(searchDir)) continue;

    try {
      const entries = fs.readdirSync(searchDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".")) continue;

        const projectPath = path.join(searchDir, entry.name);
        const claudeDir = path.join(projectPath, ".claude");

        if (fs.existsSync(claudeDir)) {
          const project = createProjectFromPath(projectPath);
          if (project) {
            projects.push(project);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${searchDir}:`, error);
    }
  }

  saveDiscoveredProjects(projects);
  return projects;
}

export async function GET() {
  try {
    const projects = getDiscoveredProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: projectPath } = body;

    // If path provided, add single project
    if (projectPath) {
      const project = createProjectFromPath(projectPath);
      if (!project) {
        return NextResponse.json({ success: false, error: "Invalid project path" }, { status: 400 });
      }

      const projects = getDiscoveredProjects();
      const exists = projects.some((p) => p.path === project.path);

      if (!exists) {
        projects.push(project);
        saveDiscoveredProjects(projects);
      }

      return NextResponse.json({ success: true, data: project });
    }

    // Otherwise scan for projects
    const projects = scanProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}