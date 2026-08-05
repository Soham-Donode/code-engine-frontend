"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Zap, LogOut, Menu, X, LayoutDashboard, Play, BookOpen, KeyRound } from "lucide-react";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mounted = useMounted();

  const isLanding = pathname === "/";
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    clearKey();
    await signOut();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/playground", label: "Playground", icon: Play },
    { href: "/docs", label: "API Reference", icon: BookOpen },
  ];

  const headerClasses = isLanding
    ? "absolute top-0 left-0 right-0 z-50 bg-transparent transition-all duration-700 ease-out"
    : "sticky top-0 z-50 w-full bg-card/90 backdrop-blur-xl border-b border-border transition-all duration-700 ease-out";

  return (
    <header className={headerClasses}>
      {/* Inner container */}
      <div
        className={`relative mx-auto flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-7xl ${
          isLanding
            ? "bg-transparent border-transparent shadow-none px-4 pt-5 pb-2 sm:px-8 sm:pt-6"
            : "px-4 py-3 sm:px-6"
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 z-10 shrink-0">
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

        {/* Desktop Centered Navigation Pill (Hidden on Mobile) */}
        <div
          className={`hidden md:flex absolute left-1/2 -translate-x-1/2 z-10 items-center gap-1.5 transition-all duration-500 rounded-xl ${
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

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 z-10 shrink-0">
          {/* Active Session Key indicator */}
          {!isLanding && (
            <>
              {apiKey ? (
                <div className="hidden lg:flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium opacity-80">Active:</span>
                  <span>{keyPrefix ? `${keyPrefix}...` : "Key Active"}</span>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2 border border-border bg-card/80 px-3 py-1 rounded-full text-xs font-mono text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                  <span className="text-[11px]">No Active Key</span>
                </div>
              )}
            </>
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

          {/* Auth Profile / Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border transition-all hover:scale-105 active:scale-95 ${
                  isLanding
                    ? "bg-slate-900 text-white border-slate-800"
                    : "bg-foreground text-background border-border"
                }`}
                title={user.email || "Account Profile"}
              >
                {userInitial}
              </button>

              {/* Profile Dropdown Popover */}
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 space-y-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-2.5 px-2 pt-1 border-b border-border/50 pb-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {userInitial}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {user.email?.split("@")[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate font-mono">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`text-xs font-semibold px-4 py-2 sm:px-5 sm:py-2 rounded-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                isLanding
                  ? "bg-slate-950 hover:bg-slate-800 text-white"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              Log in
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
              isLanding
                ? "bg-white/80 border-slate-200 text-slate-900 shadow-sm"
                : "bg-card border-border text-foreground"
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Glassmorphic Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/80 bg-card/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? isLanding
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {!isLanding && apiKey && (
            <div className="pt-2 border-t border-border/60">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Key</span>
                </span>
                <span>{keyPrefix ? `${keyPrefix}...` : "Active"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}

