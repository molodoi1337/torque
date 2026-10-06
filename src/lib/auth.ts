import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, encrypt, SESSION_COOKIE, SESSION_MAX_AGE, type Session } from "./auth-edge";

export type { Session };

export async function createSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await encrypt(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return decrypt((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "admin") redirect("/account");
  return s;
}
