import Link from "next/link";
import { and, count, desc, eq, gte, like, lt, or, type SQL } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { db, bookings } from "@/db";
import { STATUSES, type Status } from "@/db/enums";
import { STATUS_INFO } from "@/lib/constants";
import { formatPhone, rub } from "@/lib/format";
import { addDays, formatDateTime } from "@/lib/time";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Все записи" };

const PAGE = 25;

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const status = STATUSES.includes(str("status") as Status) ? (str("status") as Status) : "";
  const q = str("q").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str("date")) ? str("date") : "";
  const page = Math.max(1, Number(str("page")) || 1);

  const where: SQL[] = [];
  if (status) where.push(eq(bookings.status, status));
  if (date) where.push(gte(bookings.startsAt, date), lt(bookings.startsAt, addDays(date, 1)));
  if (q) {
    const p = `%${q}%`;
    const digits = q.replace(/\D/g, "");
    where.push(
      or(
        like(bookings.clientName, p), like(bookings.carMake, p), like(bookings.carModel, p),
        like(bookings.plate, `%${q.toUpperCase()}%`), like(bookings.code, `%${q.toUpperCase()}%`),
        digits.length >= 3 ? like(bookings.phone, `%${digits}%`) : undefined,
      )!,
    );
  }
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.bookings.findMany({
      where: cond,
      with: { items: { with: { service: true } } },
      orderBy: desc(bookings.startsAt),
      limit: PAGE,
      offset: (page - 1) * PAGE,
    }),
    db.select({ total: count() }).from(bookings).where(cond),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const qs = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...(date && { date }), page: String(page) });
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, String(v));
      else p.delete(k);
    }
    return `?${p}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Все записи</h1>
        <p className="mt-1 text-sm text-ink-400">Найдено: {total}</p>
      </div>

      <form className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <input name="q" defaultValue={q} placeholder="Имя, телефон, авто, госномер или код" className="input py-2.5 pl-9" />
        </div>
        <input type="date" name="date" defaultValue={date} className="input py-2.5 md:w-44" aria-label="Дата" />
        <select name="status" defaultValue={status} className="input py-2.5 md:w-48" aria-label="Статус">
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
        </select>
        <button className="btn-primary py-2.5">Найти</button>
        {(q || date || status) && <Link href="/admin/bookings" className="btn-ghost py-2.5">Сбросить</Link>}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-ink-800">
              <th className="p-4">Код</th><th className="p-4">Дата</th><th className="p-4">Клиент</th><th className="p-4">Автомобиль</th>
              <th className="p-4">Работы</th><th className="p-4">Статус</th><th className="p-4 text-right">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {rows.map((b) => (
              <tr key={b.id} className="group transition hover:bg-ink-850">
                <td className="p-4"><Link href={`/admin/bookings/${b.id}`} className="font-mono text-brand-400 group-hover:text-brand-300">{b.code}</Link></td>
                <td className="whitespace-nowrap p-4 text-white">{formatDateTime(b.startsAt)}</td>
                <td className="p-4"><div className="text-white">{b.clientName}</div><div className="font-mono text-xs text-ink-500">{formatPhone(b.phone)}</div></td>
                <td className="p-4"><div className="text-ink-200">{b.carMake} {b.carModel}</div><div className="font-mono text-xs text-ink-500">{b.plate}</div></td>
                <td className="max-w-64 p-4 text-ink-400"><div className="line-clamp-2">{b.items.map((i) => i.service.name).join(", ")}</div></td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="whitespace-nowrap p-4 text-right font-mono text-white">{rub(b.totalPrice)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-ink-500">Ничего не найдено</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-400">
          <span>Страница {page} из {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={qs({ page: page - 1 })} className="btn-secondary btn-sm"><ChevronLeft className="size-4" />Назад</Link>}
            {page < pages && <Link href={qs({ page: page + 1 })} className="btn-secondary btn-sm">Вперёд<ChevronRight className="size-4" /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
