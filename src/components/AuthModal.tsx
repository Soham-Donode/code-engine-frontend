"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);
    } catch {
      // toast shown in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      onOpenChange(false);
    } catch {
      // toast shown in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0E1526] border-[#1E293B] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <LogIn className="h-5 w-5 text-[#00E599]" />
            Account Authentication
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Sign in to store and isolate your API keys per account in Supabase.
          </DialogDescription>
        </DialogHeader>

        {!isConfigured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <p className="font-semibold text-amber-200">Supabase Setup Required</p>
            <p className="mt-1 text-[11px] opacity-90">
              Please add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code> to enable live Supabase Auth.
            </p>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-[#0A0F1D] border-[#1E293B] hover:bg-[#162035] text-slate-200 text-xs font-semibold h-10 gap-2.5"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#1E293B]" />
            <span className="bg-[#0E1526] px-2.5 text-[11px] text-slate-500 uppercase tracking-wider">
              Or with Gmail / Email
            </span>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0A0F1D] p-1 border border-[#1E293B]">
              <TabsTrigger value="signin" className="text-xs font-semibold data-[state=active]:bg-[#162035] data-[state=active]:text-[#00E599]">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs font-semibold data-[state=active]:bg-[#162035] data-[state=active]:text-[#00E599]">
                Register
              </TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin" className="space-y-3 pt-3">
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-[#0A0F1D] border-[#1E293B] text-slate-100 text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-[#0A0F1D] border-[#1E293B] text-slate-100 text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00E599] text-slate-950 hover:bg-[#00E599]/90 font-bold text-xs h-9 mt-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup" className="space-y-3 pt-3">
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-[#0A0F1D] border-[#1E293B] text-slate-100 text-xs h-9 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-[#0A0F1D] border-[#1E293B] text-slate-100 text-xs h-9 font-mono"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00E599] text-slate-950 hover:bg-[#00E599]/90 font-bold text-xs h-9 mt-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
