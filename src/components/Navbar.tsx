"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, KeyRound, Play, BookOpen, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiKey } from "@/context/ApiKeyContext";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { apiKey, keyPrefix } = useApiKey();
  const mounted = useMounted();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: KeyRound },
    { href: "/playground", label: "Playground", icon: Play },
    { href: "/docs", label: "API Reference", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
              <Cpu className="h-4 w-4" />
            </div>
            <span>CodeEngine</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground border border-border">
              v1.0
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground border border-border/60"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-3">
          {/* Active Session Key indicator */}
          {apiKey ? (
            <div className="hidden sm:flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-muted-foreground">Active:</span>
              <span>{keyPrefix ? `${keyPrefix}...` : "Key Active"}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 border border-border bg-muted/30 px-2.5 py-1 rounded text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
              <span className="text-[11px]">No Active Key</span>
            </div>
          )}

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
