import { Argon2id } from "oslo/password";

const argon2id = new Argon2id();

/**
 * 对密码进行哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2id.hash(password);
}

/**
 * 验证密码
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await argon2id.verify(hash, password);
}
