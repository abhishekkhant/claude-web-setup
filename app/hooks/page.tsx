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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Anchor, Plus, MoreVertical, Trash2, Play, Zap } from "lucide-react";
import { useStore } from "@/stores/useStore";
import type { Hook } from "@/lib/types";
import { parseArgsString, formatArgs } from "@/lib/utils";

export default function HooksPage() {
  const { hooks, setHooks } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "before" as "before" | "after" | "prompt" | "http",
    command: "",
    args: "",
    async: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadHooks();
  }, []);

  async function loadHooks() {
    try {
      const res = await fetch("/api/hooks");
      const data = await res.json();
      if (data.success) {
        setHooks(data.data || []);
      }
    } catch (error) {
      console.error("Error loading hooks:", error);
    }
  }

  async function addHook() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setFormData({
          name: "",
          type: "before",
          command: "",
          args: "",
          async: false,
        });
        loadHooks();
      }
    } catch (error) {
      console.error("Error adding hook:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteHook(name: string) {
    try {
      const res = await fetch(`/api/hooks?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        loadHooks();
      }
    } catch (error) {
      console.error("Error deleting hook:", error);
    }
  }

  const beforeHooks = hooks.filter((h) => h.type === "before");
  const afterHooks = hooks.filter((h) => h.type === "after");
  const promptHooks = hooks.filter((h) => h.type === "prompt");
  const httpHooks = hooks.filter((h) => h.type === "http");

  return (
    <>
      <Header
        title="Hooks Manager"
        description="Manage Claude Code hooks"
        actions={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Hook
          </Button>
        }
      />
      <PageWrapper>
        <div className="space-y-6">
          {/* Add Hook Dialog */}
          {isAddOpen && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Add New Hook</CardTitle>
                <CardDescription>
                  Hooks run scripts before, after, or during Claude's execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., log-conversation"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "before" | "after" | "prompt" | "http") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Before</SelectItem>
                        <SelectItem value="after">After</SelectItem>
                        <SelectItem value="prompt">Prompt</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Input
                    placeholder="e.g., tee, curl, sed"
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arguments (comma-separated)</Label>
                  <Input
                    placeholder="e.g., -a, /tmp/log.txt"
                    value={formData.args}
                    onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.async}
                      onCheckedChange={(checked) => setFormData({ ...formData, async: checked })}
                    />
                    <Label>Async</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addHook} disabled={isSaving || !formData.name || !formData.command}>
                    Add Hook
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Before Hooks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <CardTitle>Before Hooks</CardTitle>
              </div>
              <CardDescription>Run before Claude responds</CardDescription>
            </CardHeader>
            <CardContent>
              {beforeHooks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No before hooks defined</p>
              ) : (
                <div className="space-y-2">
                  {beforeHooks.map((hook) => (
                    <HookCard key={hook.id} hook={hook} onDelete={() => deleteHook(hook.name)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* After Hooks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-blue-500" />
                <CardTitle>After Hooks</CardTitle>
              </div>
              <CardDescription>Run after Claude responds</CardDescription>
            </CardHeader>
            <CardContent>
              {afterHooks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No after hooks defined</p>
              ) : (
                <div className="space-y-2">
                  {afterHooks.map((hook) => (
                    <HookCard key={hook.id} hook={hook} onDelete={() => deleteHook(hook.name)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Hooks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-purple-500" />
                <CardTitle>Prompt Hooks</CardTitle>
              </div>
              <CardDescription>Modify the prompt before processing</CardDescription>
            </CardHeader>
            <CardContent>
              {promptHooks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No prompt hooks defined</p>
              ) : (
                <div className="space-y-2">
                  {promptHooks.map((hook) => (
                    <HookCard key={hook.id} hook={hook} onDelete={() => deleteHook(hook.name)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* HTTP Hooks */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-green-500" />
                <CardTitle>HTTP Hooks</CardTitle>
              </div>
              <CardDescription>HTTP webhook hooks</CardDescription>
            </CardHeader>
            <CardContent>
              {httpHooks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No HTTP hooks defined</p>
              ) : (
                <div className="space-y-2">
                  {httpHooks.map((hook) => (
                    <HookCard key={hook.id} hook={hook} onDelete={() => deleteHook(hook.name)} />
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

function HookCard({ hook, onDelete }: { hook: Hook; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Anchor className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{hook.name}</p>
            {hook.async && <Badge variant="outline">Async</Badge>}
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {hook.command} {hook.args.join(" ")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Play className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}