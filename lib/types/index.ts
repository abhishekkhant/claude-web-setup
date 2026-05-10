import { z } from "zod";

// ==================== Project Types ====================
export interface Project {
  id: string;
  name: string;
  path: string;
  hasClaudeMd: boolean;
  hasClaudeFolder: boolean;
  mcpCount: number;
  lastModified: Date;
  settings?: ClaudeSettings;
}

export interface ProjectScanResult {
  projects: Project[];
  total: number;
  scannedAt: Date;
}

// ==================== Config Types ====================
export interface ClaudeSettings {
  model?: string;
  plugins?: string[];
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, HookConfig>;
  permissions?: PermissionRule[];
  [key: string]: unknown;
}

// Zod Schemas - must be defined before references
export const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export const HookConfigSchema = z.object({
  type: z.enum(["before", "after", "prompt", "http"]).optional(),
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  async: z.boolean().optional(),
});

export type HookConfig = z.infer<typeof HookConfigSchema>;

export const PermissionRuleSchema = z.object({
  type: z.enum(["allow", "ask", "deny"]),
  match: z.string(),
  description: z.string().optional(),
});

export type PermissionRule = z.infer<typeof PermissionRuleSchema>;

export const ClaudeSettingsSchema = z.object({
  model: z.string().optional(),
  plugins: z.array(z.string()).optional(),
  mcpServers: z.record(z.string(), McpServerConfigSchema).optional(),
  hooks: z.record(z.string(), HookConfigSchema).optional(),
  permissions: z.array(PermissionRuleSchema).optional(),
});

// ==================== MCP Types ====================
export interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  scope: "global" | "project";
  projectPath?: string;
  enabled: boolean;
  status: "running" | "stopped" | "error";
  lastError?: string;
}

export interface McpFormData {
  name: string;
  command: string;
  args: string;
  env: Record<string, string>;
  scope: "global" | "project";
  projectPath?: string;
}

// ==================== Skills Types ====================
export interface Skill {
  id: string;
  name: string;
  description: string;
  command?: string;
  scope: "global" | "project";
  projectPath?: string;
  content: string;
  metadata: SkillMetadata;
}

export interface SkillMetadata {
  name: string;
  description?: string;
  command?: string;
  scope?: "global" | "project";
}

export interface SkillFormData {
  name: string;
  description: string;
  command: string;
  scope: "global" | "project";
  projectPath?: string;
  content: string;
}

// ==================== Agents Types ====================
export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  effort: number;
  systemPrompt: string;
  allowedTools?: string[];
  hooks?: string[];
  mcpServers?: string[];
  scope: "global" | "project";
  projectPath?: string;
}

export interface AgentFormData {
  name: string;
  description: string;
  model: string;
  effort: number;
  systemPrompt: string;
  allowedTools: string[];
  hooks: string[];
  mcpServers: string[];
  scope: "global" | "project";
  projectPath?: string;
}

// ==================== Hooks Types ====================
export interface Hook {
  id: string;
  name: string;
  type: "before" | "after" | "prompt" | "http";
  command: string;
  args: string[];
  env: Record<string, string>;
  async: boolean;
  enabled: boolean;
}

export interface HookFormData {
  name: string;
  type: "before" | "after" | "prompt" | "http";
  command: string;
  args: string;
  env: Record<string, string>;
  async: boolean;
}

// ==================== Memory Types ====================
export interface MemoryFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: "claude-md" | "project" | "user" | "auto";
  projectPath?: string;
  lastModified: Date;
}

// ==================== Profiles Types ====================
export interface LaunchProfile {
  id: string;
  name: string;
  model: string;
  effort: number;
  mcpServers: string[];
  permissions: string[];
  skills: string[];
  scope: "global" | "project";
  projectPath?: string;
  createdAt: Date;
}

export interface ProfileFormData {
  name: string;
  model: string;
  effort: number;
  mcpServers: string[];
  permissions: string[];
  skills: string[];
  scope: "global" | "project";
  projectPath?: string;
}

// ==================== CLI Types ====================
export interface CliStatus {
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export interface CliLaunchParams {
  projectPath: string;
  profile?: string;
  mcpServers?: string[];
  model?: string;
  effort?: number;
}

export interface CliSession {
  id: string;
  projectPath: string;
  startedAt: Date;
  status: "running" | "completed" | "error";
  error?: string;
}

// ==================== Stats Types ====================
export interface DashboardStats {
  projects: number;
  mcps: number;
  skills: number;
  agents: number;
}

// ==================== Recommendation Types ====================
export interface Recommendation {
  id: string;
  type: "info" | "warning" | "action";
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  dismissed: boolean;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}