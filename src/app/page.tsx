import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-[#E5ECEC] text-slate-900 font-sans flex justify-center items-center">
      {/* Full Screen Outer Canvas */}
      <div className="relative w-full min-h-screen overflow-hidden shadow-2xl bg-sky-100 flex flex-col justify-between">
        
        {/* Background Landscape Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-landscape.png"
            alt="Lush Meadow Background"
            fill
            className="object-cover object-bottom"
            priority
          />
          {/* Soft gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/90 via-sky-50/40 to-transparent" />
        </div>

        {/* Hero Content Section */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-16 sm:pt-24 pb-8 space-y-6 max-w-3xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl font-serif tracking-tight text-slate-900 leading-[1.08] max-w-3xl font-normal">
            Autopilot for your Code Sandbox. <br />
            <span>Scale effortlessly</span>
          </h1>

          {/* Primary Call To Action */}
          <Link
            href="/dashboard"
            className="mt-4 bg-slate-950 hover:bg-slate-800 text-white text-sm font-medium px-9 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Get Started
          </Link>
        </div>

        {/* Bottom Card Mockup Floating in Meadow */}
        <div className="relative z-10 px-4 sm:px-12 pb-0 flex justify-center -mb-8">
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 shadow-2xl border border-white/80 space-y-6 transform translate-y-4 hover:translate-y-2 transition-transform duration-300">
            
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  CE
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">CodeEngine Sandbox</h4>
                  <p className="text-[10px] text-slate-400 font-mono">my space • v1.0</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Board:</span>
                <span className="text-sm font-bold text-slate-900">CRM</span>
                <span className="text-xs text-slate-400 font-mono">(4)</span>
              </div>
            </div>

            {/* Card Body Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Stats Panel */}
              <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-4 space-y-4 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>New leads</span>
                  <span className="font-mono">23</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">12</p>
                    <p className="text-[9px] text-slate-400">send request</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">10</p>
                    <p className="text-[9px] text-slate-400">in chat now</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">1</p>
                    <p className="text-[9px] text-slate-400">close chat</p>
                  </div>
                </div>
                <div className="border-t border-slate-200/60 pt-3">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>New clients</span>
                    <span className="font-mono">3</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1">23 251$</p>
                </div>
              </div>

              {/* Live Output Simulation */}
              <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Marcus #SH-24819
                  </span>
                  <span>Ready</span>
                </div>
                <p className="text-slate-300">Hey, I ordered yesterday. Where is it?</p>
                <div className="bg-slate-800/60 rounded-xl p-2.5 text-emerald-400 flex items-center justify-between text-[11px]">
                  <span>Found it ✓</span>
                  <span className="text-[9px] text-slate-400">Order lookup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
