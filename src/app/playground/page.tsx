"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  Terminal,
  Loader2,
  Key,
  Code2,
  SquareTerminal,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiKey } from "@/context/ApiKeyContext";
import { toast } from "sonner";

type Language = "python" | "cpp" | "javascript";

const STARTER_SNIPPETS: Record<Language, string> = {
  python: `# Python 3 Sandbox Demo
import sys

print("Hello from CodeEngine Python Sandbox!")
print("Reading stdin input...")

lines = sys.stdin.read().splitlines()
if lines:
    for i, line in enumerate(lines, 1):
        print(f"Line {i}: {line}")
else:
    print("No stdin provided. Try typing in the stdin box below!")
`,
  cpp: `// C++17 Sandbox Demo
#include <iostream>
#include <string>

int main() {
    std::cout << "Hello from CodeEngine C++ Sandbox!" << std::endl;
    std::string line;
    std::cout << "Reading stdin input..." << std::endl;
    while (std::getline(std::cin, line)) {
        std::cout << "Received input: " << line << std::endl;
    }
    return 0;
}
`,
  javascript: `// Node.js Sandbox Demo
console.log("Hello from CodeEngine JavaScript Sandbox!");

const fs = require('fs');
try {
  const input = fs.readFileSync(0, 'utf-8');
  if (input) {
    console.log("Input received:", JSON.stringify(input));
  } else {
    console.log("No stdin provided.");
  }
} catch (e) {
  console.error("Stdin read note:", e.message);
}
`,
};

type ExecutionStatus = "idle" | "queued" | "running" | "completed" | "error" | "timeout";

interface LogLine {
  id: string;
  type: "stdout" | "stderr" | "system";
  text: string;
}

export default function PlaygroundPage() {
  const { apiKey, keyPrefix } = useApiKey();

  const [inputKey, setInputKey] = useState<string>(() => apiKey || "");
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<string>(STARTER_SNIPPETS.python);
  const [inputData, setInputData] = useState<string>("Hello CodeEngine\nTest Stdin 123");

  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Remaining requests indicator
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  // Handle language change
  const handleLanguageChange = (val: Language) => {
    setLanguage(val);
    setCode(STARTER_SNIPPETS[val]);
  };

  // Helper to add log line
  const addLog = (type: "stdout" | "stderr" | "system", text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setLogs((prev) => [...prev, { id, type, text }]);
  };

  // Auto scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Fetch key remaining quota
  const fetchQuota = useCallback(async () => {
    const prefix = keyPrefix || (inputKey.length > 8 ? inputKey.substring(0, 10) : "");
    if (!prefix) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/keys/${encodeURIComponent(prefix)}/usage`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.remaining === "number") {
          setRemainingQuota(data.remaining);
        }
      }
    } catch {
      // Ignore quota fetch errors
    }
  }, [apiBaseUrl, keyPrefix, inputKey]);

  useEffect(() => {
    const loadQuota = () => {
      void fetchQuota();
    };
    loadQuota();
  }, [fetchQuota]);

  // Submit code for execution
  const handleRun = async () => {
    if (!inputKey.trim()) {
      toast.error("API Key required. Please paste your X-API-Key above.", {
        description: "Generate one on the Dashboard if you haven't yet.",
      });
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLogs([]);
    setStatus("queued");
    setIsExecuting(true);
    addLog("system", `Submitting execution request [language=${language}]...`);

    try {
      const res = await fetch(`${apiBaseUrl}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": inputKey.trim(),
        },
        body: JSON.stringify({
          language,
          code,
          input: inputData,
        }),
      });

      if (res.status === 401) {
        setStatus("error");
        setIsExecuting(false);
        toast.error("401 Unauthorized: Invalid or revoked API Key");
        addLog("stderr", "Error: 401 Unauthorized - Invalid X-API-Key header.");
        return;
      }

      if (res.status === 429) {
        setStatus("error");
        setIsExecuting(false);
        const errData = await res.json().catch(() => ({}));
        const resetMsg = errData.reset_time ? `Resets in ${errData.reset_time}` : "Quota exceeded (100/day)";
        toast.error(`429 Rate Limit Exceeded: ${resetMsg}`);
        addLog("stderr", `Error: 429 Rate Limit Exceeded. ${resetMsg}`);
        setRemainingQuota(0);
        return;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const subId = data.submission_id || data.id;

      if (!subId) {
        throw new Error("No submission_id returned from backend");
      }

      setSubmissionId(subId);
      addLog("system", `Submission accepted. ID: ${subId}`);
      addLog("system", `Connecting SSE stream at /stream/${subId}...`);

      // Connect SSE
      connectStream(subId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network Error";
      setStatus("error");
      setIsExecuting(false);
      toast.error(`Execution submission failed: ${msg}`);
      addLog("stderr", `Error submitting execution: ${msg}`);
    }
  };

  // Connect real SSE stream
  const connectStream = (subId: string) => {
    const streamUrl = `${apiBaseUrl}/stream/${subId}?api_key=${encodeURIComponent(inputKey.trim())}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    let seenStdout = "";
    let seenStderr = "";
    let lastStatus = "";

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const newStatus = (data.status || "running").toLowerCase() as ExecutionStatus;

        if (newStatus !== lastStatus) {
          lastStatus = newStatus;
          setStatus(newStatus);
          addLog("system", `Status update: ${newStatus.toUpperCase()}`);
        }

        if (data.stdout && data.stdout !== seenStdout) {
          const newChunk = data.stdout.startsWith(seenStdout)
            ? data.stdout.slice(seenStdout.length)
            : data.stdout;
          seenStdout = data.stdout;
          addLog("stdout", newChunk);
        }

        if (data.stderr && data.stderr !== seenStderr) {
          const newChunk = data.stderr.startsWith(seenStderr)
            ? data.stderr.slice(seenStderr.length)
            : data.stderr;
          seenStderr = data.stderr;
          addLog("stderr", newChunk);
        }

        if (["completed", "error", "timeout"].includes(newStatus)) {
          if (data.execution_time_ms !== undefined && data.execution_time_ms !== null) {
            addLog("system", `Process terminated. Duration: ${data.execution_time_ms}ms`);
          }
          setIsExecuting(false);
          es.close();
          fetchQuota();
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    es.onopen = () => {
      setStatus("running");
    };

    es.onerror = (err) => {
      console.error("SSE connection error:", err);
      if (es.readyState === EventSource.CLOSED) {
        addLog("system", "SSE connection closed.");
        setIsExecuting(false);
      }
    };
  };

  // Status badge styling helper
  const getStatusBadge = () => {
    switch (status) {
      case "idle":
        return <Badge variant="outline" className="font-mono text-[10px]">IDLE</Badge>;
      case "queued":
        return <Badge variant="secondary" className="font-mono text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"><Loader2 className="mr-1 h-3 w-3 animate-spin" />QUEUED</Badge>;
      case "running":
        return <Badge variant="secondary" className="font-mono text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"><Loader2 className="mr-1 h-3 w-3 animate-spin" />RUNNING</Badge>;
      case "completed":
        return <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />COMPLETED</Badge>;
      case "error":
        return <Badge variant="destructive" className="font-mono text-[10px] flex items-center gap-1"><XCircle className="h-3 w-3" />ERROR</Badge>;
      case "timeout":
        return <Badge variant="destructive" className="font-mono text-[10px] bg-amber-600 text-white flex items-center gap-1"><Clock className="h-3 w-3" />TIMEOUT (7s)</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-5">
        {/* Top Bar Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0D1117] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Key & Language */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* API Key Input */}
            <div className="flex flex-1 items-center gap-2">
              <Key className="h-4 w-4 text-slate-400 shrink-0" />
              <Input
                type="password"
                placeholder="Paste your X-API-Key (e.g. ce_live_...)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="font-mono text-xs h-9 bg-slate-900/60 border-slate-800 text-slate-100 rounded-lg focus-visible:ring-slate-700"
              />
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-slate-400 shrink-0" />
              <Select value={language} onValueChange={(val) => handleLanguageChange(val as Language)}>
                <SelectTrigger className="w-[150px] font-mono text-xs h-9 bg-slate-900/60 border-slate-800 text-slate-100 rounded-lg">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent className="bg-[#0D1117] border-slate-800 text-slate-100 rounded-lg">
                  <SelectItem value="python" className="font-mono text-xs">Python 3.11</SelectItem>
                  <SelectItem value="cpp" className="font-mono text-xs">C++ 17 (GCC)</SelectItem>
                  <SelectItem value="javascript" className="font-mono text-xs">Node.js 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Remaining Quota & Run Button */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            {remainingQuota !== null && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 border-r border-slate-800 pr-3">
                <span>Quota:</span>
                <Badge variant="outline" className="font-mono text-[11px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded-md">
                  {remainingQuota}/100 left
                </Badge>
              </div>
            )}

            <Button
              onClick={handleRun}
              disabled={isExecuting}
              size="sm"
              className="bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs gap-2 px-4 h-9 rounded-lg"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Executing
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor & Output Split Layout */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Code Editor & Stdin (Left 7 Cols) */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <Card className="rounded-xl border border-slate-800 bg-[#0D1117] shadow-sm flex flex-col overflow-hidden">
              <CardHeader className="py-2.5 px-4 border-b border-slate-800 bg-slate-900/40 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <FileCode className="h-4 w-4 text-slate-400" />
                  <span>main.{language === "cpp" ? "cpp" : language === "python" ? "py" : "js"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-md"
                  onClick={() => setCode(STARTER_SNIPPETS[language])}
                  title="Reset code snippet"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[420px] w-full border-b border-slate-800">
                  <Editor
                    height="100%"
                    language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : "python"}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                      fontSize: 13,
                      fontFamily: "var(--font-mono), monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stdin Panel */}
            <Card className="rounded-xl border border-slate-800 bg-[#0D1117] shadow-sm">
              <CardHeader className="py-2.5 px-4 border-b border-slate-800 bg-slate-900/40 space-y-0">
                <CardTitle className="text-xs font-mono text-slate-400 flex items-center gap-2 font-normal">
                  <SquareTerminal className="h-4 w-4 text-slate-400" />
                  Standard Input (stdin)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Type stdin input here..."
                  rows={3}
                  className="font-mono text-xs leading-relaxed bg-slate-900/60 border-slate-800 text-slate-100 resize-none rounded-lg focus-visible:ring-slate-700"
                />
              </CardContent>
            </Card>
          </div>

          {/* Execution Stream Output Terminal (Right 5 Cols) */}
          <div className="flex flex-col lg:col-span-5">
            <Card className="rounded-xl border border-slate-800 bg-[#0D1117] shadow-sm flex flex-col h-full min-h-[520px] overflow-hidden">
              <CardHeader className="py-2.5 px-4 border-b border-slate-800 bg-slate-900/40 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-mono font-semibold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-400" />
                  Terminal Stream
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col bg-[#070A10] text-slate-100 font-mono text-xs">
                {/* Output log display */}
                <div
                  ref={terminalRef}
                  className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs leading-relaxed max-h-[540px]"
                >
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 pt-24 text-center">
                      <Terminal className="h-8 w-8 mb-2.5 stroke-[1.25] text-slate-600" />
                      <p className="text-xs font-medium text-slate-400">Click &quot;Run Code&quot; to execute script.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Stdout/stderr SSE stream will output here live.</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={`whitespace-pre-wrap break-all ${
                          log.type === "stderr"
                            ? "text-red-400 font-medium"
                            : log.type === "system"
                            ? "text-slate-400 italic text-[11px]"
                            : "text-slate-200"
                        }`}
                      >
                        {log.type === "system" && <span className="mr-1.5 text-slate-500">❯</span>}
                        {log.text}
                      </div>
                    ))
                  )}
                </div>

                {/* Terminal Footer */}
                <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{submissionId ? `Sub ID: ${submissionId}` : "No Active Run"}</span>
                  <span>{logs.filter(l => l.type !== "system").length} output lines</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
