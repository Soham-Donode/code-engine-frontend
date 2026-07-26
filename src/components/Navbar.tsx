"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Zap, User as UserIcon, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiKey } from "@/context/ApiKeyContext";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { apiKey, keyPrefix, clearKey } = useApiKey();
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const mounted = useMounted();

  const isLanding = pathname === "/";

  const handleSignOut = async () => {
    clearKey();
    await signOut();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/playground", label: "Playground" },
    { href: "/docs", label: "API Reference" },
  ];

  const headerClasses = isLanding
    ? "absolute top-0 left-0 right-0 z-50 bg-transparent transition-all duration-700 ease-out"
    : "sticky top-0 z-50 w-full bg-card/90 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-700 ease-out";

  return (
    <header className={headerClasses}>
      {/* Inner flex container constrained to max-w-7xl matching all pages */}
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-7xl ${
          isLanding
            ? "bg-transparent border-transparent shadow-none px-6 pt-6 pb-2 sm:px-10"
            : "px-4 py-3 sm:px-6"
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-500 shadow-md ${
                isLanding
                  ? "bg-slate-900 text-white group-hover:scale-105"
                  : "bg-foreground text-background group-hover:scale-105"
              }`}
            >
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span
              className={`text-lg font-bold tracking-tight transition-colors duration-500 ${
                isLanding ? "text-slate-900" : "text-foreground"
              }`}
            >
              CodeEngine
            </span>
          </Link>
        </div>

        {/* Floating / Integrated Center Links */}
        <div
          className={`flex items-center gap-1.5 transition-all duration-500 rounded-xl ${
            isLanding
              ? "bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-lg"
              : "bg-muted/40 p-1 rounded-xl"
          }`}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? isLanding
                      ? "bg-slate-900/10 backdrop-blur-md text-slate-950 font-semibold border border-slate-900/15 shadow-sm"
                      : "bg-card text-foreground font-semibold shadow-sm border border-border/50"
                    : isLanding
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-900/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — auth + tools */}
        <div className="flex items-center gap-3">
          {/* Active Session Key indicator */}
          {!isLanding && (
            <>
              {apiKey ? (
                <div className="hidden sm:flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium opacity-80">Active:</span>
                  <span>{keyPrefix ? `${keyPrefix}...` : "Key Active"}</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2 border border-border bg-card/80 px-3 py-1 rounded-full text-xs font-mono text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  <span className="text-[11px]">No Active Key</span>
                </div>
              )}
            </>
          )}

          {/* Auth Status & Log In / Sign Out */}
          {user ? (
            <div className="flex items-center gap-2">
              {!isLanding && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card/80 text-xs font-mono text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={`h-8 text-xs gap-1 px-3 rounded-full transition-all duration-300 ${
                  isLanding
                    ? "text-slate-700 hover:text-slate-900 hover:bg-white/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`text-xs font-semibold px-5 py-2 rounded-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                isLanding
                  ? "bg-slate-950 hover:bg-slate-800 text-white"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              Log in
            </button>
          )}

          {/* Theme Toggle */}
          {!isLanding && mounted && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border bg-card/80 text-muted-foreground hover:text-foreground rounded-xl transition-all duration-300"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
