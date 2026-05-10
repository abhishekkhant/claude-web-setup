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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  Users,
  Plus,
  MoreVertical,
  Trash2,
  Zap,
  Brain,
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const { agents, setAgents } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    model: "sonnet-4.6",
    effort: 3,
    systemPrompt: "",
    allowedTools: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  }

  async function createAgent() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setFormData({
          name: "",
          description: "",
          model: "sonnet-4.6",
          effort: 3,
          systemPrompt: "",
          allowedTools: [],
        });
        loadAgents();
      }
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAgent(name: string) {
    try {
      const res = await fetch(`/api/agents?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        loadAgents();
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  }

  const modelOptions = [
    { value: "sonnet-4.6", label: "Sonnet 4.6" },
    { value: "sonnet-4.5", label: "Sonnet 4.5" },
    { value: "haiku-4.5", label: "Haiku 4.5" },
    { value: "opus-4.6", label: "Opus 4.6" },
  ];

  const toolOptions = [
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Glob",
    "Grep",
    "TodoRead",
    "TodoWrite",
    "WebFetch",
    "WebSearch",
  ];

  return (
    <>
      <Header
        title="Agents"
        description="Manage Claude Code subagents"
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Subagent</DialogTitle>
                <DialogDescription>
                  Subagents are specialized AI agents with custom prompts and settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., code-reviewer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={formData.model}
                      onValueChange={(value) => setFormData({ ...formData, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Effort Level</Label>
                    <Slider
                      value={[formData.effort]}
                      onValueChange={([value]) => setFormData({ ...formData, effort: value })}
                      max={5}
                      min={1}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    placeholder="Define the agent's behavior and capabilities..."
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed Tools (comma-separated)</Label>
                  <Input
                    placeholder="e.g., Read, Write, Bash, Glob"
                    value={formData.allowedTools.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowedTools: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {toolOptions.map((tool) => (
                      <Badge
                        key={tool}
                        variant={formData.allowedTools.includes(tool) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const newTools = formData.allowedTools.includes(tool)
                            ? formData.allowedTools.filter((t) => t !== tool)
                            : [...formData.allowedTools, tool];
                          setFormData({ ...formData, allowedTools: newTools });
                        }}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createAgent}
                  disabled={isSaving || !formData.name || !formData.systemPrompt}
                >
                  Create Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageWrapper>
        <div className="space-y-4">
          {agents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No agents created</h3>
                <p className="text-sm text-muted-foreground">
                  Create subagents for specialized tasks
                </p>
                <Button onClick={() => setIsAddOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id} className="card-hover">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{agent.name}</CardTitle>
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
                            onClick={() => deleteAgent(agent.name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Model</span>
                        <Badge variant="outline">{agent.model}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Effort</span>
                        <Badge variant="outline">{agent.effort}/5</Badge>
                      </div>
                      {agent.allowedTools && agent.allowedTools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.allowedTools.slice(0, 3).map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {agent.allowedTools.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{agent.allowedTools.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  );
}