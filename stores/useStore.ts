import { create } from "zustand";
import type { Project, McpServer, Skill, Agent, Hook, LaunchProfile, CliStatus } from "@/lib/types";

interface AppState {
  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // MCP
  mcpServers: McpServer[];
  setMcpServers: (mcps: McpServer[]) => void;
  globalMcpServers: McpServer[];
  setGlobalMcpServers: (mcps: McpServer[]) => void;

  // Skills
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  globalSkills: Skill[];
  setGlobalSkills: (skills: Skill[]) => void;

  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  globalAgents: Agent[];
  setGlobalAgents: (agents: Agent[]) => void;

  // Hooks
  hooks: Hook[];
  setHooks: (hooks: Hook[]) => void;

  // Profiles
  profiles: LaunchProfile[];
  setProfiles: (profiles: LaunchProfile[]) => void;

  // CLI
  cliStatus: CliStatus | null;
  setCliStatus: (status: CliStatus | null) => void;
  isClaudeRunning: boolean;
  setIsClaudeRunning: (running: boolean) => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  currentPage: string;
  setCurrentPage: (page: string) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Notifications
  notifications: { id: string; type: "success" | "error" | "info" | "warning"; message: string }[];
  addNotification: (notification: Omit<AppState["notifications"][0], "id">) => void;
  removeNotification: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  selectedProject: null,
  setSelectedProject: (selectedProject) => set({ selectedProject }),

  // MCP
  mcpServers: [],
  setMcpServers: (mcpServers) => set({ mcpServers }),
  globalMcpServers: [],
  setGlobalMcpServers: (globalMcpServers) => set({ globalMcpServers }),

  // Skills
  skills: [],
  setSkills: (skills) => set({ skills }),
  globalSkills: [],
  setGlobalSkills: (globalSkills) => set({ globalSkills }),

  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  globalAgents: [],
  setGlobalAgents: (globalAgents) => set({ globalAgents }),

  // Hooks
  hooks: [],
  setHooks: (hooks) => set({ hooks }),

  // Profiles
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),

  // CLI
  cliStatus: null,
  setCliStatus: (cliStatus) => set({ cliStatus }),
  isClaudeRunning: false,
  setIsClaudeRunning: (isClaudeRunning) => set({ isClaudeRunning }),

  // UI State
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  currentPage: "dashboard",
  setCurrentPage: (currentPage) => set({ currentPage }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `${Date.now()}-${Math.random()}` },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));