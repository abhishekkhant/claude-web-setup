"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/stores/useStore";
import {
  FolderOpen,
  Settings,
  Server,
  Sparkles,
  ChevronDown,
  Plus,
  Search,
  X,
  Check,
  LayoutDashboard,
  Users,
  Anchor,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import type { Project } from "@/lib/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mcp", label: "MCP Servers", icon: Server },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/hooks", label: "Hooks", icon: Anchor },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/config", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    projects,
    setProjects,
    selectedProject,
    setSelectedProject,
    sidebarCollapsed,
    setSidebarCollapsed
  } = useStore();

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.path.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectOpen(false);
    setProjectSearch("");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo & Project Switcher */}
        <div className="border-b p-3">
          {!sidebarCollapsed ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProjectOpen(!isProjectOpen)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent",
                  isProjectOpen && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {selectedProject?.name || "Select Project"}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isProjectOpen && "rotate-180"
                )} />
              </button>

              {isProjectOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-background shadow-lg">
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full rounded-md border bg-secondary py-2 pl-9 pr-8 text-sm outline-none focus:border-primary"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      {projectSearch && (
                        <button
                          onClick={() => setProjectSearch("")}
                          className="absolute right-2.5 top-2.5"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border-t p-1">
                    <Link
                      href="/projects"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => {
                        setIsProjectOpen(false);
                        setProjectSearch("");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Browse Projects</span>
                    </Link>

                    {filteredProjects.length > 0 && (
                      <div className="border-t py-1">
                        {filteredProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent",
                              selectedProject?.id === project.id && "bg-accent"
                            )}
                          >
                            <div className="truncate">
                              <div className="font-medium">{project.name}</div>
                              <div className="truncate text-xs text-muted-foreground">{project.path}</div>
                            </div>
                            {selectedProject?.id === project.id && (
                              <Check className="h-4 w-4 shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Project Info */}
        {!sidebarCollapsed && selectedProject && (
          <div className="border-t p-3">
            <div className="rounded-md bg-muted p-3">
              <div className="text-xs font-medium">Active: {selectedProject.name}</div>
              <div className="mt-1 flex gap-1.5">
                {selectedProject.mcpCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {selectedProject.mcpCount} MCPs
                  </span>
                )}
                {selectedProject.hasClaudeMd && (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                    CLAUDE.md
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <div className="border-t p-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "flex w-full items-center justify-center rounded-md py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              sidebarCollapsed && "px-0"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}