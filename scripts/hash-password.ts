import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log("Hashed password (put this in .env as ADMIN_PASSWORD):");
console.log(hash);
