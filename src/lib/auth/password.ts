import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, COST);
}

export async function verifyPassword(candidate: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(candidate, passwordHash);
}
