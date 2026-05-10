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
  Sparkles,
  Plus,
  MoreVertical,
  Trash2,
  Terminal,
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { Skill } from "@/lib/types";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function SkillsPage() {
  const { selectedProject, globalSkills, setGlobalSkills } = useStore();
  const [projectSkills, setProjectSkills] = useState<Skill[]>([]);
  const [globalSkillsList, setGlobalSkillsList] = useState<Skill[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    command: "",
    content: "",
    scope: "global" as "global" | "project",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGlobalSkills();
    if (selectedProject) {
      loadProjectSkills(selectedProject.path);
    }
  }, [selectedProject]);

  async function loadGlobalSkills() {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (data.success) {
        setGlobalSkillsList(data.data || []);
        setGlobalSkills(data.data || []);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  }

  async function loadProjectSkills(projectPath: string) {
    try {
      const res = await fetch(`/api/skills?projectPath=${encodeURIComponent(projectPath)}`);
      const data = await res.json();
      if (data.success) {
        setProjectSkills(data.data || []);
      }
    } catch (error) {
      console.error("Error loading project skills:", error);
    }
  }

  async function createSkill() {
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        command: formData.command,
        content: formData.content,
        scope: formData.scope,
        projectPath: formData.scope === "project" ? selectedProject?.path : undefined,
      };

      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setFormData({ name: "", description: "", command: "", content: "", scope: "global" });
        if (selectedProject && formData.scope === "project") {
          loadProjectSkills(selectedProject.path);
        } else {
          loadGlobalSkills();
        }
      }
    } catch (error) {
      console.error("Error creating skill:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSkill(name: string, scope: string) {
    try {
      const url = `/api/skills?name=${encodeURIComponent(name)}&scope=${scope}` +
        (scope === "project" && selectedProject ? `&projectPath=${encodeURIComponent(selectedProject.path)}` : "");

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (scope === "project") {
          loadProjectSkills(selectedProject!.path);
        } else {
          loadGlobalSkills();
        }
      }
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  }

  const skillTemplates = [
    {
      name: "explain-code",
      description: "Explain code in detail with complexity analysis",
    },
    {
      name: "write-tests",
      description: "Generate comprehensive test suites",
    },
    {
      name: "review-code",
      description: "Perform thorough code review",
    },
  ];

  // Get names of project skills to avoid duplicates
  const projectSkillNames = new Set(projectSkills.map(s => s.name));

  return (
    <>
      <Header
        title="Skills"
        description={selectedProject
          ? `Managing skills for ${selectedProject.name}`
          : "Manage Claude Code skills"}
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Skill</DialogTitle>
                <DialogDescription>
                  Skills are reusable prompt templates that Claude can use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                      disabled={!selectedProject}
                    >
                      Project
                    </Button>
                  </div>
                  {!selectedProject && (
                    <p className="text-xs text-muted-foreground">
                      Select a project to create project-level skills
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., explain-code"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Command (optional)</Label>
                    <Input
                      placeholder="e.g., /explain"
                      value={formData.command}
                      onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of what this skill does"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skill Content (Markdown)</Label>
                  <div data-color-mode="dark">
                    <MDEditor
                      height={300}
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value || "" })}
                      preview="edit"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createSkill}
                  disabled={isSaving || !formData.name || !formData.content}
                >
                  Create Skill
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
              <CardTitle>Quick Add Templates</CardTitle>
              <CardDescription>Common skill patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skillTemplates.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: template.name,
                        description: template.description,
                        command: `/${template.name}`,
                        content: `# ${template.name}\n\n${template.description}\n\n## Instructions\nAdd your skill instructions here...`,
                        scope: selectedProject ? "project" : "global",
                      });
                      setIsAddOpen(true);
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Skills */}
          {selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle>Project Skills</CardTitle>
                <CardDescription>Skills specific to {selectedProject.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {projectSkills.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No project skills created</p>
                    <p className="text-sm text-muted-foreground">
                      Add from global skills below or create new
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projectSkills.map((skill) => (
                      <Card
                        key={skill.id}
                        className="card-hover cursor-pointer"
                        onClick={() => setSelectedSkill(skill)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <CardTitle className="text-base">{skill.name}</CardTitle>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSkill(skill.name, "project");
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardDescription>{skill.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            {skill.command && (
                              <Badge variant="outline" className="font-mono">
                                <Terminal className="mr-1 h-3 w-3" />
                                {skill.command}
                              </Badge>
                            )}
                            <Badge variant="secondary">Project</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add from Global Skills */}
          {selectedProject && globalSkillsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Add from Global</CardTitle>
                <CardDescription>Copy global skill to this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {globalSkillsList.map((skill) => (
                    <Card
                      key={skill.id}
                      className="card-hover"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">{skill.name}</CardTitle>
                        </div>
                        <CardDescription>{skill.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {projectSkillNames.has(skill.name) ? (
                          <Badge variant="success">Already Added</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const payload = {
                                name: skill.name,
                                description: skill.description,
                                command: skill.command,
                                content: skill.content,
                                scope: "project",
                                projectPath: selectedProject?.path,
                              };

                              await fetch("/api/skills", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                              });

                              loadProjectSkills(selectedProject!.path);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Project
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Global Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Global Skills</CardTitle>
              <CardDescription>Available across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              {globalSkillsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No global skills created</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {globalSkillsList.map((skill) => (
                    <Card
                      key={skill.id}
                      className="card-hover cursor-pointer"
                      onClick={() => setSelectedSkill(skill)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">{skill.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSkill(skill.name, "global");
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>{skill.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          {skill.command && (
                            <Badge variant="outline" className="font-mono">
                              <Terminal className="mr-1 h-3 w-3" />
                              {skill.command}
                            </Badge>
                          )}
                          <Badge variant="secondary">Global</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skill Detail Modal */}
          <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedSkill?.name}</DialogTitle>
                <DialogDescription>{selectedSkill?.description}</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-lg border bg-card p-4">
                  <ReactMarkdown className="prose prose-invert max-w-none">
                    {selectedSkill?.content || ""}
                  </ReactMarkdown>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}