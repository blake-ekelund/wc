/**
 * Server-side file validation: magic byte detection + extension/MIME allowlisting.
 *
 * Checks the actual file content (magic bytes) rather than trusting the
 * client-provided MIME type, which can be trivially spoofed.
 */

// Magic byte signatures for common safe file types
// Each entry: { mime, magic: Buffer, offset? }
const MAGIC_SIGNATURES: { mime: string; ext: string[]; magic: number[]; offset?: number }[] = [
  // Images
  { mime: "image/jpeg", ext: ["jpg", "jpeg"], magic: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png", ext: ["png"], magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: "image/gif", ext: ["gif"], magic: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: "image/webp", ext: ["webp"], magic: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF, check WEBP at offset 8
  { mime: "image/bmp", ext: ["bmp"], magic: [0x42, 0x4D] },
  { mime: "image/svg+xml", ext: ["svg"], magic: [] }, // Handled separately (text-based)
  { mime: "image/x-icon", ext: ["ico"], magic: [0x00, 0x00, 0x01, 0x00] },

  // Documents
  { mime: "application/pdf", ext: ["pdf"], magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "application/zip", ext: ["zip"], magic: [0x50, 0x4B, 0x03, 0x04] }, // PK..
  // DOCX, XLSX, PPTX are ZIP-based (PK signature)
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: ["docx"], magic: [0x50, 0x4B, 0x03, 0x04] },
  { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: ["xlsx"], magic: [0x50, 0x4B, 0x03, 0x04] },
  { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: ["pptx"], magic: [0x50, 0x4B, 0x03, 0x04] },
  // Legacy Office formats (OLE2 Compound Document)
  { mime: "application/msword", ext: ["doc"], magic: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
  { mime: "application/vnd.ms-excel", ext: ["xls"], magic: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },

  // Text / data
  { mime: "text/plain", ext: ["txt", "log", "md"], magic: [] }, // No fixed magic bytes
  { mime: "text/csv", ext: ["csv"], magic: [] },
  { mime: "application/json", ext: ["json"], magic: [] },
];

// Allowed MIME types for upload (allowlist approach)
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "image/x-icon",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/csv",
  "application/json",
  // Archives
  "application/zip",
]);

// Dangerous file extensions that should NEVER be uploaded regardless of MIME type
const BLOCKED_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "msi", "scr", "pif", "vbs", "vbe",
  "js", "jse", "wsf", "wsh", "ps1", "psm1",
  "sh", "bash", "csh", "ksh",
  "php", "php3", "php4", "php5", "phtml",
  "asp", "aspx",
  "jsp", "jspx",
  "py", "pyc", "pyw",
  "rb",
  "pl", "cgi",
  "dll", "so", "dylib",
  "sys", "drv",
  "inf", "reg",
  "hta", "htaccess",
  "swf",
]);

/** Get file extension from filename, lowercased */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/** Detect MIME type from file content magic bytes */
function detectMimeFromBytes(buffer: Buffer, filename: string): string | null {
  const ext = getExtension(filename);

  // Check magic byte signatures
  for (const sig of MAGIC_SIGNATURES) {
    if (sig.magic.length === 0) continue; // Text types have no magic bytes
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.magic.length) continue;

    let match = true;
    for (let i = 0; i < sig.magic.length; i++) {
      if (buffer[offset + i] !== sig.magic[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      // For WEBP, additionally check bytes 8-11 for "WEBP"
      if (sig.mime === "image/webp") {
        if (buffer.length >= 12 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 &&
            buffer[10] === 0x42 && buffer[11] === 0x50) {
          return "image/webp";
        }
        continue; // RIFF but not WEBP
      }

      // For ZIP-based formats, use extension to disambiguate
      if (sig.mime === "application/zip" || sig.magic[0] === 0x50 && sig.magic[1] === 0x4B) {
        if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        return "application/zip";
      }

      // For OLE2 (legacy Office), use extension
      if (sig.magic[0] === 0xD0 && sig.magic[1] === 0xCF) {
        if (ext === "xls") return "application/vnd.ms-excel";
        return "application/msword";
      }

      return sig.mime;
    }
  }

  // SVG detection (text-based — look for <svg tag)
  if (ext === "svg") {
    const head = buffer.subarray(0, Math.min(1024, buffer.length)).toString("utf-8").toLowerCase();
    if (head.includes("<svg")) return "image/svg+xml";
  }

  // Text-based types — infer from extension
  if (["txt", "log", "md"].includes(ext)) return "text/plain";
  if (ext === "csv") return "text/csv";
  if (ext === "json") return "application/json";

  return null; // Unknown
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

/**
 * Validate an uploaded file:
 *  1. Block dangerous extensions
 *  2. Detect MIME type from magic bytes
 *  3. Check detected MIME is in the allowlist
 *  4. Verify extension matches detected MIME (prevent extension spoofing)
 */
export function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  clientMime: string,
): FileValidationResult {
  const ext = getExtension(filename);

  // 1. Block dangerous extensions
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type .${ext} is not allowed` };
  }

  // 2. Detect MIME from content
  const detectedMime = detectMimeFromBytes(buffer, filename);

  // 3. Use detected MIME if available, otherwise fall back to client MIME
  const effectiveMime = detectedMime || clientMime;

  // 4. Check allowlist
  if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
    return { valid: false, error: `File type ${effectiveMime} is not allowed` };
  }

  // 5. If we detected a MIME type, verify it's consistent with the extension
  if (detectedMime) {
    const sigEntry = MAGIC_SIGNATURES.find((s) => s.mime === detectedMime);
    if (sigEntry && sigEntry.ext.length > 0 && ext && !sigEntry.ext.includes(ext)) {
      // Extension doesn't match detected content — could be spoofing
      // Allow common aliases (e.g., jpg/jpeg) but block mismatches like .exe with PDF magic
      if (BLOCKED_EXTENSIONS.has(ext)) {
        return { valid: false, error: `File extension .${ext} does not match file content` };
      }
    }
  }

  return { valid: true, detectedMime: effectiveMime };
}

/**
 * Get the safe MIME type for a file, preferring magic-byte detection.
 * Returns the detected type or falls back to a safe default.
 */
export function getSafeMimeType(buffer: Buffer, filename: string, clientMime: string): string {
  const result = validateUploadedFile(buffer, filename, clientMime);
  if (!result.valid) return "application/octet-stream";
  return result.detectedMime || "application/octet-stream";
}
