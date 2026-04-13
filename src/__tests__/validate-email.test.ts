import { describe, it, expect } from "vitest";
import { isValidEmail, isValidEmailList, normalizeEmail } from "@/lib/validate-email";

describe("isValidEmail", () => {
  it("accepts standard email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("first.last@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@gmail.com")).toBe(true);
    expect(isValidEmail("name123@sub.domain.org")).toBe(true);
  });

  it("accepts emails with valid special characters", () => {
    expect(isValidEmail("user%name@example.com")).toBe(true);
    expect(isValidEmail("user-name@example.com")).toBe(true);
    expect(isValidEmail("user_name@example.com")).toBe(true);
  });

  it("rejects emails without @ symbol", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
    expect(isValidEmail("just-a-string")).toBe(false);
  });

  it("rejects emails without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@.com")).toBe(false);
  });

  it("rejects emails with consecutive dots", () => {
    expect(isValidEmail("user..name@example.com")).toBe(false);
  });

  it("rejects XSS/injection attempts", () => {
    expect(isValidEmail("<script>@x.com")).toBe(false);
    expect(isValidEmail("user@<script>.com")).toBe(false);
    expect(isValidEmail("'; DROP TABLE users;--@example.com")).toBe(false);
  });

  it("rejects emails exceeding 254 characters", () => {
    const longLocal = "a".repeat(200);
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail({})).toBe(false);
    expect(isValidEmail(true)).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects emails without a valid TLD", () => {
    expect(isValidEmail("user@domain")).toBe(false);
    expect(isValidEmail("user@domain.x")).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });
});

describe("isValidEmailList", () => {
  it("accepts a single email", () => {
    expect(isValidEmailList("user@example.com")).toBe(true);
  });

  it("accepts comma-separated emails", () => {
    expect(isValidEmailList("a@b.com, c@d.com, e@f.com")).toBe(true);
  });

  it("accepts Display Name <email> format", () => {
    expect(isValidEmailList("John Doe <john@example.com>")).toBe(true);
    expect(isValidEmailList("Alice <a@b.com>, Bob <b@c.com>")).toBe(true);
  });

  it("rejects if any email is invalid", () => {
    expect(isValidEmailList("valid@example.com, not-an-email")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isValidEmailList(null)).toBe(false);
    expect(isValidEmailList(42)).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidEmailList("")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims valid emails", () => {
    expect(normalizeEmail("  User@EXAMPLE.COM  ")).toBe("user@example.com");
  });

  it("returns null for invalid emails", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });
});
