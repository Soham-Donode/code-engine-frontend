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

  // On landing page: absolute + transparent so it floats over the hero image
  // On inner pages: sticky + semi-opaque backdrop so it stays at the top
  const headerClasses = isLanding
    ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
    : "sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md";

  return (
    <header className={headerClasses}>
      {/* Absolute positioning container for true centering */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-2 sm:px-10 min-h-[64px]">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-md ${
              isLanding ? "bg-slate-900 text-white" : "bg-foreground text-background"
            }`}>
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${
              isLanding ? "text-slate-900" : "text-foreground"
            }`}>
              CodeEngine
            </span>
          </Link>
        </div>

        {/* Center: Absolutely Centered Floating Squircle Navigation */}
        <div className={`absolute left-1/2 -translate-x-1/2 top-6 z-20 hidden md:flex items-center gap-1.5 backdrop-blur-md p-1.5 rounded-2xl border shadow-lg text-xs font-medium ${
          isLanding
            ? "bg-white/90 border-white/80 text-slate-700"
            : "bg-card/90 border-border text-muted-foreground"
        }`}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isLanding
                      ? "bg-slate-900/10 dark:bg-white/20 backdrop-blur-md text-slate-950 font-semibold border border-slate-900/15 dark:border-white/30 shadow-inner"
                      : "bg-foreground/10 dark:bg-white/15 backdrop-blur-md text-foreground font-semibold border border-foreground/15 dark:border-white/20 shadow-sm"
                    : isLanding
                      ? "hover:text-slate-950 hover:bg-slate-900/5"
                      : "hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — auth + tools */}
        <div className="flex items-center gap-3 z-10">
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
                <div className="hidden sm:flex items-center gap-2 border border-border bg-card px-3 py-1 rounded-full text-xs font-mono text-muted-foreground">
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
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={`h-8 text-xs gap-1 px-3 rounded-full ${
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
              className={`text-xs font-semibold px-6 py-2.5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 ${
                isLanding
                  ? "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/80"
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
              className="h-8 w-8 border-border bg-card text-muted-foreground hover:text-foreground rounded-full"
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
