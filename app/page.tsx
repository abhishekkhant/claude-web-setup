"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/useStore";
import {
  FolderOpen,
  Server,
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, contractPath } from "@/lib/utils";

interface Stats {
  projects: number;
  mcps: number;
  skills: number;
}

export default function DashboardPage() {
  const { projects, setProjects, selectedProject, globalMcpServers, setGlobalMcpServers, globalSkills, setGlobalSkills } = useStore();
  const [stats, setStats] = useState<Stats>({ projects: 0, mcps: 0, skills: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsRes, mcpsRes, skillsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/mcp"),
        fetch("/api/skills"),
      ]);

      const projectsData = await projectsRes.json();
      const mcpsData = await mcpsRes.json();
      const skillsData = await skillsRes.json();

      if (projectsData.success) {
        setProjects(projectsData.data || []);
      }
      if (mcpsData.success) {
        setGlobalMcpServers(mcpsData.data || []);
      }
      if (skillsData.success) {
        setGlobalSkills(skillsData.data || []);
      }

      setStats({
        projects: projectsData.data?.length || 0,
        mcps: mcpsData.data?.length || 0,
        skills: skillsData.data?.length || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your Claude Code configuration"
      />
      <PageWrapper>
        <div className="space-y-6">
          {/* Active Project */}
          {selectedProject && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Active Project</CardTitle>
                    <Badge variant="secondary">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Selected
                    </Badge>
                  </div>
                </div>
                <CardDescription>{selectedProject.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-mono">{selectedProject.path}</p>
                    <div className="mt-3 flex gap-2">
                      {selectedProject.mcpCount > 0 && (
                        <Badge variant="outline">{selectedProject.mcpCount} MCPs</Badge>
                      )}
                      {selectedProject.hasClaudeMd && (
                        <Badge variant="outline">CLAUDE.md</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/mcp">
                      <Button variant="outline" size="sm">
                        <Server className="mr-2 h-4 w-4" />
                        MCPs
                      </Button>
                    </Link>
                    <Link href="/skills">
                      <Button variant="outline" size="sm">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Skills
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link href="/projects">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <FolderOpen className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.projects}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/mcp">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                    <Server className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.mcps}</p>
                    <p className="text-sm text-muted-foreground">MCP Servers</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/skills">
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.skills}</p>
                    <p className="text-sm text-muted-foreground">Skills</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
                  <CardDescription>Claude-enabled projects</CardDescription>
                </div>
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-muted-foreground">No projects found</p>
                    <Link href="/projects">
                      <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects?path=${encodeURIComponent(project.path)}`}
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <FolderOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {contractPath(project.path)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.hasClaudeMd && (
                              <Badge variant="outline" className="text-xs">
                                CLAUDE.md
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(project.lastModified)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full h-auto py-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          <span className="font-medium">Add Project</span>
                        </div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/mcp">
                    <Button variant="outline" className="w-full h-auto py-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <span className="font-medium">Add MCP</span>
                        </div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/skills">
                    <Button variant="outline" className="w-full h-auto py-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">Create Skill</span>
                        </div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/config">
                    <Button variant="outline" className="w-full h-auto py-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          <span className="font-medium">Settings</span>
                        </div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}