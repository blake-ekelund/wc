"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, Upload, X, FileText, Image, File, Download, Trash2, Loader2, Plus } from "lucide-react";

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_by_name: string;
  created_at: string;
  url?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
  return File;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface AttachmentsPanelProps {
  attachments: Attachment[];
  isLive: boolean;
  workspaceId?: string;
  contactId?: string;
  taskId?: string;
  touchpointId?: string;
  vendorId?: string;
  uploaderName?: string;
  onAttachmentAdded?: (attachment: Attachment) => void;
  onAttachmentRemoved?: (id: string) => void;
}

export default function AttachmentsPanel({
  attachments,
  isLive,
  workspaceId,
  contactId,
  taskId,
  touchpointId,
  vendorId,
  uploaderName = "",
  onAttachmentAdded,
  onAttachmentRemoved,
}: AttachmentsPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo mode: local file list only (no upload)
  const [demoFiles, setDemoFiles] = useState<Attachment[]>([]);
  const displayFiles = isLive ? attachments : demoFiles;

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setError("");

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      if (isLive && workspaceId) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("workspaceId", workspaceId);
          if (contactId) formData.append("contactId", contactId);
          if (taskId) formData.append("taskId", taskId);
          if (touchpointId) formData.append("touchpointId", touchpointId);
          if (vendorId) formData.append("vendorId", vendorId);
          formData.append("uploaderName", uploaderName);

          const res = await fetch("/api/attachments", { method: "POST", body: formData });
          const data = await res.json();

          if (res.ok && data.attachment) {
            onAttachmentAdded?.(data.attachment);
          } else {
            setError(data.error || "Upload failed");
          }
        } catch {
          setError("Upload failed. Please try again.");
        }
        setUploading(false);
      } else {
        // Demo mode — add locally
        const demoAtt: Attachment = {
          id: crypto.randomUUID(),
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: "",
          uploaded_by_name: "You",
          created_at: new Date().toISOString(),
          url: URL.createObjectURL(file),
        };
        setDemoFiles((prev) => [demoAtt, ...prev]);
        onAttachmentAdded?.(demoAtt);
      }
    }
  }, [isLive, workspaceId, contactId, taskId, touchpointId, uploaderName, onAttachmentAdded]);

  async function handleDelete(id: string) {
    if (isLive) {
      try {
        await fetch(`/api/attachments?id=${id}`, { method: "DELETE" });
        onAttachmentRemoved?.(id);
      } catch {
        setError("Failed to delete file");
      }
    } else {
      setDemoFiles((prev) => prev.filter((f) => f.id !== id));
      onAttachmentRemoved?.(id);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  return (
    <div>
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ""; }}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-accent" />
            <span className="text-sm text-muted">Uploading...</span>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add files</span>
            <span className="text-xs text-muted">or drag & drop</span>
          </button>
        )}
        <p className="text-[10px] text-muted mt-1">Max 10MB per file · PDF, DOC, XLS, images, etc.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
          <X className="w-3 h-3 shrink-0" />
          {error}
        </div>
      )}

      {/* File list */}
      {displayFiles.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {displayFiles.map((file) => {
            const FileIcon = getFileIcon(file.file_type);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-lg group hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                  <FileIcon className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{file.file_name}</div>
                  <div className="text-[10px] text-muted">
                    {formatFileSize(file.file_size)}
                    {file.uploaded_by_name && ` · ${file.uploaded_by_name}`}
                    {file.created_at && ` · ${formatDate(file.created_at)}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.url && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(file.url!);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = file.file_name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } catch {
                          // Fallback: open in new tab
                          window.open(file.url!, "_blank");
                        }
                      }}
                      className="p-1.5 text-muted hover:text-accent transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-muted hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact version — just a paperclip button + count badge for inline use
export function AttachmentButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
      title="Attachments"
    >
      <Paperclip className="w-3.5 h-3.5" />
      {count > 0 && <span className="text-[10px] font-medium">{count}</span>}
    </button>
  );
}
