import "server-only";
import { and, gte, lt, ne } from "drizzle-orm";
import { db, bays, bookings } from "@/db";
import { CLOSE_HOUR, OPEN_HOUR, SLOT_STEP_MIN } from "./constants";
import { addDays, fromMinutes, nowLocal, toMinutes } from "./time";

type Busy = { bayId: number; start: number; end: number };

async function busyForDate(date: string): Promise<Busy[]> {
  const rows = await db
    .select({ bayId: bookings.bayId, startsAt: bookings.startsAt, durationMin: bookings.durationMin })
    .from(bookings)
    .where(and(gte(bookings.startsAt, date), lt(bookings.startsAt, addDays(date, 1)), ne(bookings.status, "cancelled")));
  return rows.map((r) => {
    const start = toMinutes(r.startsAt.slice(11, 16));
    return { bayId: r.bayId, start, end: start + r.durationMin };
  });
}

/** Работы длиннее рабочего дня занимают пост на весь день (машина остаётся на ночь) */
function maxFitDuration(duration: number) {
  return Math.min(duration, (CLOSE_HOUR - OPEN_HOUR) * 60);
}

export type Slot = { time: string; free: boolean; bays: number };

export async function getSlots(date: string, durationMin: number): Promise<Slot[]> {
  const [allBays, busy] = await Promise.all([db.select({ id: bays.id }).from(bays), busyForDate(date)]);
  const duration = maxFitDuration(durationMin);
  const now = nowLocal();
  const isToday = now.slice(0, 10) === date;
  const nowMin = toMinutes(now.slice(11, 16));
  const slots: Slot[] = [];

  for (let t = OPEN_HOUR * 60; t + duration <= CLOSE_HOUR * 60; t += SLOT_STEP_MIN) {
    // Сегодня — не раньше чем через час от текущего времени
    if (isToday && t < nowMin + 60) {
      slots.push({ time: fromMinutes(t), free: false, bays: 0 });
      continue;
    }
    const freeBays = allBays.filter(
      (b) => !busy.some((x) => x.bayId === b.id && x.start < t + duration && t < x.end),
    ).length;
    slots.push({ time: fromMinutes(t), free: freeBays > 0, bays: freeBays });
  }
  return slots;
}

/** Подбирает свободный пост на указанное время или возвращает null */
export async function findFreeBay(startsAt: string, durationMin: number, excludeBookingId?: number, onlyBayId?: number) {
  const date = startsAt.slice(0, 10);
  const duration = maxFitDuration(durationMin);
  const start = toMinutes(startsAt.slice(11, 16));
  if (start < OPEN_HOUR * 60 || start + duration > CLOSE_HOUR * 60) return null;

  const [allBays, rows] = await Promise.all([
    db.select({ id: bays.id }).from(bays).orderBy(bays.id),
    db
      .select({ id: bookings.id, bayId: bookings.bayId, startsAt: bookings.startsAt, durationMin: bookings.durationMin })
      .from(bookings)
      .where(and(gte(bookings.startsAt, date), lt(bookings.startsAt, addDays(date, 1)), ne(bookings.status, "cancelled"))),
  ]);
  const busy = rows
    .filter((r) => r.id !== excludeBookingId)
    .map((r) => {
      const s = toMinutes(r.startsAt.slice(11, 16));
      return { bayId: r.bayId, start: s, end: s + r.durationMin };
    });
  const bay = allBays.find((b) => (!onlyBayId || b.id === onlyBayId) && !busy.some((x) => x.bayId === b.id && x.start < start + duration && start < x.end));
  return bay?.id ?? null;
}
