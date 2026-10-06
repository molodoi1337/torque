import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";
import { Car, LogOut, Plus } from "lucide-react";
import { db, bookings, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { cancelMyBooking } from "@/app/actions/client";
import { StatusBadge } from "@/components/status-badge";
import { formatPhone, plural, rub } from "@/lib/format";
import { formatDateTime, nowLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Личный кабинет" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireUser();
  const me = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!me) return null;

  const list = await db.query.bookings.findMany({
    where: or(eq(bookings.userId, me.id), me.phone ? eq(bookings.phone, me.phone) : undefined),
    with: { items: { with: { service: true } } },
    orderBy: desc(bookings.startsAt),
  });

  const now = nowLocal();
  const upcoming = list.filter((b) => b.startsAt > now && b.status !== "cancelled" && b.status !== "done");
  const history = list.filter((b) => !upcoming.includes(b));
  const spent = list.filter((b) => b.status === "done").reduce((a, b) => a + b.totalPrice, 0);
  const cars = [...new Set(list.map((b) => `${b.carMake} ${b.carModel}`))];

  return (
    <div className="container-x py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Личный кабинет</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Здравствуйте, {me.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-400">{me.email}{me.phone && ` · ${formatPhone(me.phone)}`}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/booking" className="btn-primary"><Plus className="size-4" />Новая запись</Link>
          <form action={logout}><button className="btn-secondary"><LogOut className="size-4" />Выйти</button></form>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><div className="text-sm text-ink-400">Визитов</div><div className="mt-1 text-3xl font-bold text-white">{list.filter((b) => b.status === "done").length}</div></div>
        <div className="card p-5"><div className="text-sm text-ink-400">Потрачено на работы</div><div className="mt-1 font-mono text-3xl font-bold text-white">{rub(spent)}</div></div>
        <div className="card p-5">
          <div className="text-sm text-ink-400">Мои автомобили</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {cars.length ? cars.map((c) => <span key={c} className="badge bg-ink-800 text-ink-200 ring-ink-700"><Car className="size-3" />{c}</span>) : <span className="text-ink-500">—</span>}
          </div>
        </div>
      </div>

      <h2 className="mt-12 text-xl font-bold text-white">Предстоящие записи</h2>
      <div className="mt-4 space-y-3">
        {upcoming.length === 0 && (
          <div className="card p-8 text-center text-ink-400">
            Записей пока нет. <Link href="/booking" className="text-brand-400 hover:text-brand-300">Записаться →</Link>
          </div>
        )}
        {upcoming.map((b) => (
          <div key={b.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold text-white">{formatDateTime(b.startsAt)}</span>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-1 text-sm text-ink-400">{b.carMake} {b.carModel} · {b.items.map((i) => i.service.name).join(", ")}</div>
            </div>
            <div className="font-mono text-lg font-bold text-white">{rub(b.totalPrice)}</div>
            <div className="flex gap-2">
              <Link href={`/status/${b.code}`} className="btn-secondary btn-sm">Статус</Link>
              <form action={cancelMyBooking}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn-ghost btn-sm text-red-400 hover:text-red-300">Отменить</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-bold text-white">История</h2>
      <p className="mt-1 text-sm text-ink-500">{history.length} {plural(history.length, ["заказ", "заказа", "заказов"])}</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-ink-800"><th className="p-4">Дата</th><th className="p-4">Автомобиль</th><th className="p-4">Работы</th><th className="p-4">Статус</th><th className="p-4 text-right">Сумма</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {history.map((b) => (
              <tr key={b.id} className="hover:bg-ink-850">
                <td className="p-4 whitespace-nowrap"><Link href={`/status/${b.code}`} className="text-white hover:text-brand-400">{formatDateTime(b.startsAt)}</Link></td>
                <td className="p-4 text-ink-300">{b.carMake} {b.carModel}</td>
                <td className="p-4 text-ink-400">{b.items.map((i) => i.service.name).join(", ")}</td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4 text-right font-mono text-white">{rub(b.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
