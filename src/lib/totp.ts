import crypto from "crypto";

/**
 * Lightweight TOTP implementation — no external dependencies.
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 *
 * TOTP = HMAC-SHA1(secret, floor(time / 30))
 */

function base32Decode(encoded: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = encoded.replace(/[= ]/g, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateHOTP(secret: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter);
  const hmac = crypto.createHmac("sha1", secret).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

/**
 * Verify a TOTP code against a base32-encoded secret.
 * Allows 1-step drift (±30 seconds) for clock skew.
 */
export function verifyTotp(base32Secret: string, code: string): boolean {
  const secret = base32Decode(base32Secret);
  const now = Math.floor(Date.now() / 1000);
  const step = 30;

  // Check current window and ±1 for clock drift
  for (let drift = -1; drift <= 1; drift++) {
    const counter = BigInt(Math.floor((now + drift * step) / step));
    if (generateHOTP(secret, counter) === code.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a new TOTP secret for setup.
 * Returns base32-encoded secret and an otpauth:// URI for QR code generation.
 */
export function generateTotpSecret(): { secret: string; uri: string } {
  const bytes = crypto.randomBytes(20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  let bits = "";
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, "0");
  }
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += alphabet[parseInt(bits.substring(i, i + 5), 2)];
  }

  const uri = `otpauth://totp/WorkChores:admin?secret=${secret}&issuer=WorkChores&digits=6&period=30`;
  return { secret, uri };
}
