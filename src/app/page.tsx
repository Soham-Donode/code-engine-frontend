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
            src="/bg-image.png"
            alt="Lush Meadow Background"
            fill
            className="object-cover object-bottom"
            priority
          />
          {/* Soft gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/90 via-sky-50/40 to-transparent" />
        </div>

        {/* Hero Content Section */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 sm:pt-36 pb-8 sm:pb-12 space-y-6 sm:space-y-7 max-w-3xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif tracking-tight text-slate-900 leading-[1.12] sm:leading-[1.08] max-w-3xl font-normal">
            Autopilot for your Code Sandbox. <br />
            <span>Scale effortlessly</span>
          </h1>

          {/* Primary Call To Action */}
          <Link
            href="/dashboard"
            className="mt-2 sm:mt-4 bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium px-7 sm:px-9 py-3 sm:py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Get Started
          </Link>
        </div>

        {/* Bottom Card Mockup Floating in Meadow */}
        <div className="relative z-10 px-3 sm:px-12 pb-0 flex justify-center -mb-8">
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border border-white/80 space-y-5 sm:space-y-6 animate-slide-up-fade hover:-translate-y-1 transition-transform duration-300">
            
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  CE
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">CodeEngine Sandbox</h4>
                  <p className="text-[10px] text-slate-400 font-mono">runner-us-east • isolated</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                </span>
              </div>
            </div>

            {/* Card Body Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Execution Metrics Panel */}
              <div className="md:col-span-5 bg-slate-50/80 rounded-2xl p-4 space-y-4 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>API Requests</span>
                  <span className="font-mono text-slate-700 font-bold">142.8k</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">42ms</p>
                    <p className="text-[9px] text-slate-400">avg latency</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">99.9%</p>
                    <p className="text-[9px] text-slate-400">success rate</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600">3</p>
                    <p className="text-[9px] text-slate-400">runtimes</p>
                  </div>
                </div>
                <div className="border-t border-slate-200/60 pt-3">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Active Containers</span>
                    <span className="font-mono text-slate-700 font-bold">12 / 50</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-medium">Python 3.12</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-medium">Node 20</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-medium">GCC 13</span>
                  </div>
                </div>
              </div>

              {/* Live Code Sandbox Output Simulation */}
              <div className="md:col-span-7 bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> POST /api/execute
                  </span>
                  <span className="text-slate-400">200 OK • 38ms</span>
                </div>
                <p className="text-slate-400 text-[11px] overflow-x-auto">
                  <span className="text-purple-400">def</span> <span className="text-blue-300">execute_code</span>(input):<br />
                  &nbsp;&nbsp;<span className="text-purple-400">return</span> f<span className="text-emerald-300">&quot;Result: &#123;eval(input)&#125;&quot;</span>
                </p>
                <div className="bg-slate-800/80 rounded-xl p-2.5 text-emerald-400 flex items-center justify-between text-[11px] border border-slate-700/60">
                  <span>Output: &quot;Result: 42&quot; ✓</span>
                  <span className="text-[9px] text-slate-400 font-sans">Exit code: 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
