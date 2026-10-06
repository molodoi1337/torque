import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import { db, bookings } from "@/db";
import { formatPhone, rub } from "@/lib/format";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Клиенты" };

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";

  // Клиент = уникальный телефон. Имя и авто берём из последней записи.
  const rows = await db
    .select({
      phone: bookings.phone,
      name: sql<string>`(select client_name from bookings b2 where b2.phone = ${bookings.phone} order by starts_at desc limit 1)`,
      car: sql<string>`(select car_make || ' ' || car_model from bookings b2 where b2.phone = ${bookings.phone} order by starts_at desc limit 1)`,
      visits: sql<number>`sum(case when ${bookings.status} = 'done' then 1 else 0 end)`,
      spent: sql<number>`sum(case when ${bookings.status} = 'done' then ${bookings.totalPrice} else 0 end)`,
      last: sql<string>`max(${bookings.startsAt})`,
    })
    .from(bookings)
    .groupBy(bookings.phone)
    .orderBy(desc(sql`5`))
    .limit(500);

  const list = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.phone.includes(q.replace(/\D/g, "") || "—") || r.car.toLowerCase().includes(q)) : rows;
  const vip = (spent: number) => spent >= 30000;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Клиенты</h1>
          <p className="mt-1 text-sm text-ink-400">{rows.length} клиентов · отсортированы по сумме заказов</p>
        </div>
        <form className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <input name="q" defaultValue={q} placeholder="Имя, телефон или авто" className="input py-2.5 pl-9" />
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-ink-800">
              <th className="p-4">Клиент</th><th className="p-4">Телефон</th><th className="p-4">Автомобиль</th>
              <th className="p-4 text-right">Визитов</th><th className="p-4 text-right">Сумма</th><th className="p-4">Последний визит</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {list.map((c) => (
              <tr key={c.phone} className="transition hover:bg-ink-850">
                <td className="p-4">
                  <Link href={`/admin/bookings?q=${c.phone}`} className="flex items-center gap-3 text-white hover:text-brand-400">
                    <span className="grid size-8 place-items-center rounded-full bg-ink-800 text-xs font-semibold">{c.name[0]}</span>
                    {c.name}
                    {vip(c.spent) && <span className="badge bg-brand-500/10 text-brand-400 ring-brand-500/30">VIP</span>}
                  </Link>
                </td>
                <td className="p-4 font-mono text-ink-300">{formatPhone(c.phone)}</td>
                <td className="p-4 text-ink-300">{c.car}</td>
                <td className="p-4 text-right text-white">{c.visits}</td>
                <td className="p-4 text-right font-mono text-white">{rub(c.spent)}</td>
                <td className="p-4 text-ink-400">{formatDate(c.last, { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
