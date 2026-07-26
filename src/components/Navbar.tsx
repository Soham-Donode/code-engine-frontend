"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, KeyRound, Play, BookOpen, Cpu, User as UserIcon, LogOut, LogIn } from "lucide-react";
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

  const handleSignOut = async () => {
    clearKey();
    await signOut();
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: KeyRound },
    { href: "/playground", label: "Playground", icon: Play },
    { href: "/docs", label: "API Reference", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white transition-colors hover:text-slate-200">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-white border border-slate-700/60">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">CodeEngine</span>
            <span className="rounded-md bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 border border-slate-700/50">
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
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
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
            <div className="hidden sm:flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium text-slate-400">Active:</span>
              <span>{keyPrefix ? `${keyPrefix}...` : "Key Active"}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="text-[11px]">No Active Key</span>
            </div>
          )}

          {/* Auth Status & Sign In Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-300">
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 gap-1 px-2.5 rounded-lg"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              className="h-8 bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs gap-1.5 px-3 rounded-lg"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-slate-300" />
              ) : (
                <Moon className="h-4 w-4" />
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
