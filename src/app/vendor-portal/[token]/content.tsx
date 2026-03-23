"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, FileText, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  tokenId: string;
  vendorName: string;
  workspaceName: string;
  requestedDocs: string[];
}

interface DocStatus {
  uploading: boolean;
  uploaded: boolean;
  fileName?: string;
  error?: string;
}

export default function VendorPortalContent({ tokenId, vendorName, workspaceName, requestedDocs }: Props) {
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(
    Object.fromEntries(requestedDocs.map((d) => [d, { uploading: false, uploaded: false }]))
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allUploaded = requestedDocs.every((d) => docStatuses[d]?.uploaded);

  async function handleUpload(docType: string, file: File) {
    setDocStatuses((prev) => ({ ...prev, [docType]: { uploading: true, uploaded: false } }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", tokenId);
      formData.append("docType", docType);

      const res = await fetch("/api/vendor-portal/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setDocStatuses((prev) => ({
          ...prev,
          [docType]: { uploading: false, uploaded: false, error: data.error || "Upload failed" },
        }));
        return;
      }

      setDocStatuses((prev) => ({
        ...prev,
        [docType]: { uploading: false, uploaded: true, fileName: file.name },
      }));
    } catch {
      setDocStatuses((prev) => ({
        ...prev,
        [docType]: { uploading: false, uploaded: false, error: "Upload failed. Please try again." },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="font-semibold text-lg text-foreground">WorkChores</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {allUploaded ? (
          /* Success state */
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">All documents uploaded</h1>
            <p className="text-muted leading-relaxed">
              Thank you! <strong>{workspaceName}</strong> has been notified and will review your documents.
              You can close this page.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Document Upload</h1>
              <p className="text-muted leading-relaxed">
                <strong>{workspaceName}</strong> is requesting the following documents from{" "}
                <strong>{vendorName}</strong>. Upload each document below — no account needed.
              </p>
            </div>

            <div className="space-y-4">
              {requestedDocs.map((docType) => {
                const status = docStatuses[docType] || { uploading: false, uploaded: false };

                return (
                  <div
                    key={docType}
                    className={`p-5 rounded-xl border bg-white transition-colors ${
                      status.uploaded
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          status.uploaded ? "bg-emerald-100 text-emerald-600" : "bg-accent-light text-accent"
                        }`}>
                          {status.uploaded ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{docType}</div>
                          {status.uploaded && status.fileName && (
                            <div className="text-xs text-emerald-600 mt-0.5 truncate">{status.fileName}</div>
                          )}
                          {status.error && (
                            <div className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {status.error}
                            </div>
                          )}
                        </div>
                      </div>

                      {status.uploaded ? (
                        <span className="text-xs font-medium text-emerald-600 shrink-0">Uploaded</span>
                      ) : (
                        <>
                          <input
                            ref={(el) => { fileInputRefs.current[docType] = el; }}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(docType, file);
                              e.target.value = "";
                            }}
                          />
                          <button
                            onClick={() => fileInputRefs.current[docType]?.click()}
                            disabled={status.uploading}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 shrink-0"
                          >
                            {status.uploading ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                            ) : (
                              <><Upload className="w-3 h-3" /> Upload</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted mt-6">
              Accepted formats: PDF, Word, Excel, images. Max 10MB per file.
            </p>
          </>
        )}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-2xl mx-auto px-6 py-4 text-center text-xs text-muted">
          Powered by WorkChores
        </div>
      </footer>
    </div>
  );
}
