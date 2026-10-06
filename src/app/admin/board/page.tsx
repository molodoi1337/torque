import { and, gte, inArray, or, eq } from "drizzle-orm";
import { db, bookings } from "@/db";
import { addDays, nowLocal } from "@/lib/time";
import { Board, type Card } from "./board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Доска заказов" };

export default async function BoardPage() {
  const today = nowLocal().slice(0, 10);
  const rows = await db.query.bookings.findMany({
    where: or(
      inArray(bookings.status, ["new", "confirmed", "in_progress", "ready"]),
      // Выданные — только за сегодня, чтобы колонка не разрасталась
      and(eq(bookings.status, "done"), gte(bookings.startsAt, today)),
    ),
    with: { items: { with: { service: true } }, master: true },
    orderBy: bookings.startsAt,
  });

  const horizon = addDays(today, 7);
  const cards: Card[] = rows
    .filter((b) => b.startsAt < horizon)
    .map((b) => ({
      id: b.id,
      code: b.code,
      status: b.status,
      startsAt: b.startsAt,
      car: `${b.carMake} ${b.carModel}`,
      plate: b.plate,
      client: b.clientName,
      services: b.items.map((i) => i.service.name),
      master: b.master?.name ?? null,
      total: b.totalPrice,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Доска заказов</h1>
        <p className="mt-1 text-sm text-ink-400">Перетаскивайте карточки между колонками — клиент сразу увидит новый статус. Показаны заказы на ближайшие 7 дней.</p>
      </div>
      <Board initial={cards} />
    </div>
  );
}
