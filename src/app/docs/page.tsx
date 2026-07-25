"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Copy,
  Check,
  ShieldAlert,
  Play,
  Cpu,
  Code2,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Snippet copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navItems = [
    { id: "quickstart", title: "Quick Start" },
    { id: "authentication", title: "Authentication" },
    { id: "rate-limits", title: "Rate Limits" },
    { id: "submit", title: "POST /submit" },
    { id: "stream", title: "GET /stream/:id (SSE)" },
    { id: "constraints", title: "Execution Constraints" },
    { id: "examples", title: "Code Examples" },
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
  const eventSource = new EventSource(\`\${API_BASE}/stream/\${submission_id}\`);

  eventSource.addEventListener("status", (e) => {
    console.log("Status update:", e.data); // queued -> running -> completed/error/timeout
    if (["completed", "error", "timeout"].includes(e.data)) {
      eventSource.close();
    }
  });

  eventSource.addEventListener("stdout", (e) => {
    console.log("[STDOUT]", e.data);
  });

  eventSource.addEventListener("stderr", (e) => {
    console.error("[STDERR]", e.data);
  });
}

executeCode();`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner / Playground Callout */}
      <Alert className="mb-8 border-primary/30 bg-primary/5 text-foreground">
        <Zap className="h-4 w-4 text-primary" />
        <AlertTitle className="font-mono text-xs font-bold uppercase tracking-wider">
          Interactive API Sandbox
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
          <span>
            Test code submissions live without writing boilerplate. Try python, C++, or Node.js in the playground.
          </span>
          <Link href="/playground" className="shrink-0">
            <Button size="sm" variant="outline" className="font-mono text-xs gap-1.5 h-7">
              <Play className="h-3 w-3 fill-current" />
              Open Playground
            </Button>
          </Link>
        </AlertDescription>
      </Alert>

      {/* Main Docs Grid: Left Sticky Nav + Right Reference Content */}
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Sticky Navigation */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              API Reference
            </div>
            <nav className="space-y-1 font-mono text-xs">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right Reference Content */}
        <main className="space-y-12 lg:col-span-9">
          {/* Section 1: Quick Start */}
          <section id="quickstart" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <h2 className="font-mono text-lg font-bold tracking-tight">Quick Start</h2>
              <Badge variant="secondary" className="font-mono text-[10px]">cURL</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Submit a code payload to the CodeEngine API using a cURL request. Replace{" "}
              <code className="font-mono font-semibold text-foreground">YOUR_API_KEY</code> with a key generated on the dashboard.
            </p>

            <div className="relative rounded-md border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => handleCopy("quickstart", quickstartCurl)}
              >
                {copiedId === "quickstart" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <pre className="overflow-x-auto whitespace-pre">{quickstartCurl}</pre>
            </div>
          </section>

          {/* Section 2: Authentication */}
          <section id="authentication" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-lg font-bold tracking-tight">Authentication</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All requests to protected execution endpoints require an API key passed via the HTTP Header:
            </p>

            <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
              <span className="text-muted-foreground">Header Key:</span>{" "}
              <code className="font-bold text-foreground">X-API-Key</code>
              <br />
              <span className="text-muted-foreground">Example Value:</span>{" "}
              <code className="text-emerald-600 dark:text-emerald-400">ce_live_8f3a9b2c1d4e</code>
            </div>
          </section>

          {/* Section 3: Rate Limits */}
          <section id="rate-limits" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <h2 className="font-mono text-lg font-bold tracking-tight">Rate Limits</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every API key is provisioned with a flat limit of <strong>100 requests per day</strong>. Quota counters reset exactly <strong>24 hours after key creation</strong> (rolling window).
            </p>

            <Card className="border-border shadow-none">
              <CardHeader className="py-2.5 px-3 border-b border-border bg-muted/40">
                <CardTitle className="font-mono text-xs font-semibold text-muted-foreground">
                  HTTP 429 Rate Limit Error Response Body
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 bg-slate-950 font-mono text-xs text-red-400">
                <pre>{`{
  "error": "Rate limit exceeded",
  "limit": 100,
  "requests_today": 100,
  "remaining": 0,
  "reset_time": "2026-07-26T14:56:49Z"
}`}</pre>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: POST /submit */}
          <section id="submit" className="space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-[11px] bg-emerald-600">POST</Badge>
                <h2 className="font-mono text-base font-bold">/submit</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">Submit Execution Payload</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Queues a script execution job into the sandboxed worker pool. Returns immediately with a unique <code className="font-mono">submission_id</code>.
            </p>

            <div className="space-y-2">
              <h3 className="font-mono text-xs font-semibold uppercase text-muted-foreground">Request JSON Body</h3>
              <div className="rounded-md border border-border bg-card p-3 space-y-2 font-mono text-xs">
                <div className="grid grid-cols-12 gap-2 border-b border-border/60 pb-1.5 text-muted-foreground text-[11px]">
                  <span className="col-span-3">Field</span>
                  <span className="col-span-3">Type</span>
                  <span className="col-span-6">Description</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-foreground">language</span>
                  <span className="col-span-3 text-amber-500 font-semibold">string (enum)</span>
                  <span className="col-span-6 text-muted-foreground">&quot;python&quot; | &quot;cpp&quot; | &quot;javascript&quot;</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-foreground">code</span>
                  <span className="col-span-3 text-amber-500 font-semibold">string</span>
                  <span className="col-span-6 text-muted-foreground">Source code payload to execute</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold text-foreground">input</span>
                  <span className="col-span-3 text-muted-foreground">string (optional)</span>
                  <span className="col-span-6 text-muted-foreground">Standard input (stdin) text</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-mono text-xs font-semibold uppercase text-muted-foreground">Response Body (HTTP 200)</h3>
              <div className="rounded-md border border-border bg-slate-950 p-3 font-mono text-xs text-emerald-400">
                <pre>{`{
  "submission_id": "sub_9f8e7d6c5b4a3210"
}`}</pre>
              </div>
            </div>
          </section>

          {/* Section 5: GET /stream/:id (SSE) */}
          <section id="stream" className="space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-[11px] bg-blue-600">GET</Badge>
                <h2 className="font-mono text-base font-bold">/stream/:submission_id</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">Server-Sent Events (SSE)</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Opens a persistent real-time event stream. Note: This endpoint streams <strong>Server-Sent Events</strong> (<code className="font-mono">text/event-stream</code>), not a single JSON response.
            </p>

            <div className="rounded-md border border-border bg-card p-4 space-y-3 font-mono text-xs">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Streamed Event Types</h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30">event: status</Badge>
                  <span className="text-muted-foreground">Emits state updates: <code className="text-foreground">queued</code>, <code className="text-foreground">running</code>, <code className="text-foreground">completed</code>, <code className="text-foreground">error</code>, or <code className="text-foreground">timeout</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">event: stdout</Badge>
                  <span className="text-muted-foreground">Emits standard output chunk strings as produced by process.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="font-mono text-[10px] bg-red-500/10 text-red-500 border-red-500/30">event: stderr</Badge>
                  <span className="text-muted-foreground">Emits standard error output or runtime exception traces.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6: Execution Constraints */}
          <section id="constraints" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-lg font-bold tracking-tight">Execution Constraints & Sandbox Security</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every process runs isolated inside a gVisor sandboxed container with strict resource limits:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 font-mono text-xs">
              <div className="rounded-md border border-border bg-card p-3">
                <span className="text-muted-foreground text-[11px]">Timeout Boundary</span>
                <p className="font-bold text-foreground mt-1">7 Seconds Hard Limit</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Processes exceeding 7s are killed immediately (<code className="text-amber-500">SIGKILL</code>).</p>
              </div>

              <div className="rounded-md border border-border bg-card p-3">
                <span className="text-muted-foreground text-[11px]">RAM Allocation</span>
                <p className="font-bold text-foreground mt-1">256 MB Max RAM</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Exceeding memory limit triggers OOM status.</p>
              </div>

              <div className="rounded-md border border-border bg-card p-3">
                <span className="text-muted-foreground text-[11px]">Network Policy</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">--network none</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Zero network interface access inside container sandbox.</p>
              </div>

              <div className="rounded-md border border-border bg-card p-3">
                <span className="text-muted-foreground text-[11px]">Security Isolation</span>
                <p className="font-bold text-foreground mt-1">gVisor MicroVM Sandbox</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Restricted Linux kernel syscall virtualization.</p>
              </div>
            </div>
          </section>

          {/* Section 7: Full JavaScript Code Example */}
          <section id="examples" className="space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Code2 className="h-4 w-4 text-primary" />
              <h2 className="font-mono text-lg font-bold tracking-tight">JavaScript End-to-End Example</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete Node.js / Browser example showing the submit request and EventSource SSE handling:
            </p>

            <div className="relative rounded-md border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => handleCopy("jsexample", jsExample)}
              >
                {copiedId === "jsexample" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <pre className="overflow-x-auto whitespace-pre">{jsExample}</pre>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
