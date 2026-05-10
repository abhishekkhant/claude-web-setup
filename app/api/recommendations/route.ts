import { NextResponse } from "next/server";
import { getDiscoveredProjects } from "@/lib/claude/projects";
import { getGlobalMcpServers } from "@/lib/claude/mcp";
import { getGlobalSkills } from "@/lib/claude/skills";
import { getGlobalAgents } from "@/lib/claude/agents";

export async function GET() {
  try {
    const recommendations: string[] = [];

    // Check for projects
    const projects = getDiscoveredProjects();
    if (projects.length === 0) {
      recommendations.push("No projects detected. Scan your projects to get started.");
    }

    // Check for MCPs
    const mcps = getGlobalMcpServers();
    if (mcps.length === 0) {
      recommendations.push("No MCP servers configured. Add MCPs for enhanced functionality.");
    }

    // Check for skills
    const skills = getGlobalSkills();
    if (skills.length === 0) {
      recommendations.push("No custom skills found. Create skills for common tasks.");
    }

    // Check for agents
    const agents = getGlobalAgents();
    if (agents.length === 0) {
      recommendations.push("No subagents created. Create agents for specialized tasks.");
    }

    // Check for projects without CLAUDE.md
    const projectsWithoutClaudeMd = projects.filter((p) => !p.hasClaudeMd);
    if (projectsWithoutClaudeMd.length > 0) {
      recommendations.push(`${projectsWithoutClaudeMd.length} project(s) missing CLAUDE.md. Add project context files.`);
    }

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}