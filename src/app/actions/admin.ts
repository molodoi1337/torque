"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, bookings, masters, services, statusEvents } from "@/db";
import { CATEGORIES, STATUSES, type Status } from "@/db/enums";
import { requireAdmin } from "@/lib/auth";
import { findFreeBay } from "@/lib/availability";

const refresh = () => revalidatePath("/admin", "layout");

export async function setStatus(bookingId: number, status: Status, note?: string) {
  await requireAdmin();
  if (!STATUSES.includes(status)) return { ok: false };
  const b = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!b || b.status === status) return { ok: true };
  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
  await db.insert(statusEvents).values({ bookingId, status, note: note || null });
  refresh();
  return { ok: true };
}

export async function updateBooking(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const masterId = Number(formData.get("masterId")) || null;
  const bayId = Number(formData.get("bayId"));
  const adminNote = String(formData.get("adminNote") ?? "").slice(0, 1000) || null;
  const status = formData.get("status") as Status;

  const b = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });
  if (!b) return;

  const patch: Partial<typeof bookings.$inferInsert> = { masterId, adminNote };
  // Смена поста — только если он свободен в это время
  if (bayId && bayId !== b.bayId) {
    const free = await findFreeBay(b.startsAt, b.durationMin, b.id, bayId);
    if (free) patch.bayId = free;
  }
  await db.update(bookings).set(patch).where(eq(bookings.id, id));
  if (STATUSES.includes(status) && status !== b.status) {
    await db.update(bookings).set({ status }).where(eq(bookings.id, id));
    await db.insert(statusEvents).values({ bookingId: id, status });
  }
  refresh();
}

const serviceSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(3).max(80),
  category: z.enum(CATEGORIES),
  description: z.string().trim().max(300).default(""),
  basePrice: z.coerce.number().int().min(0).max(1_000_000),
  durationMin: z.coerce.number().int().min(15).max(720),
  popular: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(false),
});

export async function saveService(_: unknown, formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData);
  const parsed = serviceSchema.safeParse({ ...raw, id: raw.id || undefined, popular: raw.popular === "on", active: raw.active === "on" });
  if (!parsed.success) return { error: "Проверьте поля: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
  const { id, ...data } = parsed.data;
  if (id) await db.update(services).set(data).where(eq(services.id, id));
  else await db.insert(services).values(data);
  refresh();
  revalidatePath("/services");
  return { ok: true };
}

export async function toggleService(id: number, active: boolean) {
  await requireAdmin();
  await db.update(services).set({ active }).where(eq(services.id, id));
  refresh();
}

export async function toggleMaster(id: number, active: boolean) {
  await requireAdmin();
  await db.update(masters).set({ active }).where(eq(masters.id, id));
  refresh();
}
