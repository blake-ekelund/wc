"use client";

import { useState } from "react";
import { Plus, Megaphone, EyeOff, Eye, Trash2 } from "lucide-react";
import { adminFetch, formatDate, type Announcement } from "./_shared";

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onReload: () => void;
}

export default function AnnouncementsSection({ announcements, onReload }: AnnouncementsSectionProps) {
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", type: "info" as Announcement["type"] });

  async function createAnnouncement() {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    try {
      await adminFetch("create-announcement", announcementForm);
      setAnnouncementForm({ title: "", message: "", type: "info" });
      setShowAnnouncementForm(false);
      onReload();
    } catch { /* handled */ }
  }

  async function deleteAnnouncement(id: string) {
    try {
      await adminFetch("delete-announcement", { id });
      onReload();
    } catch { /* handled */ }
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    try {
      await adminFetch("toggle-announcement", { id, active });
      onReload();
    } catch { /* handled */ }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Announcements & Notifications</h2>
        <button
          onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Announcement
        </button>
      </div>

      {showAnnouncementForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
            <input
              type="text"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              placeholder="Announcement title..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Message</label>
            <textarea
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
              placeholder="Announcement message..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-800 placeholder:text-gray-400 resize-none min-h-[80px]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <div className="flex gap-2">
              {(["info", "warning", "success", "update"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAnnouncementForm({ ...announcementForm, type: t })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    announcementForm.type === t
                      ? t === "info" ? "bg-blue-100 text-blue-700"
                        : t === "warning" ? "bg-amber-100 text-amber-700"
                        : t === "success" ? "bg-emerald-100 text-emerald-700"
                        : "bg-violet-100 text-violet-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createAnnouncement} className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
              Publish
            </button>
            <button onClick={() => setShowAnnouncementForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing announcements */}
      <div className="space-y-3">
        {announcements.length === 0 && !showAnnouncementForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No announcements yet</p>
            <p className="text-xs text-gray-400 mt-1">Create one to notify all users</p>
          </div>
        )}
        {announcements.map((a) => {
          const typeColors = {
            info: "border-l-blue-500 bg-blue-50/30",
            warning: "border-l-amber-500 bg-amber-50/30",
            success: "border-l-emerald-500 bg-emerald-50/30",
            update: "border-l-violet-500 bg-violet-50/30",
          };
          return (
            <div key={a.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${typeColors[a.type]} overflow-hidden`}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                        a.type === "info" ? "bg-blue-100 text-blue-600"
                          : a.type === "warning" ? "bg-amber-100 text-amber-600"
                          : a.type === "success" ? "bg-emerald-100 text-emerald-600"
                          : "bg-violet-100 text-violet-600"
                      }`}>
                        {a.type}
                      </span>
                      {!a.active && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-400">INACTIVE</span>}
                    </div>
                    <p className="text-sm text-gray-600">{a.message}</p>
                    <div className="text-[10px] text-gray-400 mt-2">{formatDate(a.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleAnnouncement(a.id, !a.active)} className={`p-1.5 rounded-lg text-xs transition-colors ${a.active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`} title={a.active ? "Deactivate" : "Activate"}>
                      {a.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
