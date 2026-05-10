import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";

const CLAUDE_DIR = expandPath("~/.claude");
const SKILLS_DIR = path.join(CLAUDE_DIR, "skills");

function ensureSkillsDir() {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
}

function getGlobalSkills(): Array<{
  id: string;
  name: string;
  description: string;
  command?: string;
  scope: string;
  content: string;
}> {
  ensureSkillsDir();

  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    const skills = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(SKILLS_DIR, entry.name);
      const metadataPath = path.join(skillPath, "metadata.json");
      const contentPath = path.join(skillPath, "SKILL.md");

      let metadata = { name: entry.name, description: "", command: "" };
      let content = "";

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {}
      }

      if (fs.existsSync(contentPath)) {
        try {
          content = fs.readFileSync(contentPath, "utf-8");
        } catch {}
      }

      skills.push({
        id: generateId(),
        name: metadata.name || entry.name,
        description: metadata.description || "",
        command: metadata.command,
        scope: "global",
        content,
      });
    }

    return skills;
  } catch {
    return [];
  }
}

function getProjectSkills(projectPath: string): Array<{
  id: string;
  name: string;
  description: string;
  command?: string;
  scope: string;
  projectPath: string;
  content: string;
}> {
  const projectSkillsDir = path.join(projectPath, ".claude", "skills");

  if (!fs.existsSync(projectSkillsDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(projectSkillsDir, { withFileTypes: true });
    const skills = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(projectSkillsDir, entry.name);
      const metadataPath = path.join(skillPath, "metadata.json");
      const contentPath = path.join(skillPath, "SKILL.md");

      let metadata = { name: entry.name, description: "", command: "" };
      let content = "";

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {}
      }

      if (fs.existsSync(contentPath)) {
        try {
          content = fs.readFileSync(contentPath, "utf-8");
        } catch {}
      }

      skills.push({
        id: generateId(),
        name: metadata.name || entry.name,
        description: metadata.description || "",
        command: metadata.command,
        scope: "project",
        projectPath,
        content,
      });
    }

    return skills;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get("projectPath");

    if (projectPath) {
      const projectSkills = getProjectSkills(projectPath);
      return NextResponse.json({ success: true, data: projectSkills });
    }

    const globalSkills = getGlobalSkills();
    return NextResponse.json({ success: true, data: globalSkills });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, command, content, scope, projectPath } = body;

    if (scope === "project" && projectPath) {
      const projectSkillsDir = path.join(projectPath, ".claude", "skills");
      const skillDir = path.join(projectSkillsDir, name);

      if (fs.existsSync(skillDir)) {
        return NextResponse.json({ success: false, error: "Skill already exists" }, { status: 400 });
      }

      fs.mkdirSync(skillDir, { recursive: true });

      fs.writeFileSync(
        path.join(skillDir, "metadata.json"),
        JSON.stringify({ name, description, command }, null, 2),
        "utf-8"
      );

      fs.writeFileSync(path.join(skillDir, "SKILL.md"), content || "", "utf-8");

      return NextResponse.json({ success: true, id: generateId() });
    } else {
      // Global skill
      ensureSkillsDir();
      const skillDir = path.join(SKILLS_DIR, name);

      if (fs.existsSync(skillDir)) {
        return NextResponse.json({ success: false, error: "Skill already exists" }, { status: 400 });
      }

      fs.mkdirSync(skillDir, { recursive: true });

      fs.writeFileSync(
        path.join(skillDir, "metadata.json"),
        JSON.stringify({ name, description, command }, null, 2),
        "utf-8"
      );

      fs.writeFileSync(path.join(skillDir, "SKILL.md"), content || "", "utf-8");

      return NextResponse.json({ success: true, id: generateId() });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const scope = searchParams.get("scope");
    const projectPath = searchParams.get("projectPath");

    if (!name) {
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    }

    let skillDir: string;

    if (scope === "project" && projectPath) {
      skillDir = path.join(projectPath, ".claude", "skills", name);
    } else {
      skillDir = path.join(SKILLS_DIR, name);
    }

    if (!fs.existsSync(skillDir)) {
      return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
    }

    fs.rmSync(skillDir, { recursive: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}