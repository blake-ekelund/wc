import { describe, it, expect } from "vitest";
import { validateUploadedFile, getSafeMimeType } from "@/lib/validate-file";

// Helper to create a buffer from magic bytes
function magicBuffer(bytes: number[], pad: number = 32): Buffer {
  const buf = Buffer.alloc(pad);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes[i];
  return buf;
}

describe("validateUploadedFile", () => {
  describe("magic byte detection", () => {
    it("detects JPEG files", () => {
      const buf = magicBuffer([0xFF, 0xD8, 0xFF]);
      const result = validateUploadedFile(buf, "photo.jpg", "image/jpeg");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/jpeg");
    });

    it("detects PNG files", () => {
      const buf = magicBuffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = validateUploadedFile(buf, "image.png", "image/png");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/png");
    });

    it("detects GIF files", () => {
      const buf = magicBuffer([0x47, 0x49, 0x46, 0x38]);
      const result = validateUploadedFile(buf, "animation.gif", "image/gif");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/gif");
    });

    it("detects PDF files", () => {
      const buf = magicBuffer([0x25, 0x50, 0x44, 0x46]);
      const result = validateUploadedFile(buf, "document.pdf", "application/pdf");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("application/pdf");
    });

    it("detects ZIP-based Office files by extension", () => {
      const pkBuf = magicBuffer([0x50, 0x4B, 0x03, 0x04]);

      const docx = validateUploadedFile(pkBuf, "report.docx", "application/octet-stream");
      expect(docx.valid).toBe(true);
      expect(docx.detectedMime).toContain("wordprocessingml");

      const xlsx = validateUploadedFile(pkBuf, "data.xlsx", "application/octet-stream");
      expect(xlsx.valid).toBe(true);
      expect(xlsx.detectedMime).toContain("spreadsheetml");

      const pptx = validateUploadedFile(pkBuf, "slides.pptx", "application/octet-stream");
      expect(pptx.valid).toBe(true);
      expect(pptx.detectedMime).toContain("presentationml");
    });

    it("detects plain ZIP when extension is .zip", () => {
      const pkBuf = magicBuffer([0x50, 0x4B, 0x03, 0x04]);
      const result = validateUploadedFile(pkBuf, "archive.zip", "application/zip");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("application/zip");
    });
  });

  describe("blocked extensions", () => {
    it("blocks .exe files", () => {
      const buf = magicBuffer([0x4D, 0x5A]); // MZ header
      const result = validateUploadedFile(buf, "virus.exe", "application/octet-stream");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(".exe");
    });

    it("blocks .bat files", () => {
      const result = validateUploadedFile(Buffer.from("echo hi"), "script.bat", "text/plain");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(".bat");
    });

    it("blocks .js files", () => {
      const result = validateUploadedFile(Buffer.from("alert(1)"), "payload.js", "text/javascript");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(".js");
    });

    it("blocks .php files", () => {
      const result = validateUploadedFile(Buffer.from("<?php"), "shell.php", "text/x-php");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(".php");
    });

    it("blocks .sh files", () => {
      const result = validateUploadedFile(Buffer.from("#!/bin/bash"), "hack.sh", "text/x-shellscript");
      expect(result.valid).toBe(false);
      expect(result.error).toContain(".sh");
    });
  });

  describe("MIME allowlist", () => {
    it("rejects unknown MIME types", () => {
      const result = validateUploadedFile(Buffer.alloc(32), "file.xyz", "application/x-custom");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("accepts text files by extension", () => {
      const result = validateUploadedFile(Buffer.from("hello world"), "notes.txt", "text/plain");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("text/plain");
    });

    it("accepts CSV files by extension", () => {
      const result = validateUploadedFile(Buffer.from("a,b,c\n1,2,3"), "data.csv", "text/csv");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("text/csv");
    });

    it("accepts JSON files by extension", () => {
      const result = validateUploadedFile(Buffer.from('{"key":"value"}'), "config.json", "application/json");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("application/json");
    });
  });

  describe("edge cases", () => {
    it("handles empty buffer with safe extension", () => {
      const result = validateUploadedFile(Buffer.alloc(0), "empty.txt", "text/plain");
      expect(result.valid).toBe(true);
    });

    it("handles file with no extension", () => {
      const result = validateUploadedFile(magicBuffer([0xFF, 0xD8, 0xFF]), "noext", "image/jpeg");
      expect(result.valid).toBe(true);
    });
  });
});

describe("getSafeMimeType", () => {
  it("returns detected MIME for valid files", () => {
    const buf = magicBuffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    expect(getSafeMimeType(buf, "image.png", "image/png")).toBe("image/png");
  });

  it("returns application/octet-stream for blocked files", () => {
    expect(getSafeMimeType(Buffer.from("echo hi"), "script.bat", "text/plain")).toBe("application/octet-stream");
  });

  it("returns application/octet-stream for unknown types", () => {
    expect(getSafeMimeType(Buffer.alloc(16), "file.xyz", "application/x-unknown")).toBe("application/octet-stream");
  });
});
