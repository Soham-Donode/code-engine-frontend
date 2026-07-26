import type { Metadata } from "next";
import "./globals.css";
import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ApiKeyProvider } from "@/context/ApiKeyContext";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "CodeEngine | Sandboxed Code Execution API & Dashboard",
  description:
    "Dense technical developer tool and playground for the CodeEngine code execution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable, geistMono.variable, instrumentSerif.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <ApiKeyProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster position="bottom-right" richColors />
            </ApiKeyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
