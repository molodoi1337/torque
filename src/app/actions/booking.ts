"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, bookings, bookingServices, services, statusEvents, users } from "@/db";
import { CAR_CLASSES } from "@/db/enums";
import { getSession } from "@/lib/auth";
import { findFreeBay, getSlots } from "@/lib/availability";
import { BOOKING_DAYS_AHEAD, CAR_CLASS_INFO, COMPANY } from "@/lib/constants";
import { bookingCode, formatPhone, normalizePhone, priceFor, rub } from "@/lib/format";
import { addDays, formatDateTime, nowLocal, todayLocal } from "@/lib/time";
import { notifyTelegram } from "@/lib/telegram";

async function loadServices(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(services).where(and(inArray(services.id, ids), eq(services.active, true)));
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function getAvailableSlots(date: string, serviceIds: number[]) {
  if (!dateSchema.safeParse(date).success) return [];
  if (date < todayLocal() || date > addDays(todayLocal(), BOOKING_DAYS_AHEAD)) return [];
  const items = await loadServices(serviceIds);
  const duration = items.reduce((a, s) => a + s.durationMin, 0) || 30;
  return getSlots(date, duration);
}

const bookingSchema = z.object({
  serviceIds: z.array(z.number().int().positive()).min(1, "Выберите хотя бы одну услугу").max(10),
  carClass: z.enum(CAR_CLASSES),
  carMake: z.string().trim().min(1, "Укажите марку").max(40),
  carModel: z.string().trim().min(1, "Укажите модель").max(40),
  carYear: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1).optional().or(z.literal("").transform(() => undefined)),
  plate: z.string().trim().max(12).optional(),
  date: dateSchema,
  time: z.string().regex(/^\d{2}:\d{2}$/, "Выберите время"),
  name: z.string().trim().min(2, "Введите имя").max(60),
  phone: z.string().transform(normalizePhone).refine((p) => p.length === 11, "Введите телефон полностью"),
  email: z.email("Некорректный email").optional().or(z.literal("")),
  comment: z.string().trim().max(500).optional(),
  agree: z.literal(true, { error: "Нужно согласие на обработку данных" }),
});

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingResult = { ok: true; code: string } | { ok: false; error: string; fields?: Record<string, string> };

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Проверьте заполнение формы", fields };
  }
  const d = parsed.data;
  const startsAt = `${d.date}T${d.time}`;

  if (startsAt <= nowLocal() || d.date > addDays(todayLocal(), BOOKING_DAYS_AHEAD)) {
    return { ok: false, error: "Это время уже недоступно, выберите другое" };
  }

  // Цену и длительность считаем на сервере — клиенту не доверяем
  const items = await loadServices(d.serviceIds);
  if (items.length !== d.serviceIds.length) return { ok: false, error: "Часть услуг недоступна, обновите страницу" };
  const duration = items.reduce((a, s) => a + s.durationMin, 0);
  const prices = items.map((s) => priceFor(s.basePrice, d.carClass));
  const total = prices.reduce((a, p) => a + p, 0);

  const bayId = await findFreeBay(startsAt, duration);
  if (!bayId) return { ok: false, error: "Это время только что заняли. Выберите другое, пожалуйста" };

  const session = await getSession();
  let code = bookingCode();
  // Коллизия кода маловероятна, но проверим
  while ((await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.code, code))).length) code = bookingCode();

  const [b] = await db
    .insert(bookings)
    .values({
      code,
      userId: session?.userId ?? null,
      clientName: d.name,
      phone: d.phone,
      email: d.email || null,
      carMake: d.carMake,
      carModel: d.carModel,
      carYear: d.carYear ?? null,
      carClass: d.carClass,
      plate: d.plate?.toUpperCase() || null,
      startsAt,
      durationMin: duration,
      bayId,
      totalPrice: total,
      comment: d.comment || null,
    })
    .returning({ id: bookings.id });

  await db.insert(bookingServices).values(items.map((s, i) => ({ bookingId: b.id, serviceId: s.id, price: prices[i] })));
  await db.insert(statusEvents).values({ bookingId: b.id, status: "new" });

  // Если клиент вошёл, а телефона в профиле нет — сохраним
  if (session) {
    await db.update(users).set({ phone: d.phone }).where(and(eq(users.id, session.userId), isNull(users.phone)));
  }

  await notifyTelegram(
    [
      `🔧 <b>Новая запись #${code}</b>`,
      `📅 ${formatDateTime(startsAt)}`,
      `🚗 ${d.carMake} ${d.carModel} (${CAR_CLASS_INFO[d.carClass].label})`,
      `🧾 ${items.map((s) => s.name).join(", ")}`,
      `💰 ${rub(total)}`,
      `👤 ${d.name}, ${formatPhone(d.phone)}`,
      d.comment ? `💬 ${d.comment}` : "",
      `\n${COMPANY.name} · админка`,
    ].filter(Boolean).join("\n"),
  );

  revalidatePath("/admin", "layout");
  return { ok: true, code };
}
