"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Save, Plus, Clock } from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { MemoryFile } from "@/lib/types";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryFile[]>([]);
  const [activeTab, setActiveTab] = useState("global");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    loadMemories();
  }, [activeTab]);

  async function loadMemories() {
    try {
      const res = await fetch(`/api/memory?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setMemories([data.data].filter(Boolean));
        setContent(data.data?.content || "");
      }
    } catch (error) {
      console.error("Error loading memories:", error);
    }
  }

  async function saveMemory() {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving memory:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Header
        title="Memory Editor"
        description="Manage CLAUDE.md and memory files"
        actions={
          <Button onClick={saveMemory} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        }
      />
      <PageWrapper>
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="global">Global Memory</TabsTrigger>
              <TabsTrigger value="user">User Memory</TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Global CLAUDE.md</CardTitle>
                      <CardDescription>
                        Your personal instructions for Claude Code
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      ~/.claude/CLAUDE.md
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div data-color-mode="dark">
                    <MDEditor
                      height={500}
                      value={content}
                      onChange={(value) => setContent(value || "")}
                      preview="edit"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Memory</CardTitle>
                      <CardDescription>
                        Your preferences and context
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      ~/.ccpm/user-memory.md
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div data-color-mode="dark">
                    <MDEditor
                      height={500}
                      value={content}
                      onChange={(value) => setContent(value || "")}
                      preview="edit"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
              <CardDescription>Start with a template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent(`# Project Context

## Project Overview
- Type:
- Description:

## Tech Stack
- Frontend:
- Backend:
- Database:

## Key Files
- Main entry:
- Config files:
`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Project Setup
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent(`# Coding Standards

## Code Style
- Formatting:
- Naming conventions:

## Testing
- Test framework:
- Coverage requirements:

## Documentation
- Required docs:
`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Coding Standards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent(`# Workflow Notes

## Daily Standup
- Yesterday:
- Today:
- Blockers:

## Code Review
- Review checklist:

## Deployment
- Process:
- Rollback steps:
`)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Workflow Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}