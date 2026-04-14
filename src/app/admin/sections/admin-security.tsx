"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle2, AlertTriangle, Copy, Smartphone, X } from "lucide-react";
import { adminFetch } from "./_shared";

export default function AdminSecuritySection() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSource, setTwoFaSource] = useState<"database" | "env" | "none">("none");
  const [loading, setLoading] = useState(true);

  // Setup flow
  const [setupMode, setSetupMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable flow
  const [disabling, setDisabling] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const data = await adminFetch("get-2fa-status");
      setTwoFaEnabled(data.enabled);
      setTwoFaSource(data.source);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function startSetup() {
    setSetupMode(true);
    setSetupError("");
    setSetupSuccess(false);
    try {
      const data = await adminFetch("setup-2fa");
      setSecret(data.secret);
      setUri(data.uri);
      setQrDataUrl(data.qrDataUrl || "");
    } catch {
      setSetupError("Failed to generate secret.");
    }
  }

  async function verifyAndActivate() {
    if (verifyCode.length !== 6) return;
    setVerifying(true);
    setSetupError("");
    try {
      const data = await adminFetch("verify-2fa", { code: verifyCode });
      if (data.success) {
        setSetupSuccess(true);
        setTwoFaEnabled(true);
        setTwoFaSource("database");
        setSetupMode(false);
        setSecret("");
        setUri("");
        setVerifyCode("");
      }
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Verification failed.");
    }
    setVerifying(false);
  }

  async function disable2fa() {
    setDisabling(true);
    try {
      await adminFetch("disable-2fa");
      setTwoFaEnabled(false);
      setTwoFaSource("none");
      setShowDisableConfirm(false);
    } catch { /* ignore */ }
    setDisabling(false);
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Admin Security</h2>
        <p className="text-xs text-gray-400 mt-0.5">Manage two-factor authentication for the admin panel</p>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${twoFaEnabled ? "bg-emerald-100" : "bg-gray-100"}`}>
              <Shield className={`w-5 h-5 ${twoFaEnabled ? "text-emerald-600" : "text-gray-400"}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Two-Factor Authentication</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${twoFaEnabled ? "bg-emerald-500" : "bg-gray-300"}`} />
                <span className={`text-xs font-medium ${twoFaEnabled ? "text-emerald-600" : "text-gray-500"}`}>
                  {twoFaEnabled ? "Enabled" : "Disabled"}
                </span>
                {twoFaEnabled && twoFaSource === "env" && (
                  <span className="text-[10px] text-gray-400">(via environment variable)</span>
                )}
              </div>
            </div>
          </div>
          {twoFaEnabled ? (
            <button onClick={() => setShowDisableConfirm(true)} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
              Disable
            </button>
          ) : (
            <button onClick={startSetup} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* Setup success */}
      {setupSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-sm font-medium text-emerald-800">2FA is now active</div>
            <div className="text-xs text-emerald-600 mt-0.5">You'll need your authenticator app code on every login.</div>
          </div>
        </div>
      )}

      {/* Setup flow */}
      {setupMode && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Set up your authenticator</h3>
            </div>
            <button onClick={() => { setSetupMode(false); setSecret(""); setUri(""); setVerifyCode(""); }} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                <span className="text-sm font-medium text-gray-900">Add to your authenticator app</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Scan the QR code with your authenticator app, or enter the secret key manually:</p>

              <div className="flex gap-5 items-start">
                {/* QR Code */}
                {qrDataUrl && (
                  <div className="shrink-0">
                    <div className="bg-white border border-gray-200 rounded-xl p-2">
                      <img src={qrDataUrl} alt="2FA QR Code" className="w-40 h-40" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">Scan with your app</p>
                  </div>
                )}

                {/* Manual key */}
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Or enter manually</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-800 select-all break-all">{secret}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="px-2 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shrink-0"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Account: <strong>WorkChores:admin</strong> · Type: Time-based · 6 digits</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                <span className="text-sm font-medium text-gray-900">Verify it works</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Enter the 6-digit code from your authenticator app to activate 2FA:</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setSetupError(""); }}
                  placeholder="000000"
                  className="w-40 px-4 py-2.5 text-center font-mono text-lg tracking-widest border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
                  maxLength={6}
                  autoFocus
                />
                <button
                  onClick={verifyAndActivate}
                  disabled={verifyCode.length !== 6 || verifying}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  Activate 2FA
                </button>
              </div>
              {setupError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{setupError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable confirmation */}
      {showDisableConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-800">Disable two-factor authentication?</div>
              <p className="text-xs text-red-600 mt-1 mb-4">Your admin panel will only be protected by password. This reduces security.</p>
              <div className="flex items-center gap-3">
                <button onClick={disable2fa} disabled={disabling} className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {disabling ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Yes, disable 2FA
                </button>
                <button onClick={() => setShowDisableConfirm(false)} className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">How it works</h4>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li>• When enabled, you'll enter a 6-digit code from your authenticator app after your password</li>
          <li>• Compatible with Google Authenticator, Authy, 1Password, and any TOTP-based app</li>
          <li>• Codes refresh every 30 seconds with a ±30 second tolerance for clock drift</li>
          <li>• Login notifications are sent to your email on every successful login regardless of 2FA</li>
        </ul>
      </div>
    </div>
  );
}
