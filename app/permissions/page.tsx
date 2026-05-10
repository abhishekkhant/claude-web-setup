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
import { Separator } from "@/components/ui/separator";
import { Shield, Plus, Trash2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { PermissionRule } from "@/lib/types";

export default function PermissionsPage() {
  const [rules, setRules] = useState<PermissionRule[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "allow" as "allow" | "ask" | "deny",
    match: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      const res = await fetch("/api/config?scope=global");
      const data = await res.json();
      if (data.success) {
        setRules(data.data?.permissions || []);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  }

  async function savePermissions(newRules: PermissionRule[]) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "global",
          settings: { permissions: newRules },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRules(newRules);
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function addRule() {
    const newRule: PermissionRule = {
      type: formData.type,
      match: formData.match,
      description: formData.description,
    };
    await savePermissions([...rules, newRule]);
    setIsAddOpen(false);
    setFormData({ type: "allow", match: "", description: "" });
  }

  async function deleteRule(index: number) {
    const newRules = rules.filter((_, i) => i !== index);
    await savePermissions(newRules);
  }

  const presets = [
    { name: "Safe Defaults", description: "Minimal permissions for safe operation" },
    { name: "Developer", description: "Common developer permissions" },
    { name: "Full Access", description: "All permissions granted" },
  ];

  const allowRules = rules.filter((r) => r.type === "allow");
  const askRules = rules.filter((r) => r.type === "ask");
  const denyRules = rules.filter((r) => r.type === "deny");

  return (
    <>
      <Header
        title="Permissions"
        description="Manage Claude Code permission rules"
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Permission Rule</DialogTitle>
                <DialogDescription>
                  Define patterns for allow, ask, or deny rules
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "allow" | "ask" | "deny") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow - Auto-permit</SelectItem>
                      <SelectItem value="ask">Ask - Prompt user</SelectItem>
                      <SelectItem value="deny">Deny - Block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Match Pattern (glob or regex)</Label>
                  <Input
                    placeholder="e.g., *.js, **/src/**, ^npm.*"
                    value={formData.match}
                    onChange={(e) => setFormData({ ...formData, match: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Why this rule exists"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addRule} disabled={isSaving || !formData.match}>
                  Add Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageWrapper>
        <div className="space-y-6">
          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Presets</CardTitle>
              <CardDescription>Common permission configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button key={preset.name} variant="outline" size="sm">
                    <Shield className="mr-2 h-4 w-4" />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allow Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>Allow Rules</CardTitle>
              </div>
              <CardDescription>Auto-permit matching operations</CardDescription>
            </CardHeader>
            <CardContent>
              {allowRules.length === 0 ? (
                <p className="text-muted-foreground text-sm">No allow rules defined</p>
              ) : (
                <div className="space-y-2">
                  {allowRules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/5 p-3"
                    >
                      <div>
                        <code className="text-sm font-mono">{rule.match}</code>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteRule(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ask Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-yellow-500" />
                <CardTitle>Ask Rules</CardTitle>
              </div>
              <CardDescription>Prompt user before allowing</CardDescription>
            </CardHeader>
            <CardContent>
              {askRules.length === 0 ? (
                <p className="text-muted-foreground text-sm">No ask rules defined</p>
              ) : (
                <div className="space-y-2">
                  {askRules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3"
                    >
                      <div>
                        <code className="text-sm font-mono">{rule.match}</code>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteRule(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deny Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <CardTitle>Deny Rules</CardTitle>
              </div>
              <CardDescription>Block matching operations</CardDescription>
            </CardHeader>
            <CardContent>
              {denyRules.length === 0 ? (
                <p className="text-muted-foreground text-sm">No deny rules defined</p>
              ) : (
                <div className="space-y-2">
                  {denyRules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-red-500/30 bg-red-500/5 p-3"
                    >
                      <div>
                        <code className="text-sm font-mono">{rule.match}</code>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground">{rule.description}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteRule(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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