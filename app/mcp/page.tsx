"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Server,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { McpServer } from "@/lib/types";
import { parseEnvString } from "@/lib/utils";

export default function McpPage() {
  const { selectedProject, globalMcpServers, setGlobalMcpServers } = useStore();
  const [projectMcps, setProjectMcps] = useState<McpServer[]>([]);
  const [globalMcps, setGlobalMcps] = useState<McpServer[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    command: "",
    args: "",
    env: "",
    scope: "global" as "global" | "project",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasMcpJson, setHasMcpJson] = useState(false);

  useEffect(() => {
    loadGlobalMcps();
    if (selectedProject) {
      loadProjectMcps(selectedProject.path);
    }
  }, [selectedProject]);

  async function loadGlobalMcps() {
    try {
      const res = await fetch("/api/mcp");
      const data = await res.json();
      if (data.success) {
        setGlobalMcps(data.data || []);
        setGlobalMcpServers(data.data || []);
      }
    } catch (error) {
      console.error("Error loading MCPs:", error);
    }
  }

  async function loadProjectMcps(projectPath: string) {
    try {
      // Check if .mcp.json exists
      const mcpJsonPath = `${projectPath}/.mcp.json`;
      setHasMcpJson(mcpJsonPath.startsWith("/"));

      const res = await fetch(`/api/mcp?projectPath=${encodeURIComponent(projectPath)}`);
      const data = await res.json();
      if (data.success) {
        setProjectMcps(data.data || []);
      }
    } catch (error) {
      console.error("Error loading project MCPs:", error);
    }
  }

  async function addMcp() {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        command: formData.command,
        args: formData.args,
        env: parseEnvString(formData.env),
        scope: formData.scope,
        projectPath: formData.scope === "project" ? selectedProject?.path : undefined,
      };

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setFormData({ name: "", command: "", args: "", env: "", scope: "global" });
        if (selectedProject && formData.scope === "project") {
          loadProjectMcps(selectedProject.path);
        } else {
          loadGlobalMcps();
        }
      }
    } catch (error) {
      console.error("Error adding MCP:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMcp(name: string, scope: string) {
    try {
      const url = `/api/mcp?name=${encodeURIComponent(name)}` +
        (scope === "project" && selectedProject ? `&projectPath=${encodeURIComponent(selectedProject.path)}` : "");

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (scope === "project") {
          loadProjectMcps(selectedProject!.path);
        } else {
          loadGlobalMcps();
        }
      }
    } catch (error) {
      console.error("Error deleting MCP:", error);
    }
  }

  // Check if MCP already exists in project
  const projectMcpNames = new Set(projectMcps.map(m => m.name));

  return (
    <>
      <Header
        title="MCP Servers"
        description={selectedProject
          ? `Managing MCPs for ${selectedProject.name}`
          : "Manage Model Context Protocol servers"}
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add MCP
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add MCP Server</DialogTitle>
                <DialogDescription>
                  {selectedProject
                    ? `Add MCP to ${selectedProject.name}`
                    : "Add a new MCP server to global configuration"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., sequential-thinking"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Input
                    placeholder="e.g., npx, uvx, node"
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arguments (space-separated)</Label>
                  <Input
                    placeholder="e.g., -y @modelcontextprotocol/server-sequential-thinking"
                    value={formData.args}
                    onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Environment Variables (KEY=VALUE, one per line)</Label>
                  <Textarea
                    placeholder="API_KEY=your-key-here"
                    value={formData.env}
                    onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                    className="font-mono text-sm"
                    rows={3}
                  />
                </div>
                {selectedProject && (
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={formData.scope === "global" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, scope: "global" })}
                      >
                        Global
                      </Button>
                      <Button
                        variant={formData.scope === "project" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, scope: "project" })}
                      >
                        Project
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={addMcp}
                  disabled={isSaving || !formData.name || !formData.command}
                >
                  Add MCP
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageWrapper>
        <div className="space-y-6">
          {/* Quick Add Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Add</CardTitle>
              <CardDescription>Popular MCP servers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: "sequential-thinking",
                      command: "npx",
                      args: "-y @modelcontextprotocol/server-sequential-thinking",
                      env: "",
                      scope: selectedProject ? "project" : "global",
                    });
                    setIsAddOpen(true);
                  }}
                >
                  <Server className="mr-2 h-4 w-4" />
                  sequential-thinking
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: "context7",
                      command: "npx",
                      args: "-y @upstash/context7-mcp@latest",
                      env: "",
                      scope: selectedProject ? "project" : "global",
                    });
                    setIsAddOpen(true);
                  }}
                >
                  <Server className="mr-2 h-4 w-4" />
                  context7
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: "code-review-graph",
                      command: "uvx",
                      args: "code-review-graph serve",
                      env: "",
                      scope: selectedProject ? "project" : "global",
                    });
                    setIsAddOpen(true);
                  }}
                >
                  <Server className="mr-2 h-4 w-4" />
                  code-review-graph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      name: "codebase-memory",
                      command: "/home/astro/.local/bin/codebase-memory-mcp",
                      args: "",
                      env: "",
                      scope: selectedProject ? "project" : "global",
                    });
                    setIsAddOpen(true);
                  }}
                >
                  <Server className="mr-2 h-4 w-4" />
                  codebase-memory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Project MCPs */}
          {selectedProject && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project MCPs</CardTitle>
                    <CardDescription>
                      {hasMcpJson ? "Using .mcp.json" : "Using .claude/settings.json"}
                    </CardDescription>
                  </div>
                  <Badge variant={hasMcpJson ? "default" : "secondary"}>
                    {projectMcps.length} configured
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {projectMcps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Server className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No project MCPs configured</p>
                    <p className="text-sm text-muted-foreground">
                      Add from global MCPs below or create new
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMcps.map((mcp) => (
                      <div
                        key={mcp.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Server className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{mcp.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                Project
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              {mcp.command} {mcp.args.join(" ")}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMcp(mcp.name, "project")}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add from Global MCPs */}
          {selectedProject && globalMcps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Add from Global</CardTitle>
                <CardDescription>Copy global MCP to this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {globalMcps.map((mcp) => (
                    <div
                      key={mcp.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Server className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{mcp.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {mcp.command} {mcp.args.join(" ")}
                          </p>
                        </div>
                      </div>
                      {projectMcpNames.has(mcp.name) ? (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Added
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const payload = {
                              name: mcp.name,
                              command: mcp.command,
                              args: mcp.args.join(" "),
                              env: Object.entries(mcp.env).map(([k, v]) => `${k}=${v}`).join("\n"),
                              scope: "project",
                              projectPath: selectedProject?.path,
                            };

                            await fetch("/api/mcp", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload),
                            });

                            loadProjectMcps(selectedProject!.path);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Add to Project
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Global MCPs */}
          <Card>
            <CardHeader>
              <CardTitle>Global MCPs</CardTitle>
              <CardDescription>Available across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {globalMcps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Server className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No global MCP servers configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {globalMcps.map((mcp) => (
                    <div
                      key={mcp.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{mcp.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              Global
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {mcp.command} {mcp.args.join(" ")}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMcp(mcp.name, "global")}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}