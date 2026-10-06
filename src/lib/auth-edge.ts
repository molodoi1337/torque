// Подпись и проверка токена сессии. Без next/headers — используется и в proxy.ts.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/db/enums";

export const SESSION_COOKIE = "tork_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type Session = { userId: number; name: string; role: Role };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET не задан");
  return new TextEncoder().encode(s ?? "dev-secret-change-me-dev-secret-change-me");
}

export async function encrypt(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function decrypt(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { userId: payload.userId as number, name: payload.name as string, role: payload.role as Role };
  } catch {
    return null;
  }
}
