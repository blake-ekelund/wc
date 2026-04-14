"use client";

import { useState, useEffect } from "react";
import { Shield, Check, X, AlertTriangle, Loader2, Smartphone, Copy } from "lucide-react";

interface SecuritySectionProps {
  isLive: boolean;
}

export default function SecuritySection({ isLive }: SecuritySectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    if (!isLive) { setLoading(false); return; }
    fetch("/api/user-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get-status" }) })
      .then((r) => r.json())
      .then((d) => { setEnabled(d.enabled || false); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLive]);

  async function startSetup() {
    setSetupMode(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/user-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setup" }) });
      const data = await res.json();
      setSecret(data.secret); setQrDataUrl(data.qrDataUrl || "");
    } catch { setError("Failed to generate secret."); }
  }

  async function verify() {
    if (verifyCode.length !== 6) return;
    setVerifying(true); setError("");
    try {
      const res = await fetch("/api/user-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", code: verifyCode }) });
      const data = await res.json();
      if (res.ok && data.success) { setEnabled(true); setSetupMode(false); setSecret(""); setQrDataUrl(""); setVerifyCode(""); setSuccess("2FA is now active. You'll need your authenticator code on every sign-in."); }
      else setError(data.error || "Verification failed.");
    } catch { setError("Something went wrong."); }
    setVerifying(false);
  }

  async function disable() {
    setDisabling(true);
    try {
      await fetch("/api/user-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disable" }) });
      setEnabled(false); setShowDisable(false); setSuccess("2FA has been disabled.");
    } catch { /* ignore */ }
    setDisabling(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="text-sm text-muted mt-1">Manage two-factor authentication and account security</p>
      </div>

      {!isLive ? (
        <div className="text-center py-12">
          <Shield className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Security settings</h3>
          <p className="text-xs text-muted">Sign up for a free account to enable two-factor authentication.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-muted animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? "bg-emerald-100" : "bg-gray-100"}`}>
                <Shield className={`w-5 h-5 ${enabled ? "text-emerald-600" : "text-gray-400"}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Two-Factor Authentication</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span className={`text-xs font-medium ${enabled ? "text-emerald-600" : "text-muted"}`}>{enabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
            {enabled ? (
              <button onClick={() => setShowDisable(true)} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">Disable</button>
            ) : (
              <button onClick={startSetup} className="px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">Enable 2FA</button>
            )}
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />{success}
            </div>
          )}

          {/* Setup flow */}
          {setupMode && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-muted" /><h3 className="text-sm font-semibold text-foreground">Set up authenticator</h3></div>
                <button onClick={() => { setSetupMode(false); setSecret(""); setQrDataUrl(""); setVerifyCode(""); }} className="text-muted hover:text-foreground" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Step 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    <span className="text-sm font-medium text-foreground">Scan QR code or enter key</span>
                  </div>
                  <div className="flex gap-5 items-start">
                    {qrDataUrl && (
                      <div className="shrink-0">
                        <div className="bg-white border border-border rounded-xl p-2"><img src={qrDataUrl} alt="2FA QR Code" className="w-36 h-36" /></div>
                        <p className="text-[10px] text-muted mt-1.5 text-center">Scan with your app</p>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1.5">Or enter manually</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-foreground select-all break-all">{secret}</code>
                        <button onClick={() => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-2 py-2 text-xs text-muted border border-border hover:bg-surface rounded-lg transition-colors shrink-0" aria-label="Copy">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Step 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    <span className="text-sm font-medium text-foreground">Enter verification code</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="text" value={verifyCode} onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" className="w-36 px-4 py-2.5 text-center font-mono text-lg tracking-widest border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" maxLength={6} />
                    <button onClick={verify} disabled={verifyCode.length !== 6 || verifying} className="px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                      {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />} Activate
                    </button>
                  </div>
                  {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Disable confirmation */}
          {showDisable && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">Disable two-factor authentication?</div>
                  <p className="text-xs text-red-600 mt-1 mb-4">Your account will only be protected by password.</p>
                  <div className="flex items-center gap-3">
                    <button onClick={disable} disabled={disabling} className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">{disabling ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Yes, disable</button>
                    <button onClick={() => setShowDisable(false)} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <ul className="space-y-1.5 text-xs text-muted">
              <li>Compatible with Google Authenticator, Authy, 1Password</li>
              <li>Adds a 6-digit code step after your password on sign-in</li>
              <li>Codes refresh every 30 seconds</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
