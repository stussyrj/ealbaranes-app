import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const newPassword = await hashPassword("demo123");
  await db.update(users).set({ password: newPassword }).where(eq(users.username, "DemoEmpresa"));
  console.log("Contraseña actualizada correctamente para DemoEmpresa");
  process.exit(0);
}

main().catch(console.error);
