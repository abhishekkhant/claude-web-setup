import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";
import type { MemoryFile } from "@/lib/types";

const CLAUDE_DIR = expandPath("~/.claude");
const CCPM_DIR = expandPath("~/.ccpm");

export function getGlobalMemory(): MemoryFile {
  const claudeMdPath = path.join(CLAUDE_DIR, "CLAUDE.md");

  if (!fs.existsSync(claudeMdPath)) {
    return {
      id: "global",
      name: "Global Memory",
      path: claudeMdPath,
      content: "",
      type: "claude-md",
      lastModified: new Date(),
    };
  }

  try {
    const stats = fs.statSync(claudeMdPath);
    const content = fs.readFileSync(claudeMdPath, "utf-8");

    return {
      id: "global",
      name: "Global Memory",
      path: claudeMdPath,
      content,
      type: "claude-md",
      lastModified: stats.mtime,
    };
  } catch {
    return {
      id: "global",
      name: "Global Memory",
      path: claudeMdPath,
      content: "",
      type: "claude-md",
      lastModified: new Date(),
    };
  }
}

export function getProjectMemory(projectPath: string): MemoryFile | null {
  const claudeMdPath = path.join(projectPath, "CLAUDE.md");

  if (!fs.existsSync(claudeMdPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(claudeMdPath);
    const content = fs.readFileSync(claudeMdPath, "utf-8");

    return {
      id: generateId(),
      name: "Project Memory",
      path: claudeMdPath,
      content,
      type: "project",
      projectPath,
      lastModified: stats.mtime,
    };
  } catch {
    return null;
  }
}

export function getAutoMemory(projectPath: string): MemoryFile | null {
  const autoMemoryPath = path.join(projectPath, ".claude", "memory", "auto.md");

  if (!fs.existsSync(autoMemoryPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(autoMemoryPath);
    const content = fs.readFileSync(autoMemoryPath, "utf-8");

    return {
      id: generateId(),
      name: "Auto Memory",
      path: autoMemoryPath,
      content,
      type: "auto",
      projectPath,
      lastModified: stats.mtime,
    };
  } catch {
    return null;
  }
}

export function getUserMemory(): MemoryFile {
  const userMemoryPath = path.join(CCPM_DIR, "user-memory.md");

  if (!fs.existsSync(userMemoryPath)) {
    // Create default user memory file
    const defaultContent = `# User Memory

## Preferences
- Favorite programming languages:
- Preferred code style:
- Common workflows:

## Projects
- Current projects:
- Recent work:

## Notes
- Important context about your work:
`;

    try {
      fs.mkdirSync(path.dirname(userMemoryPath), { recursive: true });
      fs.writeFileSync(userMemoryPath, defaultContent, "utf-8");
    } catch {
      // Ignore
    }

    return {
      id: "user",
      name: "User Memory",
      path: userMemoryPath,
      content: defaultContent,
      type: "user",
      lastModified: new Date(),
    };
  }

  try {
    const stats = fs.statSync(userMemoryPath);
    const content = fs.readFileSync(userMemoryPath, "utf-8");

    return {
      id: "user",
      name: "User Memory",
      path: userMemoryPath,
      content,
      type: "user",
      lastModified: stats.mtime,
    };
  } catch {
    return {
      id: "user",
      name: "User Memory",
      path: userMemoryPath,
      content: "",
      type: "user",
      lastModified: new Date(),
    };
  }
}

export function updateMemory(
  memoryType: "global" | "project" | "user" | "auto",
  content: string,
  projectPath?: string
): { success: boolean; error?: string } {
  let filePath: string;

  switch (memoryType) {
    case "global":
      filePath = path.join(CLAUDE_DIR, "CLAUDE.md");
      break;
    case "project":
      if (!projectPath) {
        return { success: false, error: "Project path required" };
      }
      filePath = path.join(projectPath, "CLAUDE.md");
      break;
    case "user":
      filePath = path.join(CCPM_DIR, "user-memory.md");
      break;
    case "auto":
      if (!projectPath) {
        return { success: false, error: "Project path required" };
      }
      filePath = path.join(projectPath, ".claude", "memory", "auto.md");
      break;
    default:
      return { success: false, error: "Invalid memory type" };
  }

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getAllMemories(projectPath?: string): MemoryFile[] {
  const memories: MemoryFile[] = [getGlobalMemory(), getUserMemory()];

  if (projectPath) {
    const projectMemory = getProjectMemory(projectPath);
    if (projectMemory) {
      memories.push(projectMemory);
    }

    const autoMemory = getAutoMemory(projectPath);
    if (autoMemory) {
      memories.push(autoMemory);
    }
  }

  return memories;
}

export function getMemoryTemplates(): { name: string; content: string }[] {
  return [
    {
      name: "Project Setup",
      content: `# Project Context

## Project Overview
- Type:
- Description:

## Tech Stack
- Frontend:
- Backend:
- Database:
- Other tools:

## Key Files
- Main entry:
- Config files:
- Tests:
`,
    },
    {
      name: "Coding Standards",
      content: `# Coding Standards

## Code Style
- Formatting:
- Naming conventions:
- Comments:

## Testing
- Test framework:
- Coverage requirements:
- Test patterns:

## Documentation
- Required docs:
- Auto-generated:
`,
    },
    {
      name: "Workflow Notes",
      content: `# Workflow Notes

## Daily Standup
- Yesterday:
- Today:
- Blockers:

## Code Review
- Review checklist:
- Common issues:

## Deployment
- Process:
- Rollback steps:
`,
    },
  ];
}

export function createProjectMemory(projectPath: string): { success: boolean; error?: string } {
  const claudeMdPath = path.join(projectPath, "CLAUDE.md");

  if (fs.existsSync(claudeMdPath)) {
    return { success: false, error: "CLAUDE.md already exists" };
  }

  const template = `# Project Context

## Project Overview
Describe your project here.

## Key Information
- Main commands:
- Important files:
- Environment requirements:
`;

  return updateMemory("project", template, projectPath);
}

export function getMemoryWordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}