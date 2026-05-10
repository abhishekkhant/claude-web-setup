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
import { Rocket, Plus, MoreVertical, Trash2, Play, Zap } from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { LaunchProfile } from "@/lib/types";

export default function ProfilesPage() {
  const { profiles, setProfiles } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    model: "sonnet-4.6",
    effort: 3,
    mcpServers: [] as string[],
    permissions: [] as string[],
    skills: [] as string[],
    scope: "global" as "global" | "project",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data || []);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  }

  async function createProfile() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setFormData({
          name: "",
          model: "sonnet-4.6",
          effort: 3,
          mcpServers: [],
          permissions: [],
          skills: [],
          scope: "global",
        });
        loadProfiles();
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProfile(id: string) {
    try {
      const res = await fetch(`/api/profiles?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        loadProfiles();
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  }

  const modelOptions = [
    { value: "sonnet-4.6", label: "Sonnet 4.6" },
    { value: "sonnet-4.5", label: "Sonnet 4.5" },
    { value: "haiku-4.5", label: "Haiku 4.5" },
    { value: "opus-4.6", label: "Opus 4.6" },
  ];

  const defaultProfiles = [
    { name: "Quick Chat", model: "haiku-4.5", effort: 1 },
    { name: "Deep Analysis", model: "sonnet-4.6", effort: 5 },
    { name: "Code Review", model: "sonnet-4.6", effort: 3 },
  ];

  return (
    <>
      <Header
        title="Launch Profiles"
        description="Create and manage Claude launch profiles"
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Launch Profile</DialogTitle>
                <DialogDescription>
                  Define settings for quick Claude launches
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Profile Name</Label>
                  <Input
                    placeholder="e.g., My Project"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
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
                  <Label>MCP Servers (comma-separated)</Label>
                  <Input
                    placeholder="e.g., sequential-thinking, context7"
                    value={formData.mcpServers.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mcpServers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createProfile} disabled={isSaving || !formData.name}>
                  Create Profile
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
              <CardTitle>Quick Start Profiles</CardTitle>
              <CardDescription>Common launch configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {defaultProfiles.map((profile) => (
                  <Button
                    key={profile.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: profile.name,
                        model: profile.model,
                        effort: profile.effort,
                        mcpServers: [],
                        permissions: [],
                        skills: [],
                        scope: "global",
                      });
                      setIsAddOpen(true);
                    }}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    {profile.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profiles Grid */}
          {profiles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Rocket className="h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No profiles created</h3>
                <p className="text-sm text-muted-foreground">
                  Create launch profiles for quick access
                </p>
                <Button onClick={() => setIsAddOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <Card key={profile.id} className="card-hover">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{profile.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteProfile(profile.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Model</span>
                        <Badge variant="outline">{profile.model}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Effort</span>
                        <Badge variant="outline">{profile.effort}/5</Badge>
                      </div>
                      {profile.mcpServers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.mcpServers.slice(0, 2).map((mcp) => (
                            <Badge key={mcp} variant="secondary" className="text-xs">
                              {mcp}
                            </Badge>
                          ))}
                          {profile.mcpServers.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{profile.mcpServers.length - 2}
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