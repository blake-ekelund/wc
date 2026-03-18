"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Sparkles,
  Palette,
  Monitor,
  Home,
  UsersRound,
  ClipboardList,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { industryPresets, type IndustryPreset } from "./industry-presets";

const iconMap: Record<string, LucideIcon> = {
  building2: Building2,
  monitor: Monitor,
  home: Home,
  usersRound: UsersRound,
  clipboardList: ClipboardList,
  wrench: Wrench,
};

interface OnboardingProps {
  onComplete: (preset: IndustryPreset, companyName: string, userName: string, userEmail: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0); // 0 = welcome/name+email, 1 = industry select, 2 = company name
  const [selectedPreset, setSelectedPreset] = useState<IndustryPreset | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  function handleSelectIndustry(preset: IndustryPreset) {
    setSelectedPreset(preset);
    setCompanyName(preset.companyName);
    setStep(2);
  }

  function handleFinish() {
    if (selectedPreset) {
      onComplete(selectedPreset, companyName.trim() || selectedPreset.companyName, userName.trim(), userEmail.trim());
    }
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim());
  const canProceedFromWelcome = userName.trim().length >= 1 && isValidEmail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-lg w-full text-center"
          >
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">
                Welcome to WorkChores
              </h1>
              <p className="text-muted text-lg leading-relaxed">
                Let&apos;s set up your CRM in under a minute. We&apos;ll customize
                everything to fit your industry.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 mb-6 text-left max-w-sm mx-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedFromWelcome) setStep(1);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Work email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedFromWelcome) setStep(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
              {[
                { icon: Palette, text: "Custom pipeline stages for your workflow" },
                { icon: Building2, text: "Industry-specific fields and contacts" },
                { icon: Sparkles, text: "Pre-loaded with realistic sample data" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-accent" />
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!canProceedFromWelcome}
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="mt-4 text-xs text-muted">No signup required — this is a live demo</p>
          </motion.div>
        )}

        {/* Step 1: Industry Selection */}
        {step === 1 && (
          <motion.div
            key="industry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-3xl w-full"
          >
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What industry are you in?
              </h2>
              <p className="text-muted">
                Pick a template and we&apos;ll customize your pipeline, data, and workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryPresets.map((preset, i) => {
                const Icon = iconMap[preset.icon] || Building2;
                return (
                  <motion.button
                    key={preset.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleSelectIndustry(preset)}
                    onMouseEnter={() => setHoveredId(preset.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      hoveredId === preset.id
                        ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 scale-[1.02]"
                        : "border-border bg-white hover:border-accent/40 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      hoveredId === preset.id ? "bg-accent/15" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${hoveredId === preset.id ? "text-accent" : "text-gray-500"}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{preset.name}</h3>
                    <p className="text-xs text-muted leading-relaxed mb-3">
                      {preset.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {preset.stages.slice(0, 4).map((s) => (
                        <span key={s.label} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${s.bgColor} ${s.color}`}>
                          {s.label}
                        </span>
                      ))}
                      {preset.stages.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-500">
                          +{preset.stages.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Hover arrow */}
                    <div className={`absolute top-5 right-5 transition-opacity ${hoveredId === preset.id ? "opacity-100" : "opacity-0"}`}>
                      <ArrowRight className="w-4 h-4 text-accent" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2: Company Name */}
        {step === 2 && selectedPreset && (
          <motion.div
            key="company"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-lg w-full"
          >
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              {(() => {
                const Icon = iconMap[selectedPreset.icon] || Building2;
                return (
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                );
              })()}
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Almost there!
              </h2>
              <p className="text-muted">
                Name your workspace — you can always change it later.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-border p-6 mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Company / Workspace name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={selectedPreset.companyName}
                className="w-full px-4 py-3 border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinish();
                }}
              />

              {/* Preview what they're getting */}
              <div className="mt-5 pt-5 border-t border-border">
                <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Your setup includes</div>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm text-foreground font-medium">{selectedPreset.stages.length}-stage pipeline</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPreset.stages.map((s) => (
                          <span key={s.label} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${s.bgColor} ${s.color}`}>
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground">
                      Industry-specific tracking fields
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground">
                      Sample data with tasks &amp; activity
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              <Sparkles className="w-4 h-4" />
              Launch My CRM
            </button>

            <p className="mt-3 text-center text-xs text-muted">
              Everything is fully customizable after setup
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
