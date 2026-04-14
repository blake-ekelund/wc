"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Trash2,
  Pencil,
  Check,
  Link2,
  Unlink,
  Loader2,
} from "lucide-react";
import { type EmailTemplate } from "@/components/demo/email-templates";
import { trackEvent } from "@/lib/track-event";

interface EmailSectionProps {
  emailTemplates: EmailTemplate[];
  onUpdateEmailTemplates: (templates: EmailTemplate[]) => void;
  emailSignature: string;
  onUpdateSignature: (signature: string) => void;
  isLive: boolean;
}

export default function EmailSection({
  emailTemplates,
  onUpdateEmailTemplates,
  emailSignature,
  onUpdateSignature,
  isLive,
}: EmailSectionProps) {
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateSubject, setEditTemplateSubject] = useState("");
  const [editTemplateBody, setEditTemplateBody] = useState("");
  const [editTemplateCategory, setEditTemplateCategory] = useState<EmailTemplate["category"]>("follow-up");
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const categoryColors: Record<string, { bg: string; text: string }> = {
    "follow-up": { bg: "bg-blue-50", text: "text-blue-700" },
    intro: { bg: "bg-emerald-50", text: "text-emerald-700" },
    proposal: { bg: "bg-violet-50", text: "text-violet-700" },
    "thank-you": { bg: "bg-amber-50", text: "text-amber-700" },
    "check-in": { bg: "bg-gray-100", text: "text-gray-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Email</h2>
        <p className="text-sm text-muted mt-1">Email integration, templates, and signature</p>
      </div>

      {/* Gmail Integration */}
      <IntegrationsPanel isLive={isLive} />

      {/* Email Signature */}
      <SignatureEditor
        signature={emailSignature}
        onSave={(sig) => onUpdateSignature(sig)}
        isLive={isLive}
      />

      {/* Email Templates */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Email Templates</h3>
            <p className="text-xs text-muted mt-0.5">Customize templates your team uses when emailing contacts</p>
          </div>
          <button
            onClick={() => {
              setShowAddTemplate(true);
              setEditingTemplateId(null);
              setEditTemplateName("");
              setEditTemplateSubject("");
              setEditTemplateBody("");
              setEditTemplateCategory("follow-up");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Template
          </button>
        </div>

        {/* Add / Edit template form */}
        {(showAddTemplate || editingTemplateId) && (
          <div className="px-5 py-4 border-b border-border bg-surface/50">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted block mb-1">Template Name</label>
                  <input type="text" value={editTemplateName} onChange={(e) => setEditTemplateName(e.target.value)} placeholder="e.g., Follow-Up After Demo" className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted block mb-1">Category</label>
                  <select value={editTemplateCategory} onChange={(e) => setEditTemplateCategory(e.target.value as EmailTemplate["category"])} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                    <option value="follow-up">Follow-Up</option>
                    <option value="intro">Introduction</option>
                    <option value="proposal">Proposal</option>
                    <option value="thank-you">Thank You</option>
                    <option value="check-in">Check-In</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Subject Line</label>
                <input type="text" value={editTemplateSubject} onChange={(e) => setEditTemplateSubject(e.target.value)} placeholder="e.g., Great connecting, {{firstName}}!" className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Body</label>
                <textarea value={editTemplateBody} onChange={(e) => setEditTemplateBody(e.target.value)} placeholder={"Hi {{firstName}},\n\nWrite your template here..."} rows={6} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none" />
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 border border-border">
                <p className="text-[11px] text-muted">
                  <span className="font-medium">Available variables:</span>{" "}
                  <code className="text-accent">{"{{firstName}}"}</code>{" "}
                  <code className="text-accent">{"{{company}}"}</code>{" "}
                  <code className="text-accent">{"{{senderName}}"}</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!editTemplateName.trim() || !editTemplateSubject.trim()) return;
                    if (editingTemplateId) {
                      const updated = emailTemplates.map((t) =>
                        t.id === editingTemplateId
                          ? { ...t, name: editTemplateName.trim(), subject: editTemplateSubject.trim(), body: editTemplateBody.trim(), category: editTemplateCategory }
                          : t
                      );
                      onUpdateEmailTemplates(updated);
                    } else {
                      const newTemplate: EmailTemplate = {
                        id: `t-${Date.now()}`,
                        name: editTemplateName.trim(),
                        subject: editTemplateSubject.trim(),
                        body: editTemplateBody.trim(),
                        category: editTemplateCategory,
                      };
                      onUpdateEmailTemplates([...emailTemplates, newTemplate]);
                    }
                    setEditingTemplateId(null);
                    setShowAddTemplate(false);
                    setEditTemplateName("");
                    setEditTemplateSubject("");
                    setEditTemplateBody("");
                    if (isLive) trackEvent("settings.email_template_saved");
                  }}
                  disabled={!editTemplateName.trim() || !editTemplateSubject.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTemplateId ? "Save Changes" : "Add Template"}
                </button>
                <button
                  onClick={() => { setEditingTemplateId(null); setShowAddTemplate(false); }}
                  className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template list */}
        <div className="divide-y divide-border">
          {emailTemplates.map((t) => {
            const cat = categoryColors[t.category] || categoryColors["check-in"];
            return (
              <div key={t.id} className="px-5 py-3 hover:bg-surface/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                    <Mail className={`w-4 h-4 ${cat.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted truncate">{t.subject}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.text} shrink-0 hidden sm:inline`}>{t.category}</span>
                  <button
                    onClick={() => {
                      setEditingTemplateId(t.id);
                      setShowAddTemplate(false);
                      setEditTemplateName(t.name);
                      setEditTemplateSubject(t.subject);
                      setEditTemplateBody(t.body);
                      setEditTemplateCategory(t.category);
                    }}
                    className="p-1.5 text-muted hover:text-foreground transition-colors"
                    aria-label="Edit template"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateEmailTemplates(emailTemplates.filter((et) => et.id !== t.id))}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors"
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {emailTemplates.length === 0 && (
            <div className="text-center py-12 text-sm text-muted">No email templates yet. Add one to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Integrations Panel (Gmail OAuth connect/disconnect)
// =============================================
function IntegrationsPanel({ isLive }: { isLive: boolean }) {
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string; loading: boolean }>({ connected: false, loading: !isLive ? false : true });
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setGmailStatus({ connected: data.connected, email: data.email, loading: false }))
      .catch(() => setGmailStatus({ connected: false, loading: false }));
  }, [isLive]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      setGmailStatus({ connected: false, loading: false });
    } catch { /* ignore */ }
    setDisconnecting(false);
  }

  const gmailIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M22 6.5V17.5C22 18.6046 21.1046 19.5 20 19.5H18V8.5L12 12.5L6 8.5V19.5H4C2.89543 19.5 2 18.6046 2 17.5V6.5C2 5.39543 2.89543 4.5 4 4.5H4.5L12 9.5L19.5 4.5H20C21.1046 4.5 22 5.39543 22 6.5Z" fill="#EA4335"/>
      <path d="M22 6.5L12 12.5L2 6.5" stroke="#EA4335" strokeWidth="0"/>
      <path d="M6 8.5V19.5H4C2.89543 19.5 2 18.6046 2 17.5V6.5L12 12.5" fill="#34A853"/>
      <path d="M18 8.5V19.5H20C21.1046 19.5 22 18.6046 22 17.5V6.5L12 12.5" fill="#4285F4"/>
      <path d="M2 6.5C2 5.39543 2.89543 4.5 4 4.5H4.5L12 9.5L2 3.5V6.5Z" fill="#FBBC05"/>
      <path d="M22 6.5C22 5.39543 21.1046 4.5 20 4.5H19.5L12 9.5L22 3.5V6.5Z" fill="#C5221F"/>
    </svg>
  );

  const microsoftIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Email Integration</h3>
          <p className="text-xs text-muted mt-0.5">Connect your email to send messages directly from WorkChores</p>
        </div>
        {!isLive && (
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full border border-accent/20">
            Available with account
          </span>
        )}
      </div>

      <div className={`p-5 ${!isLive ? "opacity-50 pointer-events-none select-none" : ""}`}>
        {/* Gmail */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/30">
          <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">{gmailIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Gmail / Google Workspace</div>
            {isLive && gmailStatus.loading ? (
              <div className="flex items-center gap-1.5 mt-0.5"><Loader2 className="w-3 h-3 text-muted animate-spin" /><span className="text-xs text-muted">Checking connection...</span></div>
            ) : isLive && gmailStatus.connected ? (
              <div className="text-xs text-muted mt-0.5">Connected as <span className="font-medium text-emerald-600">{gmailStatus.email}</span></div>
            ) : (
              <div className="text-xs text-muted mt-0.5">Send emails from your Gmail account directly within WorkChores</div>
            )}
          </div>
          {isLive ? (
            gmailStatus.loading ? null : gmailStatus.connected ? (
              <button onClick={handleDisconnect} disabled={disconnecting} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                Disconnect
              </button>
            ) : (
              <a href="/api/auth/google/connect" className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
                <Link2 className="w-3.5 h-3.5" />
                Connect Gmail
              </a>
            )
          ) : (
            <span className="px-3 py-1.5 text-xs font-medium text-muted bg-gray-100 rounded-lg">Connect Gmail</span>
          )}
        </div>

        {/* Microsoft -- coming soon */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/30 mt-3 opacity-60">
          <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">{microsoftIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Microsoft Outlook / 365</div>
            <div className="text-xs text-muted mt-0.5">Coming soon</div>
          </div>
          <span className="px-3 py-1.5 text-xs font-medium text-muted bg-gray-100 rounded-lg">Coming Soon</span>
        </div>
      </div>

      {!isLive && (
        <div className="px-5 py-3 border-t border-border bg-accent/5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              <a href="/signup" className="font-medium text-accent hover:underline">Create a free account</a> to connect your Gmail and send emails from WorkChores.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Signature Editor
// =============================================
function SignatureEditor({ signature, onSave, isLive }: { signature: string; onSave: (sig: string) => void; isLive: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(signature);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(signature); }, [signature]);

  function handleSave() {
    onSave(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const previewHtml = draft
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#3b82f6">$1</a>');

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Email Signature</h3>
          <p className="text-xs text-muted mt-0.5">Automatically appended to every email you send</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors">
            <Pencil className="w-3 h-3" />
            {draft ? "Edit" : "Create"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1.5">Signature Content</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder={"Best regards,\n**Your Name**\nYour Title | Company Name\n(555) 123-4567\n[company.com](https://company.com)"}
              className="w-full text-sm bg-white border border-border rounded-lg px-3 py-3 outline-none focus:ring-1 focus:ring-accent resize-y placeholder:text-muted font-mono"
            />
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-[10px] text-muted flex-1">
                Use **bold** for emphasis, [text](url) for links. Supports {"{{senderName}}"}.
              </p>
            </div>
          </div>

          {draft.trim() && (
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">Preview</label>
              <div className="bg-gray-50 border border-border rounded-lg p-4">
                <div className="border-t-2 border-gray-300 pt-3 mt-1">
                  <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors">
              <Check className="w-3.5 h-3.5" />
              Save Signature
            </button>
            <button onClick={() => { setEditing(false); setDraft(signature); }} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
            {draft.trim() && (
              <button onClick={() => { setDraft(""); }} className="px-4 py-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-auto">Clear</button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          {draft.trim() ? (
            <div className="bg-gray-50 border border-border rounded-lg p-4">
              <div className="border-t-2 border-gray-300 pt-3 mt-1">
                <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted">No signature configured yet.</p>
              <p className="text-xs text-muted mt-1">Add a professional signature that appears at the bottom of every email.</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              Signature saved!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
