"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
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
  const { user, isConfigured: isSupabaseReady } = useAuth();

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
  const [newKeyExpiry, setNewKeyExpiry] = useState("Never");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ full: string; prefix: string } | null>(null);
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
    setIsGenerating(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expires: newKeyExpiry }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      const fullKeyVal = data.api_key || data.key || "";
      const prefixVal = data.key_prefix || data.prefix || (fullKeyVal ? fullKeyVal.substring(0, 8) : "");

      const formattedPrefix = prefixVal.length > 12
        ? `${prefixVal.substring(0, 10)}...${prefixVal.substring(prefixVal.length - 3)}`
        : prefixVal;

      const newKeyItem: ManagedKey = {
        id: `key-${Date.now()}`,
        name,
        prefix: formattedPrefix,
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

  // --- UNAUTHENTICATED HIGH-AESTHETIC LANDING HERO PAGE ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#E5ECEC] text-slate-900 font-sans p-4 sm:p-6 lg:p-8 flex justify-center items-center">
        {/* Outer Rounded Canvas Card */}
        <div className="relative w-full max-w-6xl rounded-[32px] overflow-hidden shadow-2xl bg-sky-100 min-h-[780px] flex flex-col justify-between border border-white/40">
          
          {/* Background Landscape Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-landscape.png"
              alt="Lush Meadow Background"
              fill
              className="object-cover object-bottom"
              priority
            />
            {/* Soft gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-100/90 via-sky-50/40 to-transparent" />
          </div>

          {/* Floating Pill Top Bar / Header */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Zap className="h-4 w-4 fill-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">CodeEngine</span>
            </div>

            {/* Centered Floating Pill Navigation */}
            <div className="hidden md:flex items-center gap-4 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-lg text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-semibold shadow-sm cursor-pointer">
                <Layers className="h-3.5 w-3.5" /> Dashboard
              </span>
              <Link href="/playground" className="hover:text-slate-950 transition-colors px-2">
                Playground
              </Link>
              <Link href="/docs" className="hover:text-slate-950 transition-colors px-2">
                API Reference
              </Link>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold px-5 py-2.5 rounded-full border border-slate-200/80 shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Join to Waitlist
            </button>
          </div>

          {/* Hero Content Section */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 pt-12 sm:pt-16 pb-8 space-y-6 max-w-3xl mx-auto">
            {/* Y-Combinator / Backed Tag */}
            <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/60 text-[11px] font-semibold text-slate-800 shadow-sm">
              <span>Backed to</span>
              <span className="bg-[#FF6600] text-white px-1.5 py-0.5 rounded font-bold text-[10px] tracking-tight">Y</span>
              <span>Combinator</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-slate-900 leading-[1.1] max-w-2xl font-normal">
              Autopilot for your Code Sandbox. <br />
              <span className="font-sans font-medium text-slate-900">Scale effortlessly</span>
            </h1>

            {/* Primary Call To Action Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="mt-2 bg-slate-950 hover:bg-slate-800 text-white text-sm font-medium px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Join to Waitlist
            </button>
          </div>

          {/* Bottom Card Mockup Floating in Meadow */}
          <div className="relative z-10 px-4 sm:px-12 pb-0 flex justify-center -mb-8">
            <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 shadow-2xl border border-white/80 space-y-6 transform translate-y-4 hover:translate-y-2 transition-transform duration-300">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    CE
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">CodeEngine Sandbox</h4>
                    <p className="text-[10px] text-slate-400 font-mono">my space • v1.0</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Board:</span>
                  <span className="text-sm font-bold text-slate-900">CRM</span>
                  <span className="text-xs text-slate-400 font-mono">(4)</span>
                </div>
              </div>

              {/* Card Body Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Stats Panel */}
                <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-4 space-y-4 border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>New leads</span>
                    <span className="font-mono">23</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">12</p>
                      <p className="text-[9px] text-slate-400">send request</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">10</p>
                      <p className="text-[9px] text-slate-400">in chat now</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">1</p>
                      <p className="text-[9px] text-slate-400">close chat</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200/60 pt-3">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>New clients</span>
                      <span className="font-mono">3</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-1">23 251$</p>
                  </div>
                </div>

                {/* Live Output Simulation */}
                <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Marcus #SH-24819
                    </span>
                    <span>Ready</span>
                  </div>
                  <p className="text-slate-300">Hey, I ordered yesterday. Where is it?</p>
                  <div className="bg-slate-800/60 rounded-xl p-2.5 text-emerald-400 flex items-center justify-between text-[11px]">
                    <span>Found it ✓</span>
                    <span className="text-[9px] text-slate-400">Order lookup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      </div>
    );
  }

  // --- AUTHENTICATED DASHBOARD PAGE ---
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
                setNewlyCreatedKey(null);
                setIsCreateOpen(true);
              }}
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs gap-1.5 px-3.5 h-8 rounded-lg"
            >
              <Plus className="h-4 w-4 stroke-[2]" />
              New Key
            </Button>
          </div>
        </div>

        {/* 2. Search Input Control */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-lg h-9 disabled:opacity-50"
          />
        </div>

        {/* 3. API Keys Table */}
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
