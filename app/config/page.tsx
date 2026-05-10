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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { formatJson, isValidJson } from "@/lib/utils";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("global");
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [localSettings, setLocalSettings] = useState<Record<string, unknown>>({});
  const [rawJson, setRawJson] = useState("");
  const [localRawJson, setLocalRawJson] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [activeTab]);

  async function loadConfig() {
    try {
      const scope = activeTab === "global" ? "global" : "local";
      const res = await fetch(`/api/config?scope=${scope}`);
      const data = await res.json();
      if (data.success) {
        const loaded = data.data || {};
        setSettings(loaded);
        setRawJson(formatJson(loaded));
        if (scope === "local") {
          setLocalSettings(loaded);
          setLocalRawJson(formatJson(loaded));
        }
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  }

  async function saveConfig() {
    setIsSaving(true);
    setSaveStatus("idle");
    setValidationError(null);

    try {
      let jsonToSave: Record<string, unknown>;

      if (activeTab === "global") {
        if (!isValidJson(rawJson)) {
          setValidationError("Invalid JSON");
          setSaveStatus("error");
          setIsSaving(false);
          return;
        }
        jsonToSave = JSON.parse(rawJson);
      } else {
        if (!isValidJson(localRawJson)) {
          setValidationError("Invalid JSON");
          setSaveStatus("error");
          setIsSaving(false);
          return;
        }
        jsonToSave = JSON.parse(localRawJson);
      }

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: activeTab,
          settings: jsonToSave,
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
      console.error("Error saving config:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  const currentJson = activeTab === "global" ? rawJson : localRawJson;
  const setJson = activeTab === "global" ? setRawJson : setLocalRawJson;

  const modelOptions = [
    { value: "sonnet-4.6", label: "Sonnet 4.6" },
    { value: "sonnet-4.5", label: "Sonnet 4.5" },
    { value: "haiku-4.5", label: "Haiku 4.5" },
    { value: "opus-4.6", label: "Opus 4.6" },
  ];

  return (
    <>
      <Header
        title="Configuration"
        description="Edit Claude Code settings"
        actions={
          <div className="flex items-center gap-2">
            {saveStatus === "success" && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Saved
              </Badge>
            )}
            {saveStatus === "error" && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Error
              </Badge>
            )}
            <Button onClick={saveConfig} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        }
      />
      <PageWrapper>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="global">Global Settings</TabsTrigger>
            <TabsTrigger value="local">Local Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Visual Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Visual Editor</CardTitle>
                  <CardDescription>Edit settings with form controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={(settings.model as string) || "sonnet-4.6"}
                      onValueChange={(value) => setSettings({ ...settings, model: value })}
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

                  <Separator />

                  <div className="space-y-2">
                    <Label>Effort Level</Label>
                    <Slider
                      value={[(settings.effort as number) || 3]}
                      onValueChange={([value]) => setSettings({ ...settings, effort: value })}
                      max={5}
                      min={1}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Quick</span>
                      <span>Thorough</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pretty Print</Label>
                      <p className="text-sm text-muted-foreground">Format JSON output</p>
                    </div>
                    <Switch
                      checked={(settings.prettyPrint as boolean) ?? true}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, prettyPrint: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>DisableAutoApprove</Label>
                      <p className="text-sm text-muted-foreground">Require manual approval</p>
                    </div>
                    <Switch
                      checked={(settings.disableAutoApprove as boolean) ?? false}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, disableAutoApprove: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* JSON Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>JSON Editor</CardTitle>
                  <CardDescription>Raw JSON configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] rounded-lg overflow-hidden border">
                    <MonacoEditor
                      height="100%"
                      language="json"
                      value={rawJson}
                      onChange={(value) => setRawJson(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                  {validationError && (
                    <p className="mt-2 text-sm text-destructive">{validationError}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="local" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Local Settings</CardTitle>
                <CardDescription>
                  Project-specific settings in ~/.claude/settings/local.json
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden border">
                  <MonacoEditor
                    height="100%"
                    language="json"
                    value={localRawJson}
                    onChange={(value) => setLocalRawJson(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-destructive">{validationError}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageWrapper>
    </>
  );
}