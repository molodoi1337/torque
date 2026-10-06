import Link from "next/link";
import { and, count, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { ArrowRight, Banknote, CalendarClock, Gauge, Inbox, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { db, bays, bookingServices, bookings, services } from "@/db";
import { CLOSE_HOUR, OPEN_HOUR } from "@/lib/constants";
import { rub } from "@/lib/format";
import { addDays, addMinutes, capitalize, formatDate, nowLocal } from "@/lib/time";
import { StatusBadge } from "@/components/status-badge";
import { RevenueChart, TopServicesChart } from "./charts";

export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "Дашборд · Админка ТОРК" } };

export default async function Dashboard() {
  const now = nowLocal();
  const today = now.slice(0, 10);
  const from30 = addDays(today, -29);
  const prev30 = addDays(today, -59);
  const notCancelled = ne(bookings.status, "cancelled");

  const [todayList, [{ newCount }], [{ n: bayCount }], revenueRows, [cur], [prev], top] = await Promise.all([
    db.query.bookings.findMany({
      where: and(gte(bookings.startsAt, today), lt(bookings.startsAt, addDays(today, 1)), notCancelled),
      with: { items: { with: { service: true } }, bay: true, master: true },
      orderBy: bookings.startsAt,
    }),
    db.select({ newCount: count() }).from(bookings).where(eq(bookings.status, "new")),
    db.select({ n: count() }).from(bays),
    db
      .select({ day: sql<string>`substr(${bookings.startsAt}, 1, 10)`, revenue: sql<number>`sum(${bookings.totalPrice})` })
      .from(bookings)
      .where(and(eq(bookings.status, "done"), gte(bookings.startsAt, from30)))
      .groupBy(sql`1`),
    db
      .select({ revenue: sql<number>`coalesce(sum(${bookings.totalPrice}), 0)`, orders: count() })
      .from(bookings)
      .where(and(eq(bookings.status, "done"), gte(bookings.startsAt, from30), lt(bookings.startsAt, addDays(today, 1)))),
    db
      .select({ revenue: sql<number>`coalesce(sum(${bookings.totalPrice}), 0)`, orders: count() })
      .from(bookings)
      .where(and(eq(bookings.status, "done"), gte(bookings.startsAt, prev30), lt(bookings.startsAt, from30))),
    db
      .select({ name: services.name, count: count() })
      .from(bookingServices)
      .innerJoin(services, eq(services.id, bookingServices.serviceId))
      .innerJoin(bookings, eq(bookings.id, bookingServices.bookingId))
      .where(and(gte(bookings.startsAt, from30), notCancelled))
      .groupBy(services.id)
      .orderBy(desc(count()))
      .limit(7),
  ]);

  const byDay = new Map(revenueRows.map((r) => [r.day, r.revenue]));
  const chart = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(from30, i);
    return { day: formatDate(d, { day: "numeric", month: "short" }), revenue: byDay.get(d) ?? 0 };
  });

  const capacity = bayCount * (CLOSE_HOUR - OPEN_HOUR) * 60;
  const load = Math.min(100, Math.round((todayList.reduce((a, b) => a + b.durationMin, 0) / capacity) * 100));
  const avg = cur.orders ? Math.round(cur.revenue / cur.orders) : 0;
  const prevAvg = prev.orders ? Math.round(prev.revenue / prev.orders) : 0;
  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);

  const kpis = [
    { label: "Выручка за 30 дней", value: rub(cur.revenue), delta: delta(cur.revenue, prev.revenue), icon: Banknote },
    { label: "Средний чек", value: rub(avg), delta: delta(avg, prevAvg), icon: TrendingUp },
    { label: "Загрузка постов сегодня", value: `${load}%`, icon: Gauge, bar: load },
    { label: "Новые заявки", value: String(newCount), icon: Inbox, href: "/admin/bookings?status=new", hint: newCount ? "ждут подтверждения" : "всё обработано" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Дашборд</h1>
          <p className="mt-1 text-sm text-ink-400">{capitalize(formatDate(today, { weekday: "long", day: "numeric", month: "long" }))}</p>
        </div>
        <Link href="/admin/board" className="btn-primary">Доска заказов <ArrowRight className="size-4" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-sm text-ink-400">{k.label}<k.icon className="size-4 text-ink-500" /></div>
              <div className="mt-3 font-mono text-2xl font-bold text-white sm:text-3xl">{k.value}</div>
              {k.delta !== undefined && (
                <div className={clsx("mt-2 flex items-center gap-1 text-xs font-medium", k.delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {k.delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {k.delta > 0 && "+"}{k.delta}% к прошлым 30 дням
                </div>
              )}
              {k.bar !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${k.bar}%` }} /></div>
              )}
              {k.hint && <div className={clsx("mt-2 text-xs", newCount ? "text-sky-400" : "text-ink-500")}>{k.hint}</div>}
            </>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="card p-5 transition hover:ring-ink-600">{body}</Link>
          ) : (
            <div key={k.label} className="card p-5">{body}</div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <h2 className="font-semibold text-white">Выручка по дням</h2>
          <p className="text-xs text-ink-500">Закрытые заказы, последние 30 дней</p>
          <div className="mt-4"><RevenueChart data={chart} /></div>
        </section>
        <section className="card p-5">
          <h2 className="font-semibold text-white">Популярные услуги</h2>
          <p className="text-xs text-ink-500">Количество заказов за 30 дней</p>
          <div className="mt-4"><TopServicesChart data={top} /></div>
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between border-b border-ink-800 p-5">
          <div>
            <h2 className="font-semibold text-white">Сегодня в работе</h2>
            <p className="text-xs text-ink-500">{todayList.length} записей</p>
          </div>
          <Link href="/admin/schedule" className="btn-ghost btn-sm"><CalendarClock className="size-4" />Расписание</Link>
        </div>
        <div className="divide-y divide-ink-800">
          {todayList.length === 0 && <p className="p-8 text-center text-sm text-ink-500">Сегодня записей нет</p>}
          {todayList.map((b) => {
            const end = addMinutes(b.startsAt, b.durationMin);
            const live = b.startsAt <= now && now < end;
            return (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 transition hover:bg-ink-850 sm:flex-nowrap">
                <div className="w-24 shrink-0 font-mono text-sm">
                  <span className={clsx(live ? "text-brand-400" : "text-white")}>{b.startsAt.slice(11)}</span>
                  <span className="text-ink-500">–{end.slice(11)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{b.carMake} {b.carModel} <span className="ml-1 font-mono text-xs text-ink-500">{b.plate}</span></div>
                  <div className="truncate text-xs text-ink-400">{b.items.map((i) => i.service.name).join(", ")}</div>
                </div>
                <div className="hidden w-32 shrink-0 text-xs text-ink-400 md:block">{b.bay.name}<br />{b.master?.name ?? "—"}</div>
                <StatusBadge status={b.status} />
                <div className="w-24 shrink-0 text-right font-mono text-sm text-white">{rub(b.totalPrice)}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
