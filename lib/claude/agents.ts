import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";
import type { Agent, AgentFormData } from "@/lib/types";

const CLAUDE_DIR = expandPath("~/.claude");
const SUBAGENTS_DIR = path.join(CLAUDE_DIR, "subagents");

export function ensureSubagentsDir(): void {
  if (!fs.existsSync(SUBAGENTS_DIR)) {
    fs.mkdirSync(SUBAGENTS_DIR, { recursive: true });
  }
}

export function getGlobalAgents(): Agent[] {
  ensureSubagentsDir();

  try {
    const entries = fs.readdirSync(SUBAGENTS_DIR, { withFileTypes: true });
    const agents: Agent[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const agentPath = path.join(SUBAGENTS_DIR, entry.name);
      const configPath = path.join(agentPath, "agent.md");

      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, "utf-8");
          const agent = parseAgentContent(content, entry.name);
          if (agent) {
            agents.push(agent);
          }
        } catch {
          // Skip invalid agents
        }
      }
    }

    return agents;
  } catch {
    return [];
  }
}

export function getProjectAgents(projectPath: string): Agent[] {
  const projectAgentsDir = path.join(projectPath, ".claude", "subagents");

  if (!fs.existsSync(projectAgentsDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(projectAgentsDir, { withFileTypes: true });
    const agents: Agent[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const agentPath = path.join(projectAgentsDir, entry.name);
      const configPath = path.join(agentPath, "agent.md");

      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, "utf-8");
          const agent = parseAgentContent(content, entry.name);
          if (agent) {
            agents.push({
              ...agent,
              scope: "project",
              projectPath,
            });
          }
        } catch {
          // Skip invalid agents
        }
      }
    }

    return agents;
  } catch {
    return [];
  }
}

export function getAllAgents(projectPaths?: string[]): Agent[] {
  const globalAgents = getGlobalAgents();
  const projectAgents: Agent[] = [];

  if (projectPaths) {
    for (const projectPath of projectPaths) {
      const agents = getProjectAgents(projectPath);
      projectAgents.push(...agents);
    }
  }

  return [...globalAgents, ...projectAgents];
}

function parseAgentContent(content: string, name: string): Agent | null {
  try {
    // Parse YAML frontmatter style config
    const lines = content.split("\n");
    let inFrontmatter = false;
    let frontmatter: string[] = [];
    let systemPrompt = content;

    for (const line of lines) {
      if (line.trim() === "---") {
        if (inFrontmatter) {
          inFrontmatter = false;
        } else {
          inFrontmatter = true;
        }
        continue;
      }

      if (inFrontmatter) {
        frontmatter.push(line);
      } else if (frontmatter.length > 0 && !line.startsWith("#")) {
        systemPrompt = content.slice(content.indexOf("---", 12) + 13).trim();
        break;
      }
    }

    const config: Partial<Agent> = { name };
    for (const line of frontmatter) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        const value = valueParts.join(":").trim();
        switch (key.trim()) {
          case "description":
            config.description = value;
            break;
          case "model":
            config.model = value;
            break;
          case "effort":
            config.effort = parseInt(value, 10) || 3;
            break;
          case "allowedTools":
            config.allowedTools = value.split(",").map((t) => t.trim());
            break;
        }
      }
    }

    return {
      id: generateId(),
      name: config.name || name,
      description: config.description || "",
      model: config.model || "sonnet-4.6",
      effort: config.effort || 3,
      systemPrompt: systemPrompt || content,
      allowedTools: config.allowedTools,
      scope: "global",
    };
  } catch {
    return null;
  }
}

export function createAgent(agentData: AgentFormData): { success: boolean; error?: string; id?: string } {
  ensureSubagentsDir();

  const agentDir = path.join(SUBAGENTS_DIR, agentData.name);

  if (fs.existsSync(agentDir)) {
    return { success: false, error: "Agent already exists" };
  }

  try {
    fs.mkdirSync(agentDir, { recursive: true });

    const content = formatAgentContent(agentData);

    fs.writeFileSync(path.join(agentDir, "agent.md"), content, "utf-8");

    return { success: true, id: generateId() };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function formatAgentContent(agentData: AgentFormData): string {
  const frontmatter = [
    "---",
    `name: ${agentData.name}`,
    `description: ${agentData.description}`,
    `model: ${agentData.model}`,
    `effort: ${agentData.effort}`,
  ];

  if (agentData.allowedTools && agentData.allowedTools.length > 0) {
    frontmatter.push(`allowedTools: ${agentData.allowedTools.join(", ")}`);
  }

  frontmatter.push("---", "");

  return frontmatter.join("\n") + agentData.systemPrompt;
}

export function updateAgent(
  name: string,
  updates: Partial<AgentFormData>
): { success: boolean; error?: string } {
  const agentDir = path.join(SUBAGENTS_DIR, name);

  if (!fs.existsSync(agentDir)) {
    return { success: false, error: "Agent not found" };
  }

  try {
    const configPath = path.join(agentDir, "agent.md");
    const content = fs.readFileSync(configPath, "utf-8");
    const agent = parseAgentContent(content, name);

    if (!agent) {
      return { success: false, error: "Invalid agent config" };
    }

    const updatedAgent: AgentFormData = {
      name: updates.name || agent.name,
      description: updates.description || agent.description,
      model: updates.model || agent.model,
      effort: updates.effort || agent.effort,
      systemPrompt: updates.systemPrompt || agent.systemPrompt,
      allowedTools: updates.allowedTools || agent.allowedTools || [],
      hooks: updates.hooks || agent.hooks || [],
      mcpServers: updates.mcpServers || agent.mcpServers || [],
      scope: "global",
    };

    const newContent = formatAgentContent(updatedAgent);
    fs.writeFileSync(configPath, newContent, "utf-8");

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function deleteAgent(name: string): { success: boolean; error?: string } {
  const agentDir = path.join(SUBAGENTS_DIR, name);

  if (!fs.existsSync(agentDir)) {
    return { success: false, error: "Agent not found" };
  }

  try {
    fs.rmSync(agentDir, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getAgent(name: string): Agent | null {
  const agentDir = path.join(SUBAGENTS_DIR, name);
  const configPath = path.join(agentDir, "agent.md");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return parseAgentContent(content, name);
  } catch {
    return null;
  }
}

export function getAgentConfigPreview(agentData: AgentFormData): string {
  const config = {
    name: agentData.name,
    description: agentData.description,
    model: agentData.model,
    effort: agentData.effort,
    tools: agentData.allowedTools,
  };

  return JSON.stringify(config, null, 2);
}

// Built-in agent types
export function getBuiltInAgents(): { id: string; name: string; description: string }[] {
  return [
    { id: "general", name: "General", description: "General purpose assistant" },
    { id: "code-reviewer", name: "Code Reviewer", description: "Specialized in code review" },
    { id: "debugger", name: "Debugger", description: "Helps debug issues" },
    { id: "writer", name: "Writer", description: "Specialized in documentation and writing" },
    { id: "researcher", name: "Researcher", description: "Helps research and gather information" },
  ];
}