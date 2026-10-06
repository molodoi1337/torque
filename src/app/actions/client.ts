"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, bookings, statusEvents, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { nowLocal } from "@/lib/time";
import { notifyTelegram } from "@/lib/telegram";

export async function cancelMyBooking(formData: FormData) {
  const session = await requireUser();
  const id = Number(formData.get("id"));
  const me = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!me) return;

  // Клиент может отменить только свою запись, которая ещё не началась
  const b = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.id, id),
      or(eq(bookings.userId, me.id), me.phone ? eq(bookings.phone, me.phone) : undefined),
    ),
  });
  if (!b || !["new", "confirmed"].includes(b.status) || b.startsAt <= nowLocal()) return;

  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, b.id));
  await db.insert(statusEvents).values({ bookingId: b.id, status: "cancelled", note: "Отменено клиентом" });
  await notifyTelegram(`❌ Клиент отменил запись #${b.code} (${b.startsAt.replace("T", " ")})`);
  revalidatePath("/account");
  revalidatePath("/admin", "layout");
}
