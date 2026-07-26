"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Info,
  MoreVertical,
  Copy,
  Check,
  Trash2,
  Play,
  KeyRound,
  Activity,
  RefreshCw,
  AlertTriangle,
  Lock,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApiKey } from "@/context/ApiKeyContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthModal } from "@/components/AuthModal";

interface ManagedKey {
  id: string;
  name: string;
  prefix: string;
  keyType?: "DIRECT" | "STREAM";
  fullKey?: string;
  expires: string;
  lastUsed: string;
  usage: number;
  limit: number;
  limitType: "TOTAL" | "TODAY";
  createdAt: string;
}

interface UsageStats {
  prefix: string;
  requests_today: number;
  limit: number;
  remaining: number;
  reset_time: string;
}

export default function DashboardPage() {
  const { keyPrefix, setKeyDetails, clearKey } = useApiKey();
  const { user, session, isConfigured: isSupabaseReady } = useAuth();

  // Keys list & search state
  const [keys, setKeys] = useState<ManagedKey[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // New key modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"DIRECT" | "STREAM">("STREAM");
  const [newKeyExpiry, setNewKeyExpiry] = useState("Never");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ full: string; prefix: string; type?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Live usage inspect state
  const [inspectedPrefix, setInspectedPrefix] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ManagedKey | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // Fetch Supabase keys for logged in user and hydrate live usage from backend
  useEffect(() => {
    if (!user || !isSupabaseReady) return;

    const fetchSupabaseKeys = async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase api_keys query:", error.message);
        return;
      }

      if (data) {
        const mappedKeys: ManagedKey[] = await Promise.all(
          data.map(async (item) => {
            const rawPrefix = (item.prefix || "").replace(/\.\.\./g, "").trim();
            let liveUsage = item.usage || 0;

            if (rawPrefix) {
              try {
                const res = await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(rawPrefix)}/usage`);
                if (res.ok) {
                  const usageData = await res.json();
                  if (typeof usageData.requests_today === "number") {
                    liveUsage = usageData.requests_today;
                  }
                }
              } catch {
                // fallback to static usage
              }
            }

            return {
              id: item.id,
              name: item.name,
              prefix: item.prefix,
              keyType: item.key_type || "STREAM",
              fullKey: item.full_key,
              expires: item.expires || "Never",
              lastUsed: item.last_used || "Never",
              usage: liveUsage,
              limit: item.daily_limit || 100,
              limitType: (item.limit_type as "TOTAL" | "TODAY") || "TODAY",
              createdAt: item.created_at,
            };
          })
        );
        setKeys(mappedKeys);
      }
    };

    fetchSupabaseKeys();
  }, [user, isSupabaseReady, apiBaseUrl]);

  // Handle generate API key
  const handleCreateKeySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newKeyName.trim() || "unnamed-key";
    if (keys.length >= 5) {
      toast.error("Maximum limit reached: You can only have up to 5 active API keys.");
      return;
    }

    setIsGenerating(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${apiBaseUrl}/api/keys`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, type: newKeyType, expires: newKeyExpiry }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required. Please sign in to create API keys.");
        }
        if (res.status === 403) {
          throw new Error("Maximum key limit reached. You can only create up to 5 API keys.");
        }
        if (res.status === 429) {
          throw new Error("Key generation rate limit reached. Please wait before creating more keys.");
        }
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const fullKeyVal = data.api_key || data.key || "";
      const prefixVal = data.key_prefix || data.prefix || (fullKeyVal ? fullKeyVal.substring(0, 8) : "");
      const returnedType: "DIRECT" | "STREAM" = data.key_type || data.type || newKeyType;

      const formattedPrefix = prefixVal.length > 12
        ? `${prefixVal.substring(0, 10)}...${prefixVal.substring(prefixVal.length - 3)}`
        : prefixVal;

      const newKeyItem: ManagedKey = {
        id: `key-${Date.now()}`,
        name,
        prefix: formattedPrefix,
        keyType: returnedType,
        fullKey: fullKeyVal,
        expires: newKeyExpiry,
        lastUsed: "Just now",
        usage: 0,
        limit: 100,
        limitType: "TODAY",
        createdAt: new Date().toISOString(),
      };

      // Save to Supabase if authenticated
      if (user && isSupabaseReady) {
        const { data: dbData, error } = await supabase
          .from("api_keys")
          .insert({
            user_id: user.id,
            name,
            prefix: formattedPrefix,
            key_type: returnedType,
            full_key: fullKeyVal,
            expires: newKeyExpiry,
            last_used: "Just now",
            usage: 0,
            daily_limit: 100,
            limit_type: "TODAY",
          })
          .select()
          .single();

        if (!error && dbData) {
          newKeyItem.id = dbData.id;
        }
      }

      setKeys((prev) => [newKeyItem, ...prev]);
      setKeyDetails(fullKeyVal, prefixVal);
      setNewlyCreatedKey({ full: fullKeyVal, prefix: prefixVal });
      setNewKeyName("");
      setNewKeyExpiry("Never");
      toast.success(`API Key "${name}" generated successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network Error";
      toast.error(`Failed to generate API key: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy key to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Check usage for a key prefix
  const fetchUsageForPrefix = useCallback(async (prefixStr: string) => {
    const rawPrefix = prefixStr.replace(/\.\.\./g, "").trim();
    setInspectedPrefix(prefixStr);
    try {
      const res = await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(rawPrefix)}/usage`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const requestsToday = data.requests_today ?? 0;
      setUsage({
        prefix: data.key_prefix || data.prefix || rawPrefix,
        requests_today: requestsToday,
        limit: data.daily_limit ?? data.limit ?? 100,
        remaining: data.remaining ?? ((data.daily_limit ?? 100) - requestsToday),
        reset_time: data.resets_at || data.reset_time || "24h from creation",
      });

      // Sync key usage in list
      setKeys((prev) =>
        prev.map((k) => (k.prefix.includes(rawPrefix) ? { ...k, usage: requestsToday } : k))
      );
    } catch {
      setUsage({
        prefix: rawPrefix,
        requests_today: 0,
        limit: 100,
        remaining: 100,
        reset_time: "24 hours after creation",
      });
    }
  }, [apiBaseUrl]);

  // Handle Revoke Key
  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;
    const targetPrefix = keyToRevoke.prefix.replace(/\.\.\./g, "").trim();

    try {
      await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(targetPrefix)}`, {
        method: "DELETE",
      }).catch(() => {});

      setKeys((prev) => prev.filter((k) => k.id !== keyToRevoke.id));
      if (keyPrefix && keyPrefix.includes(targetPrefix)) {
        clearKey();
      }
      toast.success(`Key "${keyToRevoke.name}" revoked.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Revocation failed";
      toast.error(`Error: ${msg}`);
    } finally {
      setKeyToRevoke(null);
    }
  };

  // Filter keys by search query
  const filteredKeys = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Checkbox select handlers
  const toggleSelectAll = () => {
    if (selectedKeyIds.length === filteredKeys.length) {
      setSelectedKeyIds([]);
    } else {
      setSelectedKeyIds(filteredKeys.map((k) => k.id));
    }
  };

  const toggleSelectKey = (id: string) => {
    setSelectedKeyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-6">
        {/* 1. Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">API Keys</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Create and manage your secret API keys.</span>
              <Info className="h-3.5 w-3.5 cursor-pointer" />
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                  return;
                }
                if (keys.length >= 5) {
                  toast.error("Maximum limit reached: You can only have up to 5 active API keys.");
                  return;
                }
                setNewlyCreatedKey(null);
                setIsCreateOpen(true);
              }}
              disabled={keys.length >= 5}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs gap-1.5 px-3.5 h-8 rounded-lg disabled:opacity-50"
            >
              <Plus className="h-4 w-4 stroke-[2]" />
              New Key ({keys.length}/5)
            </Button>
          </div>
        </div>

        {/* 2. Search Input Control */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={user ? "Search by name..." : "Sign in to search API keys..."}
            disabled={!user}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-lg h-9 disabled:opacity-50"
          />
        </div>

        {/* 3. API Keys Table / Unauthenticated State */}
        {!user ? (
          <div className="rounded-xl border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground border">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-semibold">Authentication Required</h3>
              <p className="text-xs text-muted-foreground">
                API keys are isolated per user account. Sign in with Google or Email to view, create, and manage your API keys.
              </p>
            </div>
            <Button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs gap-2 px-4 h-8 rounded-lg mt-2"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In to Access API Keys
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="w-full overflow-visible">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredKeys.length > 0 && selectedKeyIds.length === filteredKeys.length}
                        onChange={toggleSelectAll}
                        className="rounded border h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 font-medium">Key</th>
                    <th className="py-3 px-4 font-medium">Expires</th>
                    <th className="py-3 px-4 font-medium">Last Used</th>
                    <th className="py-3 px-4 font-medium">Usage</th>
                    <th className="py-3 px-4 font-medium">Limit</th>
                    <th className="py-3 px-4 w-10 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                        No API keys found. Click &quot;+ New Key&quot; to generate your first key.
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((key) => {
                      const isSelected = selectedKeyIds.includes(key.id);
                      const isSessionActive = keyPrefix && key.prefix.includes(keyPrefix);

                      return (
                        <tr
                          key={key.id}
                          className={`transition-colors group hover:bg-muted/40 ${
                            isSelected ? "bg-muted/30" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectKey(key.id)}
                              className="rounded border h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>

                          {/* Key Name & Prefix */}
                          <td className="py-3.5 px-4 font-medium">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{key.name}</span>
                                <Badge className={`font-mono text-[9px] px-1.5 py-0 ${
                                  key.keyType === "DIRECT"
                                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }`}>
                                  {key.keyType === "DIRECT" ? "Direct Output" : "Stream Status"}
                                </Badge>
                                {isSessionActive && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono text-[9px] px-1.5 py-0">
                                    Active Session
                                  </Badge>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {key.prefix}
                              </div>
                            </div>
                          </td>

                          {/* Expires */}
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {key.expires}
                          </td>

                          {/* Last Used */}
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {key.lastUsed}
                          </td>

                          {/* Usage */}
                          <td className="py-3.5 px-4 text-muted-foreground font-mono">
                            {key.usage} reqs
                          </td>

                          {/* Limit */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-muted-foreground">100req/day</span>
                              <span className="rounded-md bg-muted text-[9px] font-medium text-muted-foreground px-1.5 py-0.5 border">
                                {key.limitType}
                              </span>
                            </div>
                          </td>

                          {/* Actions Menu */}
                          <td className="py-3.5 px-4 text-right relative">
                            <div className="relative inline-block">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveMenuId(activeMenuId === key.id ? null : key.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>

                              {/* Dropdown Menu Popup */}
                              {activeMenuId === key.id && (
                                <div className="absolute right-0 top-8 z-50 w-44 rounded-lg border bg-popover p-1.5 shadow-xl font-sans text-xs space-y-0.5 text-left">
                                  <button
                                    onClick={() => {
                                      handleCopyText(key.fullKey || key.prefix);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-popover-foreground hover:bg-accent transition-colors"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Copy Key</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (key.fullKey) {
                                        setKeyDetails(key.fullKey, key.prefix);
                                        toast.success(`Active session key set to ${key.name}`);
                                      } else {
                                        toast.info(`Key prefix ${key.prefix} saved`);
                                      }
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-popover-foreground hover:bg-accent transition-colors"
                                  >
                                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Use for Session</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      fetchUsageForPrefix(key.prefix);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-popover-foreground hover:bg-accent transition-colors"
                                  >
                                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Inspect Usage</span>
                                  </button>

                                  <div className="border-t my-1" />

                                  <button
                                    onClick={() => {
                                      setKeyToRevoke(key);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Revoke Key</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="py-3 px-4 border-t bg-muted/30 text-muted-foreground text-xs">
              <span>{filteredKeys.length} {filteredKeys.length === 1 ? "key" : "keys"}</span>
            </div>
          </div>
        )}

        {/* 4. Live Inspected Usage Details Card */}
        {inspectedPrefix && usage && (
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Live Usage Inspection ({inspectedPrefix})</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectedPrefix(null)}
                className="text-xs text-muted-foreground hover:text-foreground rounded-md"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 font-mono text-xs">
              <div className="rounded-lg border bg-muted/50 p-3">
                <span className="text-muted-foreground text-[11px]">Requests Today</span>
                <p className="font-semibold text-sm mt-0.5">{usage.requests_today} / {usage.limit}</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <span className="text-muted-foreground text-[11px]">Remaining Quota</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{usage.remaining} remaining</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <span className="text-muted-foreground text-[11px]">Quota Reset Window</span>
                <p className="font-semibold text-sm mt-0.5">{usage.reset_time}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Create New API Key Modal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Create New API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generates a new secret X-API-Key for sandboxed code execution payloads.
            </DialogDescription>
          </DialogHeader>

          {!newlyCreatedKey ? (
            <form onSubmit={handleCreateKeySubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Key Name</label>
                <Input
                  type="text"
                  placeholder="e.g. myra-agent or dev-pipeline"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-xs h-9 font-mono rounded-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Key Type</label>
                <Select value={newKeyType} onValueChange={(val) => val && setNewKeyType(val as "DIRECT" | "STREAM")}>
                  <SelectTrigger className="w-full text-xs h-9 font-mono rounded-lg">
                    <SelectValue placeholder="Select Key Type" />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs rounded-lg">
                    <SelectItem value="STREAM">
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-semibold text-foreground">Stream Status (SSE)</span>
                        <span className="text-[10px] text-muted-foreground font-sans">Streams status updates first, then returns output</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DIRECT">
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-semibold text-foreground font-mono">Direct Output</span>
                        <span className="text-[10px] text-muted-foreground font-sans">Returns stdout/stderr output directly in HTTP response</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Expiration</label>
                <Select value={newKeyExpiry} onValueChange={(val) => val && setNewKeyExpiry(val)}>
                  <SelectTrigger className="w-full text-xs h-9 font-mono rounded-lg">
                    <SelectValue placeholder="Select Expiration" />
                  </SelectTrigger>
                  <SelectContent className="font-mono text-xs rounded-lg">
                    <SelectItem value="Never">Never</SelectItem>
                    <SelectItem value="24 Hours">24 Hours</SelectItem>
                    <SelectItem value="7 Days">7 Days</SelectItem>
                    <SelectItem value="30 Days">30 Days</SelectItem>
                    <SelectItem value="90 Days">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs rounded-lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Create Key"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                <AlertTitle className="text-xs font-semibold">Save your API Key now</AlertTitle>
                <AlertDescription className="text-xs text-amber-600 dark:text-amber-300/80">
                  This secret key will not be displayed again. Please copy and store it securely.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Secret API Key</label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2 font-mono text-xs">
                  <input
                    type="text"
                    readOnly
                    value={newlyCreatedKey.full}
                    className="w-full bg-transparent font-mono text-xs focus:outline-none px-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground rounded-md"
                    onClick={() => handleCopyText(newlyCreatedKey.full)}
                  >
                    {copiedKey ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2 flex gap-2">
                <Link href="/playground" className="w-full">
                  <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs gap-1.5 rounded-lg">
                    <Play className="h-3.5 w-3.5" />
                    Test in Playground
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs rounded-lg"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Confirm Revoke Key Alert Dialog */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <AlertDialogContent className="sm:max-w-md rounded-xl p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Revoke API Key &quot;{keyToRevoke?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This action cannot be undone. Any requests sending key prefix{" "}
              <code className="font-mono">{keyToRevoke?.prefix}</code> will be rejected with HTTP 401.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="text-xs rounded-lg">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg"
            >
              Confirm Revocation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 7. Auth Modal */}
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
}
