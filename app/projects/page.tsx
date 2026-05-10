"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FolderOpen,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Grid,
  List,
  Check,
  X,
} from "lucide-react";
import { formatRelativeTime, contractPath } from "@/lib/utils";
import { useStore } from "@/stores/useStore";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { projects, setProjects, selectedProject, setSelectedProject } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isScanning, setIsScanning] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadProjects();
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

  async function scanProjects() {
    setIsScanning(true);
    try {
      const res = await fetch("/api/projects", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error scanning projects:", error);
    } finally {
      setIsScanning(false);
    }
  }

  async function addProjectByPath() {
    if (!newProjectPath.trim()) return;

    setIsAdding(true);
    try {
      // Create project from path via API
      const res = await fetch("/api/projects/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: newProjectPath.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        loadProjects();
        setIsAddOpen(false);
        setNewProjectPath("");
      }
    } catch (error) {
      console.error("Error adding project:", error);
    } finally {
      setIsAdding(false);
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header
        title="Projects"
        description="Manage Claude-enabled projects"
        actions={
          <div className="flex gap-2">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Project</DialogTitle>
                  <DialogDescription>
                    Enter the path to a project folder to add it to your list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project Path</Label>
                    <Input
                      placeholder="e.g., /home/astro/Projects/my-project"
                      value={newProjectPath}
                      onChange={(e) => setNewProjectPath(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the full path to your project directory
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addProjectByPath} disabled={isAdding || !newProjectPath.trim()}>
                    Add Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={scanProjects} disabled={isScanning}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isScanning && "animate-spin"}`} />
              Scan
            </Button>
          </div>
        }
      />
      <PageWrapper>
        <div className="space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Scan your filesystem or add a project manually"}
                </p>
                {!searchQuery && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={scanProjects} disabled={isScanning}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isScanning && "animate-spin"}`} />
                      Scan Projects
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`card-hover cursor-pointer ${selectedProject?.id === project.id ? "border-primary" : ""}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        {selectedProject?.id === project.id && (
                          <Badge variant="default" className="ml-1">
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="truncate" title={project.path}>
                      {contractPath(project.path)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {project.hasClaudeMd && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="mr-1 h-3 w-3" />
                            CLAUDE.md
                          </Badge>
                        )}
                        {project.mcpCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {project.mcpCount} MCP
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {formatRelativeTime(project.lastModified)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 cursor-pointer ${selectedProject?.id === project.id ? "bg-muted" : ""}`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-center gap-4">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {contractPath(project.path)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {project.hasClaudeMd && (
                            <Badge variant="outline" className="text-xs">
                              CLAUDE.md
                            </Badge>
                          )}
                          {project.mcpCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {project.mcpCount} MCP
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(project.lastModified)}
                        </span>
                        {selectedProject?.id === project.id && (
                          <Badge variant="default">
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
    </>
  );
}