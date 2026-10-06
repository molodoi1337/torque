import Link from "next/link";
import { and, gte, lt, ne } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { db, bays, bookings } from "@/db";
import type { Status } from "@/db/enums";
import { CLOSE_HOUR, OPEN_HOUR, STATUS_INFO } from "@/lib/constants";
import { addDays, addMinutes, capitalize, formatDate, nowLocal, toMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Расписание постов" };

const HOUR_PX = 72;
const BLOCK: Record<Status, string> = {
  new: "bg-sky-500/15 ring-sky-500/40 text-sky-100",
  confirmed: "bg-violet-500/15 ring-violet-500/40 text-violet-100",
  in_progress: "bg-amber-500/20 ring-amber-500/50 text-amber-50",
  ready: "bg-emerald-500/15 ring-emerald-500/40 text-emerald-50",
  done: "bg-ink-800 ring-ink-700 text-ink-300",
  cancelled: "",
};

export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  const sp = await searchParams;
  const now = nowLocal();
  const today = now.slice(0, 10);
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;

  const [bayList, list] = await Promise.all([
    db.select().from(bays).orderBy(bays.id),
    db.query.bookings.findMany({
      where: and(gte(bookings.startsAt, date), lt(bookings.startsAt, addDays(date, 1)), ne(bookings.status, "cancelled")),
      with: { items: { with: { service: true } }, master: true },
    }),
  ]);

  const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const top = (t: string) => ((toMinutes(t) - OPEN_HOUR * 60) / 60) * HOUR_PX;
  const nowTop = date === today ? top(now.slice(11, 16)) : null;
  const booked = list.reduce((a, b) => a + b.durationMin, 0);
  const load = Math.round((booked / (bayList.length * (CLOSE_HOUR - OPEN_HOUR) * 60)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Расписание постов</h1>
          <p className="mt-1 text-sm text-ink-400">{list.length} записей · загрузка {load}%</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`?date=${addDays(date, -1)}`} className="btn-secondary btn-sm" aria-label="Предыдущий день"><ChevronLeft className="size-4" /></Link>
          <div className="min-w-44 text-center text-sm font-semibold text-white">{capitalize(formatDate(date, { weekday: "short", day: "numeric", month: "long" }))}</div>
          <Link href={`?date=${addDays(date, 1)}`} className="btn-secondary btn-sm" aria-label="Следующий день"><ChevronRight className="size-4" /></Link>
          {date !== today && <Link href="?" className="btn-ghost btn-sm">Сегодня</Link>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="sticky top-0 z-20 grid border-b border-ink-800 bg-ink-900" style={{ gridTemplateColumns: `64px repeat(${bayList.length}, 1fr)` }}>
            <div />
            {bayList.map((b) => (
              <div key={b.id} className="border-l border-ink-800 p-3 text-sm font-semibold text-white">{b.name}</div>
            ))}
          </div>
          <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${bayList.length}, 1fr)` }}>
            {/* Шкала часов */}
            <div>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX }} className="relative border-b border-ink-850 pr-2 text-right font-mono text-xs text-ink-500">
                  <span className="relative -top-2">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>
            {bayList.map((bay) => (
              <div key={bay.id} className="relative border-l border-ink-800">
                {hours.map((h) => <div key={h} style={{ height: HOUR_PX }} className="border-b border-ink-850" />)}
                {list.filter((b) => b.bayId === bay.id).map((b) => {
                  const t = b.startsAt.slice(11, 16);
                  const height = Math.max((b.durationMin / 60) * HOUR_PX - 4, 28);
                  return (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      title={`${b.carMake} ${b.carModel} — ${STATUS_INFO[b.status].label}`}
                      className={clsx("absolute inset-x-1.5 overflow-hidden rounded-lg p-2 text-xs ring-1 transition hover:z-10 hover:brightness-125", BLOCK[b.status])}
                      style={{ top: top(t) + 2, height }}
                    >
                      <div className="flex justify-between gap-2 font-mono opacity-80">
                        <span>{t}–{addMinutes(b.startsAt, b.durationMin).slice(11)}</span>
                        <span className="hidden xl:inline">{STATUS_INFO[b.status].label}</span>
                      </div>
                      <div className="mt-0.5 truncate font-semibold">{b.carMake} {b.carModel}</div>
                      {height > 60 && <div className="mt-0.5 line-clamp-2 opacity-70">{b.items.map((i) => i.service.name).join(", ")}</div>}
                      {height > 100 && b.master && <div className="mt-1 opacity-60">{b.master.name}</div>}
                    </Link>
                  );
                })}
              </div>
            ))}
            {nowTop !== null && nowTop >= 0 && nowTop <= hours.length * HOUR_PX && (
              <div className="pointer-events-none absolute left-14 right-0 z-10 flex items-center" style={{ top: nowTop }}>
                <span className="size-2.5 rounded-full bg-brand-500" />
                <span className="h-0.5 flex-1 bg-brand-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
