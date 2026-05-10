import * as fs from "fs";
import * as path from "path";
import { expandPath, generateId } from "@/lib/utils";
import type { Skill, SkillFormData, SkillMetadata } from "@/lib/types";

const CLAUDE_DIR = expandPath("~/.claude");
const SKILLS_DIR = path.join(CLAUDE_DIR, "skills");

export function ensureSkillsDir(): void {
  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }
}

export function getGlobalSkills(): Skill[] {
  ensureSkillsDir();

  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    const skills: Skill[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(SKILLS_DIR, entry.name);
      const metadataPath = path.join(skillPath, "metadata.json");
      const contentPath = path.join(skillPath, "SKILL.md");

      let metadata: SkillMetadata = {
        name: entry.name,
        description: "",
        scope: "global",
      };

      let content = "";

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {
          // Use default metadata
        }
      }

      if (fs.existsSync(contentPath)) {
        try {
          content = fs.readFileSync(contentPath, "utf-8");
        } catch {
          // Empty content
        }
      }

      skills.push({
        id: generateId(),
        name: metadata.name || entry.name,
        description: metadata.description || "",
        command: metadata.command,
        scope: "global",
        content,
        metadata,
      });
    }

    return skills;
  } catch {
    return [];
  }
}

export function getProjectSkills(projectPath: string): Skill[] {
  const projectSkillsDir = path.join(projectPath, ".claude", "skills");

  if (!fs.existsSync(projectSkillsDir)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(projectSkillsDir, { withFileTypes: true });
    const skills: Skill[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(projectSkillsDir, entry.name);
      const metadataPath = path.join(skillPath, "metadata.json");
      const contentPath = path.join(skillPath, "SKILL.md");

      let metadata: SkillMetadata = {
        name: entry.name,
        description: "",
        scope: "project",
      };

      let content = "";

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {
          // Use default metadata
        }
      }

      if (fs.existsSync(contentPath)) {
        try {
          content = fs.readFileSync(contentPath, "utf-8");
        } catch {
          // Empty content
        }
      }

      skills.push({
        id: generateId(),
        name: metadata.name || entry.name,
        description: metadata.description || "",
        command: metadata.command,
        scope: "project",
        projectPath,
        content,
        metadata,
      });
    }

    return skills;
  } catch {
    return [];
  }
}

export function getAllSkills(projectPaths?: string[]): Skill[] {
  const globalSkills = getGlobalSkills();
  const projectSkills: Skill[] = [];

  if (projectPaths) {
    for (const projectPath of projectPaths) {
      const skills = getProjectSkills(projectPath);
      projectSkills.push(...skills);
    }
  }

  return [...globalSkills, ...projectSkills];
}

export function createSkill(skillData: SkillFormData): { success: boolean; error?: string; id?: string } {
  ensureSkillsDir();

  const skillDir = path.join(SKILLS_DIR, skillData.name);

  if (fs.existsSync(skillDir)) {
    return { success: false, error: "Skill already exists" };
  }

  try {
    fs.mkdirSync(skillDir, { recursive: true });

    const metadata: SkillMetadata = {
      name: skillData.name,
      description: skillData.description,
      command: skillData.command || undefined,
      scope: skillData.scope,
    };

    fs.writeFileSync(
      path.join(skillDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf-8"
    );

    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillData.content || "", "utf-8");

    return { success: true, id: generateId() };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function updateSkill(
  name: string,
  updates: Partial<SkillFormData>
): { success: boolean; error?: string } {
  const skillDir = path.join(SKILLS_DIR, name);

  if (!fs.existsSync(skillDir)) {
    return { success: false, error: "Skill not found" };
  }

  try {
    if (updates.content !== undefined) {
      fs.writeFileSync(path.join(skillDir, "SKILL.md"), updates.content, "utf-8");
    }

    if (updates.description || updates.command || updates.name) {
      const metadataPath = path.join(skillDir, "metadata.json");
      let metadata: SkillMetadata = { name };

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        } catch {
          // Use defaults
        }
      }

      metadata = {
        ...metadata,
        name: updates.name || metadata.name,
        description: updates.description || metadata.description,
        command: updates.command || metadata.command,
      };

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function deleteSkill(name: string): { success: boolean; error?: string } {
  const skillDir = path.join(SKILLS_DIR, name);

  if (!fs.existsSync(skillDir)) {
    return { success: false, error: "Skill not found" };
  }

  try {
    fs.rmSync(skillDir, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getSkillContent(name: string): string | null {
  const contentPath = path.join(SKILLS_DIR, name, "SKILL.md");

  if (!fs.existsSync(contentPath)) {
    return null;
  }

  try {
    return fs.readFileSync(contentPath, "utf-8");
  } catch {
    return null;
  }
}

export function getSkill(name: string): Skill | null {
  const skillDir = path.join(SKILLS_DIR, name);

  if (!fs.existsSync(skillDir)) {
    return null;
  }

  const metadataPath = path.join(skillDir, "metadata.json");
  const contentPath = path.join(skillDir, "SKILL.md");

  let metadata: SkillMetadata = { name };
  let content = "";

  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    } catch {
      // Use defaults
    }
  }

  if (fs.existsSync(contentPath)) {
    try {
      content = fs.readFileSync(contentPath, "utf-8");
    } catch {
      // Empty
    }
  }

  return {
    id: generateId(),
    name: metadata.name || name,
    description: metadata.description || "",
    command: metadata.command,
    scope: "global",
    content,
    metadata,
  };
}

// Template skills for common use cases
export function getSkillTemplates(): { name: string; description: string; content: string }[] {
  return [
    {
      name: "explain-code",
      description: "Explain code in detail with complexity analysis",
      content: `# Explain Code Skill

You are a code explanation expert. When asked to explain code, provide:

## Analysis
- What the code does (summary)
- Key functions and their purpose
- Data flow and transformations

## Complexity
- Time and space complexity
- Any potential performance concerns

## Dependencies
- External libraries used
- Functions called from elsewhere

## Potential Improvements
- Code quality issues
- Security concerns
- Performance optimizations
`,
    },
    {
      name: "write-tests",
      description: "Generate comprehensive test suites",
      content: `# Write Tests Skill

You are a testing expert. When asked to write tests:

## Test Structure
- Arrange, Act, Assert pattern
- Clear test names describing the scenario
- Proper setup and teardown

## Coverage Goals
- Happy path tests
- Edge cases
- Error handling
- Boundary conditions

## Best Practices
- Use descriptive test names
- Keep tests independent
- Test one thing per test
- Use beforeEach for common setup
`,
    },
    {
      name: "review-code",
      description: "Perform thorough code review",
      content: `# Code Review Skill

You are a code review expert. Provide reviews covering:

## Code Quality
- Readability and maintainability
- Naming conventions
- Code organization

## Security
- Common vulnerabilities
- Input validation
- Authentication/authorization

## Performance
- Algorithmic efficiency
- Database queries
- Memory usage

## Best Practices
- Design patterns usage
- Error handling
- Documentation
- Testing

## Suggestions
- Specific improvements
- Priority levels (high/medium/low)
`,
    },
  ];
}