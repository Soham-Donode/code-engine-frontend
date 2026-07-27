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
  Terminal,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("quickstart");
  const [activeLang, setActiveLang] = useState<"curl" | "python" | "node">("curl");

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
      title: "API Endpoints",
      items: [
        { id: "submit", title: "POST /submit", icon: Server },
        { id: "stream", title: "GET /stream/:id", icon: Activity },
      ],
    },
    {
      title: "Code Examples",
      items: [
        { id: "curl-examples", title: "cURL Examples", icon: Terminal },
        { id: "python-sdk", title: "Python Integration", icon: FileCode },
        { id: "node-sdk", title: "Node.js / JS Integration", icon: Code2 },
      ],
    },
    {
      title: "Execution & Limits",
      items: [
        { id: "rate-limits", title: "Rate Limits & Usage", icon: ShieldAlert },
        { id: "constraints", title: "Sandbox Constraints", icon: Cpu },
      ],
    },
  ];

  const tocItems = [
    { id: "quickstart", title: "Quick Start" },
    { id: "authentication", title: "Authentication" },
    { id: "submit", title: "POST /submit Payload" },
    { id: "stream", title: "GET /stream/:id SSE" },
    { id: "curl-examples", title: "cURL Examples" },
    { id: "python-sdk", title: "Python Integration" },
    { id: "node-sdk", title: "Node.js / JS Integration" },
    { id: "rate-limits", title: "Rate Limits & Usage" },
    { id: "constraints", title: "Sandbox Security & Limits" },
  ];

  const quickstartCurl = `curl -X POST "http://localhost:8080/submit" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "language": "python",
    "code": "print(\\"Hello from CodeEngine API!\\")"
  }'`;

  const quickstartPython = `import requests
import json

url = "http://localhost:8080/submit"
headers = {
    "X-API-Key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "language": "python",
    "code": "print('Hello from CodeEngine Python SDK!')"
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print("Submission ID:", data["submission_id"])`;

  const quickstartNode = `const fetch = require("node-fetch");

async function run() {
  const res = await fetch("http://localhost:8080/submit", {
    method: "POST",
    headers: {
      "X-API-Key": "YOUR_API_KEY",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      code: "console.log('Hello from Node.js!');"
    })
  });

  const data = await res.json();
  console.log("Submission ID:", data.submission_id);
}

run();`;

  const pythonFullExample = `import requests
import sseclient # pip install sseclient-py

API_BASE = "http://localhost:8080"
API_KEY = "YOUR_API_KEY"

def execute_python_code():
    # 1. Submit execution payload
    response = requests.post(
        f"{API_BASE}/submit",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json"
        },
        json={
            "language": "python", # 'python' | 'cpp' | 'javascript'
            "code": """
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10) = {fibonacci(10)}")
""",
            "input": "" # Optional STDIN
        }
    )

    if response.status_code != 200:
        print("Error submitting code:", response.json())
        return

    submission_id = response.json()["submission_id"]
    print(f"Accepted Submission ID: {submission_id}")

    # 2. Listen to real-time Server-Sent Events (SSE) stream
    stream_url = f"{API_BASE}/stream/{submission_id}?api_key={API_KEY}"
    messages = sseclient.SSEClient(stream_url)

    for msg in messages:
        if not msg.data:
            continue
        event = json.loads(msg.data)
        print(f"Status: {event.get('status')}")
        if event.get("stdout"):
            print(f"[STDOUT]: {event['stdout']}", end="")
        if event.get("stderr"):
            print(f"[STDERR]: {event['stderr']}", end="")
        if event.get("status") in ["completed", "error", "timeout"]:
            print("\\n--- Execution Finished ---")
            break

execute_python_code()`;

  const nodeFullExample = `const API_BASE = "http://localhost:8080";
const API_KEY = "YOUR_API_KEY";

async function executeCode() {
  // 1. Submit Code Payload
  const res = await fetch(\`\${API_BASE}/submit\`, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "cpp", // 'python' | 'cpp' | 'javascript'
      code: \`#include <iostream>
int main() {
    std::cout << "Hello from C++ Sandboxed Runner!" << std::endl;
    return 0;
}\`,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Submission failed:", err);
    return;
  }

  const { submission_id } = await res.json();
  console.log("Submission ID:", submission_id);

  // 2. Stream Logs via SSE
  const eventSource = new EventSource(
    \`\${API_BASE}/stream/\${submission_id}?api_key=\${API_KEY}\`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.stdout) process.stdout.write(data.stdout);
    if (data.stderr) process.stderr.write(data.stderr);
    
    if (["completed", "error", "timeout"].includes(data.status)) {
      console.log(\`\\nProcess finished with status: \${data.status}\`);
      eventSource.close();
    }
  };
}

executeCode();`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Mobile Sticky Section Navigation Selector */}
      <div className="lg:hidden sticky top-[57px] z-30 bg-card/95 backdrop-blur-xl border-b border-border py-2.5 px-4 flex items-center gap-3 shadow-sm">
        <Select
          value={activeSection}
          onValueChange={(val: string | null) => {
            if (val) {
              setActiveSection(val);
              const el = document.getElementById(val);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
        >
          <SelectTrigger className="w-full font-mono text-xs h-9 rounded-xl border border-border bg-background">
            <SelectValue placeholder="Jump to section..." />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-border bg-card shadow-xl p-1 font-mono text-xs">
            {tocItems.map((item) => (
              <SelectItem key={item.id} value={item.id} className="rounded-xl cursor-pointer">
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main 3-Column Docs Grid Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 overflow-hidden">
        <div className="grid gap-8 lg:gap-10 lg:grid-cols-12 min-w-0">
          {/* Left Navigation Sidebar (Desktop Only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-6">
              {/* Top Quick Link Button */}
              <Link
                href="/playground"
                className="flex items-center gap-2.5 rounded-lg bg-muted px-3.5 py-2 text-xs font-medium text-muted-foreground border transition-colors hover:bg-muted/80 hover:text-foreground w-full justify-start"
              >
                <Play className="h-3.5 w-3.5 text-emerald-500" />
                <span>Try Live Playground</span>
              </Link>

              {/* Sidebar Group Items */}
              {sidebarGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-tight px-1 uppercase text-[11px]">
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
                              ? "bg-accent text-accent-foreground font-semibold"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
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
          <main className="space-y-8 sm:space-y-10 lg:col-span-6 min-w-0 w-full overflow-hidden">
            {/* Document Header Title Section */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span>CodeEngine Docs</span>
                <span>/</span>
                <span className="text-foreground font-medium">API Reference</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                CodeEngine API Documentation
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Complete API reference for submitting code payloads, running sandboxed Python, C++, and Node.js code, and streaming output via SSE.
              </p>
            </div>

            {/* Feature Cards Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Key Integration Steps
              </h2>

              {/* 3-Column Card Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 space-y-1.5 shadow-sm">
                  <div className="text-emerald-500">
                    <Key className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">1. Get API Key</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate an API key on your dashboard to authenticate requests.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-1.5 shadow-sm">
                  <div className="text-blue-500">
                    <Server className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">2. POST /submit</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Queue Python, C++, or JS code into isolated runner containers.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-1.5 shadow-sm">
                  <div className="text-purple-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">3. SSE Stream</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stream STDOUT/STDERR logs in real-time with zero buffering.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Quick Start */}
            <section id="quickstart" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">Quick Start</h2>
                <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setActiveLang("curl")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      activeLang === "curl" ? "bg-card text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveLang("python")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      activeLang === "python" ? "bg-card text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveLang("node")}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      activeLang === "node" ? "bg-card text-foreground font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Node.js
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit your first code payload using your preferred client. Replace{" "}
                <code className="font-mono bg-muted px-1.5 py-0.5 rounded border text-foreground">YOUR_API_KEY</code> with a key from your dashboard.
              </p>

              <div className="relative rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs shadow-inner w-full max-w-full overflow-hidden min-w-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground rounded-md z-10"
                  onClick={() =>
                    handleCopy(
                      "quickstart",
                      activeLang === "curl"
                        ? quickstartCurl
                        : activeLang === "python"
                        ? quickstartPython
                        : quickstartNode
                    )
                  }
                >
                  {copiedId === "quickstart" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-foreground pr-8 max-w-full">
                  {activeLang === "curl" && quickstartCurl}
                  {activeLang === "python" && quickstartPython}
                  {activeLang === "node" && quickstartNode}
                </pre>
              </div>
            </section>

            {/* Section 2: Authentication & Key Types */}
            <section id="authentication" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">Authentication & Key Types</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                CodeEngine uses secret API keys for authentication. CodeEngine supports **2 distinct key types** tailored for different integration patterns:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border bg-card p-4 space-y-2 text-xs shadow-sm border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-mono text-[10px]">
                      Direct Output
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Synchronous</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">1. Direct Output Key</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Executes code synchronously and returns execution results (<code className="font-mono text-purple-500">stdout</code>, <code className="font-mono text-purple-500">stderr</code>, <code className="font-mono text-purple-500">status</code>) directly in the HTTP <code className="font-mono">POST /submit</code> response payload. Ideal for simple webhooks, REST APIs, and instant scripts.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-2 text-xs shadow-sm border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-mono text-[10px]">
                      Stream Status (SSE)
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Asynchronous SSE</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">2. Stream Status Key</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Returns a <code className="font-mono text-blue-500">submission_id</code> instantly from <code className="font-mono">POST /submit</code>, enabling real-time status and console output streaming via <code className="font-mono">GET /stream/:id</code> Server-Sent Events. Ideal for long-running scripts and live web terminals.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 text-xs space-y-3 font-mono shadow-sm overflow-x-auto max-w-full">
                <div className="flex items-center justify-between gap-4 border-b pb-2.5 min-w-[280px]">
                  <span className="text-muted-foreground shrink-0">HTTP Request Header:</span>
                  <code className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">X-API-Key: ce_...</code>
                </div>
                <div className="flex items-center justify-between gap-4 min-w-[280px]">
                  <span className="text-muted-foreground shrink-0">SSE Query Parameter:</span>
                  <code className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">?api_key=ce_...</code>
                </div>
              </div>
            </section>

            {/* Section 3: POST /submit */}
            <section id="submit" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs bg-foreground text-background font-semibold rounded-md">POST</Badge>
                  <h2 className="text-xl font-bold tracking-tight">/submit</h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Submit Execution Payload</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Queues a code execution script in an isolated Docker sandbox. Returns a unique <code className="font-mono bg-muted px-1 rounded border">submission_id</code>.
              </p>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Request Body Schema</h3>
                <div className="rounded-xl border bg-card p-4 space-y-3 text-xs font-mono overflow-x-auto max-w-full">
                  <div className="space-y-2 border-b pb-2 min-w-[280px]">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-bold">
                      <span>Field</span>
                      <span>Type</span>
                    </div>
                  </div>
                  <div className="space-y-1 min-w-[280px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">language</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">string</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">&apos;python&apos; | &apos;cpp&apos; | &apos;javascript&apos;</p>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-border/40 min-w-[280px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">code</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">string</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">Source code string to execute in sandbox</p>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-border/40 min-w-[280px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">input</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">string (optional)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">STDIN string input provided to script</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response Payloads by Key Type</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono">1. Direct Output Key Response:</span>
                    <div className="rounded-xl border bg-muted/60 dark:bg-[#070A10] p-3 font-mono text-xs overflow-hidden max-w-full">
                      <pre className="text-purple-600 dark:text-purple-400 leading-relaxed overflow-x-auto max-w-full">{`{
  "submission_id": "178508...",
  "status": "completed",
  "stdout": "Hello World!\\n",
  "stderr": "",
  "execution_time_ms": 142
}`}</pre>
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-mono">2. Stream Status Key Response:</span>
                    <div className="rounded-xl border bg-muted/60 dark:bg-[#070A10] p-3 font-mono text-xs overflow-hidden max-w-full">
                      <pre className="text-blue-600 dark:text-blue-400 leading-relaxed overflow-x-auto max-w-full">{`{
  "submission_id": "178508..."
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: GET /stream/:id */}
            <section id="stream" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs bg-muted text-muted-foreground font-semibold rounded-md border">GET</Badge>
                  <h2 className="text-xl font-bold tracking-tight">/stream/:submission_id</h2>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Server-Sent Events (SSE)</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects to a real-time output stream for the given <code className="font-mono bg-muted px-1 rounded border">submission_id</code> using Server-Sent Events (SSE).
              </p>

              <div className="relative rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs overflow-hidden max-w-full">
                <div className="text-muted-foreground mb-2 text-[11px] font-semibold border-b border-border/50 pb-1">Sample SSE Event Payload:</div>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-emerald-600 dark:text-emerald-400 max-w-full">{`data: {"status":"running","stdout":"Hello World!\\n","stderr":"","exit_code":null}
data: {"status":"completed","stdout":"","stderr":"","exit_code":0}`}</pre>
              </div>
            </section>

            {/* Section 5: cURL Examples */}
            <section id="curl-examples" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">cURL Examples</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full example to submit a C++ payload and listen to real-time logs via cURL:
              </p>

              <div className="relative rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs overflow-hidden max-w-full">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground rounded-md z-10"
                  onClick={() => handleCopy("curlexample", quickstartCurl)}
                >
                  {copiedId === "curlexample" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-foreground max-w-full pr-8">{quickstartCurl}</pre>
              </div>
            </section>

            {/* Section 6: Python Integration */}
            <section id="python-sdk" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">Python Integration</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete Python script using <code className="font-mono bg-muted px-1 rounded border">requests</code> and <code className="font-mono bg-muted px-1 rounded border">sseclient-py</code> to submit code and stream execution logs.
              </p>

              <div className="relative rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs overflow-hidden max-w-full">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground rounded-md z-10"
                  onClick={() => handleCopy("pythonfull", pythonFullExample)}
                >
                  {copiedId === "pythonfull" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-foreground max-w-full pr-8">{pythonFullExample}</pre>
              </div>
            </section>

            {/* Section 7: Node.js Integration */}
            <section id="node-sdk" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">Node.js / JS Integration</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete JavaScript integration using standard <code className="font-mono bg-muted px-1 rounded border">fetch</code> and <code className="font-mono bg-muted px-1 rounded border">EventSource</code> API.
              </p>

              <div className="relative rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs overflow-hidden max-w-full">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-3 top-3 h-7 w-7 text-muted-foreground hover:text-foreground rounded-md z-10"
                  onClick={() => handleCopy("nodefull", nodeFullExample)}
                >
                  {copiedId === "nodefull" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="overflow-x-auto whitespace-pre leading-relaxed text-foreground max-w-full pr-8">{nodeFullExample}</pre>
              </div>
            </section>

            {/* Section 8: Rate Limits */}
            <section id="rate-limits" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">Rate Limits & Quotas</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every API key is provisioned with a flat quota of <strong>100 requests per day</strong>. Counters reset automatically 24 hours after key creation.
              </p>

              <div className="rounded-xl border bg-muted/60 dark:bg-[#070A10] p-4 font-mono text-xs text-amber-600 dark:text-amber-400 overflow-hidden max-w-full">
                <pre className="overflow-x-auto whitespace-pre max-w-full">{`{
  "error": "Rate limit exceeded",
  "limit": 100,
  "requests_today": 100,
  "remaining": 0,
  "resets_at": "2026-07-27T00:00:00Z"
}`}</pre>
              </div>
            </section>

            {/* Section 9: Execution Constraints */}
            <section id="constraints" className="space-y-4 scroll-mt-32 pt-6 border-t">
              <h2 className="text-xl font-bold tracking-tight">Sandbox Constraints & Security</h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
                  <span className="text-muted-foreground text-[11px]">Execution Timeout</span>
                  <p className="font-semibold text-sm text-foreground">7 Seconds Limit</p>
                  <p className="text-muted-foreground text-[11px]">Scripts exceeding 7s are killed with SIGKILL.</p>
                </div>
                <div className="rounded-xl border bg-card p-4 space-y-1 shadow-sm">
                  <span className="text-muted-foreground text-[11px]">Memory Boundary</span>
                  <p className="font-semibold text-sm text-foreground">256 MB RAM</p>
                  <p className="text-muted-foreground text-[11px]">Strict Docker cgroup memory isolation.</p>
                </div>
              </div>
            </section>

            {/* Bottom Callout Card */}
            <div className="space-y-3 pt-6 border-t">
              <div className="rounded-xl border bg-card p-6 space-y-3 shadow-sm">
                <div className="text-emerald-500">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Ready to test your code?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Test Python, C++, and Node.js code submissions live in your browser sandbox.
                  </p>
                </div>
                <div className="pt-2 flex gap-3">
                  <Link href="/playground">
                    <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-xs rounded-lg">
                      Open Playground
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="sm" variant="outline" className="text-xs rounded-lg">
                      Manage API Keys
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>

          {/* Right Column: TOC Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2 px-1">
                <ListTree className="h-4 w-4" />
                <span>On this page</span>
              </div>

              <nav className="space-y-0.5 text-xs">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    className={`block py-1.5 px-2.5 rounded-md transition-colors ${
                      activeSection === item.id
                        ? "text-foreground font-semibold bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
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
