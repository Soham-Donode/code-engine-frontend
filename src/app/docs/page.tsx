"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ShieldAlert,
  Play,
  Cpu,
  Code2,
  Zap,
  Lock,
  ArrowRight,
  ListTree,
  Server,
  Activity,
  Key,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("quickstart");

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sidebarGroups = [
    {
      title: "Start here",
      items: [
        { id: "quickstart", title: "Quick Start", icon: Zap },
        { id: "authentication", title: "Authentication", icon: Lock },
      ],
    },
    {
      title: "Platform guides",
      items: [
        { id: "submit", title: "POST /submit", icon: Server },
        { id: "stream", title: "GET /stream/:id", icon: Activity },
      ],
    },
    {
      title: "Execution & Limits",
      items: [
        { id: "rate-limits", title: "Rate Limits", icon: ShieldAlert },
        { id: "constraints", title: "Sandbox Security", icon: Cpu },
      ],
    },
    {
      title: "Resources & SDKs",
      items: [{ id: "examples", title: "JavaScript SDK", icon: Code2 }],
    },
  ];

  const tocItems = [
    { id: "quickstart", title: "Quick Start" },
    { id: "authentication", title: "Authentication" },
    { id: "rate-limits", title: "Rate Limits" },
    { id: "submit", title: "POST /submit" },
    { id: "stream", title: "GET /stream/:id" },
    { id: "constraints", title: "Execution Constraints" },
    { id: "examples", title: "JavaScript Example" },
  ];

  const quickstartCurl = `curl -X POST "${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/submit" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "language": "python",
    "code": "print(\\"Hello from CodeEngine API!\\")"
  }'`;

  const jsExample = `const API_BASE = "${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}";
const API_KEY = "YOUR_API_KEY";

async function executeCode() {
  // 1. Submit Code Execution Request
  const res = await fetch(\`\${API_BASE}/submit\`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "python", // 'python' | 'cpp' | 'javascript'
      code: "import sys\\nprint('Sandboxed Execution!')\\nsys.stdout.flush()",
      input: "optional stdin content",
    }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      const err = await res.json();
      console.error("Rate Limit Exceeded. Reset time:", err.reset_time);
      return;
    }
    throw new Error(\`HTTP status \${res.status}\`);
  }

  const { submission_id } = await res.json();
  console.log("Submission Accepted. ID:", submission_id);

  // 2. Connect to Server-Sent Events (SSE) Stream
  const eventSource = new EventSource(\`\${API_BASE}/stream/\${submission_id}?api_key=\${API_KEY}\`);

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log("Status:", data.status);
    if (data.stdout) console.log("[STDOUT]", data.stdout);
    if (data.stderr) console.error("[STDERR]", data.stderr);
    if (["completed", "error", "timeout"].includes(data.status)) {
      eventSource.close();
    }
  };
}

executeCode();`;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased">
      {/* Main 3-Column Docs Grid Layout */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-20 space-y-6">
              {/* Top Quick Link Button */}
              <Link
                href="/playground"
                className="flex items-center gap-2.5 rounded-lg bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 border border-slate-800 transition-colors hover:bg-slate-800/60 hover:text-white"
              >
                <Play className="h-3.5 w-3.5 text-slate-400" />
                <span>Try Live Playground</span>
              </Link>

              {/* Sidebar Group Items */}
              {sidebarGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 tracking-tight px-1 uppercase text-[11px]">
                    {group.title}
                  </h3>
                  <nav className="space-y-0.5 text-xs">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeSection === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={() => setActiveSection(item.id)}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-slate-800 text-white font-semibold"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          <span>{item.title}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* Center Main Content Area */}
          <main className="space-y-10 lg:col-span-6">
            {/* Document Header Title Section */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <span>CodeEngine Docs</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Getting started
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Set up your CodeEngine API integration environment and execute your first sandboxed program asynchronously.
              </p>
            </div>

            {/* Feature Cards Section: "Here's what we will cover" */}
            <div className="space-y-3 pt-2">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Here&apos;s what we will cover
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                In this guide, you&apos;ll set up everything needed to submit code payloads, authenticate requests, and stream real-time output.
              </p>

              {/* 3-Column Card Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 space-y-1.5 shadow-sm">
                  <div className="text-slate-400">
                    <Key className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">Platform Core</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sandboxed execution platform basics
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 space-y-1.5 shadow-sm">
                  <div className="text-slate-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">Get API Keys</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generate secret execution tokens
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 space-y-1.5 shadow-sm">
                  <div className="text-slate-400">
                    <Play className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">First Payload</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Submit code payload and receive SSE stream
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Quick Start */}
            <section id="quickstart" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white tracking-tight">Quick Start</h2>
                <Badge variant="outline" className="font-mono text-[11px] border-slate-700 text-slate-300 bg-slate-800/60 rounded-md">cURL</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit a code payload to the CodeEngine API using cURL. Replace{" "}
                <code className="font-mono text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">YOUR_API_KEY</code> with a key generated on the dashboard.
              </p>

              <div className="relative rounded-xl border border-slate-800 bg-[#070A10] p-4 font-mono text-xs text-slate-100 shadow-inner">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-slate-400 hover:text-white rounded-md"
                  onClick={() => handleCopy("quickstart", quickstartCurl)}
                >
                  {copiedId === "quickstart" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-slate-300">{quickstartCurl}</pre>
              </div>
            </section>

            {/* Section 2: Authentication */}
            <section id="authentication" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <h2 className="text-lg font-semibold text-white tracking-tight">Authentication</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                All requests to protected execution endpoints require an API key passed via HTTP Header or query parameter:
              </p>

              <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 text-xs space-y-2.5 font-mono shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Header Name:</span>
                  <code className="font-semibold text-white">X-API-Key</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Query Parameter (for SSE):</span>
                  <code className="text-emerald-400">?api_key=ce_...</code>
                </div>
              </div>
            </section>

            {/* Section 3: Rate Limits */}
            <section id="rate-limits" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <h2 className="text-lg font-semibold text-white tracking-tight">Rate Limits</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every API key is provisioned with a flat quota of <strong>100 requests per day</strong>. Counters reset automatically 24 hours after key creation.
              </p>

              <div className="rounded-xl border border-slate-800 bg-[#070A10] p-4 font-mono text-xs text-red-400">
                <pre>{`{
  "error": "Rate limit exceeded",
  "limit": 100,
  "requests_today": 100,
  "remaining": 0,
  "resets_at": "2026-07-26T14:56:49Z"
}`}</pre>
              </div>
            </section>

            {/* Section 4: POST /submit */}
            <section id="submit" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs bg-white text-slate-950 font-semibold rounded-md">POST</Badge>
                  <h2 className="text-lg font-semibold text-white tracking-tight">/submit</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">Submit Execution Payload</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Queues a script execution job into the worker pool. Returns immediately with a unique <code className="font-mono text-slate-200">submission_id</code>.
              </p>
            </section>

            {/* Section 5: GET /stream/:id */}
            <section id="stream" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs bg-slate-800 text-slate-200 font-semibold rounded-md border border-slate-700">GET</Badge>
                  <h2 className="text-lg font-semibold text-white tracking-tight">/stream/:submission_id</h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">Server-Sent Events (SSE)</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Opens a real-time stream returning <code className="font-mono text-slate-200">text/event-stream</code> JSON objects.
              </p>
            </section>

            {/* Section 6: Execution Constraints */}
            <section id="constraints" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <h2 className="text-lg font-semibold text-white tracking-tight">Execution Constraints</h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[11px]">Timeout Boundary</span>
                  <p className="font-semibold text-white text-sm">7 Seconds Hard Limit</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-4 space-y-1 shadow-sm">
                  <span className="text-slate-400 text-[11px]">RAM Allocation</span>
                  <p className="font-semibold text-white text-sm">256 MB Max RAM</p>
                </div>
              </div>
            </section>

            {/* Section 7: JavaScript Example */}
            <section id="examples" className="space-y-3 scroll-mt-32 pt-6 border-t border-slate-800">
              <h2 className="text-lg font-semibold text-white tracking-tight">JavaScript SDK Integration</h2>

              <div className="relative rounded-xl border border-slate-800 bg-[#070A10] p-4 font-mono text-xs text-slate-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-slate-400 hover:text-white rounded-md"
                  onClick={() => handleCopy("jsexample", jsExample)}
                >
                  {copiedId === "jsexample" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-slate-300">{jsExample}</pre>
              </div>
            </section>

            {/* "Ready to begin?" Bottom Wide Card */}
            <div className="space-y-3 pt-4">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Ready to begin?
              </h2>

              <div className="rounded-xl border border-slate-800 bg-[#0D1117] p-6 space-y-3 shadow-sm">
                <div className="text-slate-300">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-white text-sm">Start with Playground</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test Python, C++, and Node.js code submissions live in your browser sandbox.
                  </p>
                </div>
                <div className="pt-2 flex gap-3">
                  <Link href="/playground">
                    <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs rounded-lg">
                      Open Playground
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button size="sm" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800/60 text-xs rounded-lg">
                      Generate API Key
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>

          {/* Right Column: "On this page" TOC Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-3">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 px-1">
                <ListTree className="h-4 w-4 text-slate-400" />
                <span>On this page</span>
              </div>

              <nav className="space-y-0.5 text-xs">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`block py-1.5 px-2 rounded-md transition-colors ${
                      activeSection === item.id
                        ? "text-white font-medium bg-slate-800/60"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
