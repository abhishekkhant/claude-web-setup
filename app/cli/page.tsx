"use client";

import { useEffect, useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Terminal,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  TerminalIcon,
} from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { CliStatus, LaunchProfile } from "@/lib/types";
import { contractPath } from "@/lib/utils";

export default function CliPage() {
  const { cliStatus, setCliStatus, isClaudeRunning, setIsClaudeRunning, profiles, setProfiles } = useStore();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStatus();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logOutput]);

  async function loadStatus() {
    try {
      const res = await fetch("/api/cli/status");
      const data = await res.json();
      if (data.success) {
        setCliStatus(data.data);
        setIsClaudeRunning(false); // For now, we track session-based
      }
    } catch (error) {
      console.error("Error loading CLI status:", error);
    }
  }

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

  async function launchClaude() {
    if (!selectedProject) return;

    setIsLaunching(true);
    setLogOutput([]);

    try {
      const res = await fetch("/api/cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath: selectedProject,
          profile: selectedProfile,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsClaudeRunning(true);
        addLog("info", "Claude launched successfully");
      } else {
        addLog("error", data.error || "Failed to launch Claude");
      }
    } catch (error) {
      addLog("error", String(error));
    } finally {
      setIsLaunching(false);
    }
  }

  async function stopClaude() {
    try {
      const res = await fetch("/api/cli", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setIsClaudeRunning(false);
        addLog("info", "Claude stopped");
      }
    } catch (error) {
      addLog("error", String(error));
    }
  }

  function addLog(type: "info" | "error" | "output", message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogOutput((prev) => [...prev, `[${timestamp}] [${type.toUpperCase()}] ${message}`]);
  }

  const modelOptions = [
    { value: "sonnet-4.6", label: "Sonnet 4.6" },
    { value: "sonnet-4.5", label: "Sonnet 4.5" },
    { value: "haiku-4.5", label: "Haiku 4.5" },
    { value: "opus-4.6", label: "Opus 4.6" },
  ];

  return (
    <>
      <Header
        title="Claude CLI"
        description="Launch and manage Claude Code"
        actions={
          <Button variant="outline" onClick={loadStatus}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <PageWrapper>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Claude CLI installation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Installation</span>
                  {cliStatus?.installed ? (
                    <Badge variant="success">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Found
                    </Badge>
                  )}
                </div>
                {cliStatus?.version && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="font-mono text-sm">{cliStatus.version}</span>
                  </div>
                )}
                {cliStatus?.path && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Path</span>
                    <span className="font-mono text-xs truncate max-w-[150px]" title={cliStatus.path}>
                      {contractPath(cliStatus.path)}
                    </span>
                  </div>
                )}
                {cliStatus?.error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm text-destructive">{cliStatus.error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Launch Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Launch</CardTitle>
              <CardDescription>Start Claude Code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project Path</Label>
                <Input
                  placeholder="/path/to/project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Model (optional)</Label>
                <Select defaultValue="sonnet-4.6">
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
                <Label>Profile (optional)</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex gap-2">
                {isClaudeRunning ? (
                  <Button variant="destructive" onClick={stopClaude} className="flex-1">
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={launchClaude}
                    disabled={!selectedProject || isLaunching || !cliStatus?.installed}
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Launch
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Log */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Session Log</CardTitle>
              <CardDescription>Output from Claude session</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] rounded-md border bg-black/50 p-2 font-mono text-xs">
                {logOutput.length === 0 ? (
                  <p className="text-muted-foreground">No output yet</p>
                ) : (
                  logOutput.map((line, index) => (
                    <div
                      key={index}
                      className={`${
                        line.includes("[ERROR]") ? "text-red-400" :
                        line.includes("[INFO]") ? "text-blue-400" :
                        "text-foreground"
                      }`}
                    >
                      {line}
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick tips for using Claude Code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4">
                <TerminalIcon className="mb-2 h-5 w-5 text-primary" />
                <h4 className="font-medium">Basic Usage</h4>
                <p className="text-sm text-muted-foreground">
                  Run <code className="rounded bg-muted px-1">claude</code> in your terminal
                </p>
              </div>
              <div className="rounded-md border p-4">
                <TerminalIcon className="mb-2 h-5 w-5 text-primary" />
                <h4 className="font-medium">Project Context</h4>
                <p className="text-sm text-muted-foreground">
                  Add a CLAUDE.md file to your project for context
                </p>
              </div>
              <div className="rounded-md border p-4">
                <TerminalIcon className="mb-2 h-5 w-5 text-primary" />
                <h4 className="font-medium">MCP Servers</h4>
                <p className="text-sm text-muted-foreground">
                  Use MCPs for extended capabilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    </>
  );
}