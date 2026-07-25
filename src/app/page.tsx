"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Play,
  ArrowRight,
  ShieldCheck,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApiKey } from "@/context/ApiKeyContext";
import { toast } from "sonner";

interface UsageStats {
  prefix: string;
  requests_today: number;
  limit: number;
  remaining: number;
  reset_time: string;
}

export default function DashboardPage() {
  const { apiKey, keyPrefix, setKeyDetails, clearKey } = useApiKey();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Usage panel state
  const [inputPrefix, setInputPrefix] = useState<string>(() => keyPrefix || "");
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // Generate API Key
  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const keyVal = data.api_key || data.key || "";
      const prefixVal = data.key_prefix || data.prefix || (keyVal ? keyVal.substring(0, 8) : "");

      setGeneratedKey(keyVal);
      setKeyDetails(keyVal, prefixVal);
      setInputPrefix(prefixVal);
      toast.success("API key generated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network Error";
      toast.error(`Failed to generate API key: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy key to clipboard
  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch live usage stats
  const fetchUsage = useCallback(
    async (prefix: string) => {
      if (!prefix.trim()) return;
      setIsLoadingUsage(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(prefix.trim())}/usage`);
        if (!res.ok) {
          if (res.status === 404) {
            setUsage(null);
            throw new Error("Key prefix not found");
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setUsage({
          prefix: data.key_prefix || data.prefix || prefix,
          requests_today: data.requests_today ?? 0,
          limit: data.daily_limit ?? data.limit ?? 100,
          remaining: data.remaining ?? ((data.daily_limit ?? 100) - (data.requests_today ?? 0)),
          reset_time: data.resets_at || data.reset_time || "24h from creation",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Could not fetch usage: ${msg}`);
      } finally {
        setIsLoadingUsage(false);
      }
    },
    [apiBaseUrl]
  );

  // Poll usage when inputPrefix changes
  useEffect(() => {
    if (!inputPrefix) return;
    const loadUsage = () => {
      void fetchUsage(inputPrefix);
    };
    loadUsage();
    const interval = setInterval(loadUsage, 10000);
    return () => clearInterval(interval);
  }, [inputPrefix, fetchUsage]);

  // Revoke Key
  const handleRevokeKey = async () => {
    if (!inputPrefix) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(inputPrefix)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404) {
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success(`Key ${inputPrefix} has been revoked.`);
      setUsage(null);
      setGeneratedKey(null);
      clearKey();
      setInputPrefix("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Revocation failed";
      toast.error(`Failed to revoke key: ${msg}`);
    } finally {
      setIsRevoking(false);
    }
  };

  const requestsToday = usage?.requests_today ?? 0;
  const limit = usage?.limit ?? 100;
  const percentage = Math.min(Math.round((requestsToday / limit) * 100), 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold tracking-tight">API Key Management</h1>
            <Badge variant="outline" className="font-mono text-[10px]">
              No-Auth Public Access
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate stateless API keys, monitor daily execution quotas, and manage active session tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Link href="/playground">
            <Button size="sm" className="gap-1.5 font-mono text-xs font-semibold">
              <Play className="h-3.5 w-3.5" />
              Open Playground
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Generator & Token Display */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-base font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Generate New API Key
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Rate Limit: 100 req/day
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Generates a new X-API-Key for execution requests. Keys are tied to your IP/prefix quota.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="w-full font-mono text-xs font-semibold sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Generating Key...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-3.5 w-3.5" />
                    Generate API Key
                  </>
                )}
              </Button>

              {/* Display Generated Key */}
              {generatedKey && (
                <div className="space-y-3 pt-2">
                  <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="font-mono text-xs font-bold">Save this key now</AlertTitle>
                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                      This secret key is only displayed in browser memory right now. It will not be displayed again once you reload.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Secret API Key</label>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/60 p-2 font-mono text-xs">
                      <input
                        type="text"
                        readOnly
                        value={generatedKey}
                        className="w-full bg-transparent font-mono text-xs text-foreground focus:outline-none"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={handleCopyKey}
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Specs Card */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Execution Constraints & Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono sm:grid-cols-3">
                <div className="rounded border border-border/60 bg-muted/30 p-2.5">
                  <div className="text-[11px] text-muted-foreground">Max Timeout</div>
                  <div className="mt-1 font-bold text-foreground">7.0 seconds</div>
                </div>
                <div className="rounded border border-border/60 bg-muted/30 p-2.5">
                  <div className="text-[11px] text-muted-foreground">RAM Allocation</div>
                  <div className="mt-1 font-bold text-foreground">256 MB</div>
                </div>
                <div className="rounded border border-border/60 bg-muted/30 p-2.5">
                  <div className="text-[11px] text-muted-foreground">Network Isolation</div>
                  <div className="mt-1 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> None (Disabled)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Usage Statistics & Revocation */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Live Usage Monitor
                </CardTitle>
                {isLoadingUsage && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              <CardDescription className="text-xs">
                Inspect request quota consumption by key prefix.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Prefix Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Key Prefix</label>
                  {apiKey && (
                    <button
                      onClick={() => setInputPrefix(keyPrefix)}
                      className="text-[11px] font-mono text-primary hover:underline"
                    >
                      Use active key prefix
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="e.g. ce_live_a1b2c3d4"
                    value={inputPrefix}
                    onChange={(e) => setInputPrefix(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fetchUsage(inputPrefix)}
                    disabled={!inputPrefix || isLoadingUsage}
                    className="font-mono text-xs shrink-0"
                  >
                    Check
                  </Button>
                </div>
              </div>

              {/* Progress & Badge */}
              {usage ? (
                <div className="space-y-4 rounded-md border border-border/80 bg-muted/20 p-4">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Quota Consumed</span>
                    <Badge
                      variant={usage.remaining === 0 ? "destructive" : "outline"}
                      className="font-mono text-[11px]"
                    >
                      {usage.remaining} remaining
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                      <span>{requestsToday} requests today</span>
                      <span>{limit} limit / day</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Resets: {usage.reset_time}</span>
                  </div>

                  {/* Revoke Action */}
                  <div className="border-t border-border/60 pt-3">
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isRevoking}
                            className="w-full font-mono text-xs gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revoke Key ({inputPrefix})
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-mono text-sm">
                            Revoke API Key?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-xs">
                            This action cannot be undone. Any requests using key prefix{" "}
                            <code className="font-mono font-bold">{inputPrefix}</code> will be rejected with HTTP 401.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRevokeKey}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                          >
                            Confirm Revocation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                  Enter or generate a key prefix above to view quota metrics.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
