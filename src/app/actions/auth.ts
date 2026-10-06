"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users } from "@/db";
import { createSession, deleteSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const DEMO = { admin: "admin@tork.demo", client: "client@tork.demo" } as const;

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  // Только внутренние пути, чтобы не было открытого редиректа
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }
  await createSession({ userId: user.id, name: user.name, role: user.role });
  redirect(safeNext(formData.get("next"), user.role === "admin" ? "/admin" : "/account"));
}

/** Вход в демо-аккаунт одной кнопкой — для проверяющих портфолио */
export async function demoLogin(formData: FormData) {
  const role = formData.get("role") === "admin" ? "admin" : "client";
  const user = await db.query.users.findFirst({ where: eq(users.email, DEMO[role]) });
  if (!user) redirect("/login");
  await createSession({ userId: user.id, name: user.name, role: user.role });
  redirect(role === "admin" ? "/admin" : "/account");
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(60),
  email: z.email("Некорректный email").transform((e) => e.toLowerCase()),
  phone: z.string().transform(normalizePhone).refine((p) => p.length === 11, "Введите телефон полностью"),
  password: z.string().min(8, "Минимум 8 символов").max(72),
});

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { fields };
  }
  const { name, email, phone, password } = parsed.data;
  const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (exists) return { fields: { email: "Этот email уже зарегистрирован" } };

  const [user] = await db
    .insert(users)
    .values({ name, email, phone, passwordHash: await bcrypt.hash(password, 10) })
    .returning();
  await createSession({ userId: user.id, name: user.name, role: user.role });
  redirect("/account");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
