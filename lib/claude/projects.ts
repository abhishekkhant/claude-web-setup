import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId, getProjectName } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { getCcpmDir } from "./config";

const CLAUDE_DIR = expandPath("~/.claude");

export function scanProjects(searchPaths?: string[]): Project[] {
  const projects: Project[] = [];
  const searchDirs = searchPaths || [
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

  // Save discovered projects to CCPM
  saveDiscoveredProjects(projects);

  return projects;
}

export function createProjectFromPath(projectPath: string): Project | null {
  try {
    const claudeDir = path.join(projectPath, ".claude");
    const claudeMdPath = path.join(projectPath, "CLAUDE.md");

    const hasClaudeFolder = fs.existsSync(claudeDir);
    const hasClaudeMd = fs.existsSync(claudeMdPath);

    // Get last modified time
    let lastModified = new Date();
    if (hasClaudeFolder) {
      const stats = fs.statSync(claudeDir);
      lastModified = stats.mtime;
    }

    // Try to get project name from package.json
    let name = getProjectName(projectPath);
    const packageJsonPath = path.join(projectPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        name = packageJson.name || name;
      } catch {
        // Use directory name
      }
    }

    // Count MCPs in settings
    let mcpCount = 0;
    const settingsPath = path.join(claudeDir, "settings.json");
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        mcpCount = settings.mcpServers ? Object.keys(settings.mcpServers).length : 0;
      } catch {
        // Ignore
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

export function getDiscoveredProjects(): Project[] {
  const ccpmDir = getCcpmDir();
  const projectsFile = path.join(ccpmDir, "projects.json");

  if (!fs.existsSync(projectsFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(projectsFile, "utf-8");
    return JSON.parse(content) as Project[];
  } catch {
    return [];
  }
}

export function saveDiscoveredProjects(projects: Project[]): void {
  const ccpmDir = getCcpmDir();

  if (!fs.existsSync(ccpmDir)) {
    fs.mkdirSync(ccpmDir, { recursive: true });
  }

  const projectsFile = path.join(ccpmDir, "projects.json");
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf-8");
}

export function addProjectToList(project: Project): void {
  const projects = getDiscoveredProjects();
  const exists = projects.some((p) => p.path === project.path);

  if (!exists) {
    projects.push(project);
    saveDiscoveredProjects(projects);
  }
}

export function removeProjectFromList(projectPath: string): void {
  const projects = getDiscoveredProjects();
  const filtered = projects.filter((p) => p.path !== projectPath);
  saveDiscoveredProjects(filtered);
}

export function getProjectConfig(projectPath: string): Record<string, unknown> | null {
  const configPath = path.join(projectPath, ".claude", "settings.json");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

export function getProjectMcpServers(projectPath: string): Record<string, unknown> {
  const config = getProjectConfig(projectPath);
  return config?.mcpServers as Record<string, unknown> || {};
}

export function getProjectPermissions(projectPath: string): Record<string, unknown> {
  const config = getProjectConfig(projectPath);
  return config?.permissions as Record<string, unknown> || {};
}

export function getProjectHooks(projectPath: string): Record<string, unknown> {
  const config = getProjectConfig(projectPath);
  return config?.hooks as Record<string, unknown> || {};
}