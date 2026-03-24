"use client";

import { FadeIn } from "./animated";
import { products } from "@/lib/products";
import { Puzzle, Check } from "lucide-react";

const livePlugins = products.filter((p) => p.status === "live");
const upcomingPlugins = products.filter((p) => p.status !== "live");

export default function SuitePlatform() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-5">
              <Puzzle className="w-3.5 h-3.5" />
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              One platform. Every plugin included.
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg leading-relaxed">
              WorkChores is the platform. CRM, Vendor Management, and Tasks are product plugins that come with every seat. No add-ons, no tiers, no surprises.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          {/* Platform visual */}
          <div className="relative max-w-3xl mx-auto">
            {/* Platform shell */}
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/50 p-6 md:p-8">
              {/* Platform header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                    <span className="text-white text-xs font-bold">WC</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tracking-tight">WorkChores Platform</span>
                </div>
                <span className="text-xs text-muted">1 seat = all plugins</span>
              </div>

              {/* Live plugins */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {livePlugins.map((plugin) => (
                  <div
                    key={plugin.name}
                    className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
                  >
                    <div className="p-2 rounded-lg bg-accent text-white shrink-0">
                      <plugin.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{plugin.name}</div>
                      <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Included
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming plugins */}
              {upcomingPlugins.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingPlugins.map((plugin) => (
                    <div
                      key={plugin.name}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 p-4"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-400 shrink-0">
                        <plugin.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-500">{plugin.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Coming {plugin.targetDate || "soon"} · Included free
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Pricing callout */}
        <FadeIn>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-8 px-8 py-5 rounded-2xl bg-foreground text-white">
              <div>
                <span className="text-3xl font-extrabold">$5</span>
                <span className="text-white/60 text-sm ml-1">/seat/month</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-left">
                <div className="text-sm font-semibold">Every plugin. Every seat.</div>
                <div className="text-xs text-white/50">No per-plugin pricing. No hidden fees.</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
