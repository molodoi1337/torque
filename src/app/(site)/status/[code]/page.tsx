import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Check, CircleCheckBig, Clock, MapPin, Phone, Wrench, X } from "lucide-react";
import clsx from "clsx";
import { db, bookings } from "@/db";
import { COMPANY, FLOW, STATUS_INFO } from "@/lib/constants";
import { rub } from "@/lib/format";
import { addMinutes, formatDateTime, formatDuration } from "@/lib/time";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Статус заказа", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StatusPage({ params, searchParams }: PageProps<"/status/[code]">) {
  const { code } = await params;
  const { new: isNew } = await searchParams;
  const b = await db.query.bookings.findFirst({
    where: eq(bookings.code, code.toUpperCase()),
    with: { items: { with: { service: true } }, events: true, master: true, bay: true },
  });
  if (!b) notFound();

  const cancelled = b.status === "cancelled";
  const current = FLOW.indexOf(b.status);
  const eventAt = (s: string) => b.events.find((e) => e.status === s)?.createdAt;
  const live = !cancelled && b.status !== "done";

  return (
    <div className="container-x max-w-4xl py-10 lg:py-14">
      {live && <AutoRefresh seconds={30} />}
      {isNew && (
        <div className="mb-8 flex items-start gap-4 rounded-2xl bg-emerald-500/10 p-5 ring-1 ring-emerald-500/30 animate-fade-up">
          <CircleCheckBig className="mt-0.5 size-6 shrink-0 text-emerald-400" />
          <div>
            <div className="font-semibold text-white">Вы записаны! Ждём вас {formatDateTime(b.startsAt)}</div>
            <p className="mt-1 text-sm text-ink-300">
              Сохраните эту страницу или код <span className="font-mono font-bold text-white">{b.code}</span> — здесь будет виден статус ремонта.
              Мастер-приёмщик позвонит для подтверждения.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-sm text-ink-400">Заказ #{b.code}</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">{b.carMake} {b.carModel}</h1>
        </div>
        <div className={clsx("text-lg font-semibold", cancelled ? "text-red-400" : "text-brand-400")}>{STATUS_INFO[b.status].client}</div>
      </div>

      {/* Таймлайн */}
      <div className="card mt-8 p-6 sm:p-8">
        {cancelled ? (
          <div className="flex items-center gap-3 text-ink-300"><X className="size-5 text-red-400" />Запись отменена. Если это ошибка — позвоните нам.</div>
        ) : (
          <ol className="grid gap-6 sm:grid-cols-5 sm:gap-2">
            {FLOW.map((s, i) => {
              const done = i < current || (i === current && s === "done");
              const active = i === current && s !== "done";
              const at = eventAt(s);
              return (
                <li key={s} className="relative flex gap-4 sm:flex-col sm:items-center sm:text-center">
                  {i < FLOW.length - 1 && (
                    <span className={clsx("absolute left-4 top-9 h-[calc(100%-12px)] w-0.5 sm:left-[calc(50%+20px)] sm:top-4 sm:h-0.5 sm:w-[calc(100%-40px)]", i < current ? "bg-brand-500" : "bg-ink-800")} />
                  )}
                  <span
                    className={clsx(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-ink-900",
                      done ? "bg-brand-500 text-white" : active ? "bg-white text-ink-950" : "bg-ink-800 text-ink-500",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : active ? <span className="size-2.5 animate-pulse rounded-full bg-brand-500" /> : <span className="text-xs">{i + 1}</span>}
                  </span>
                  <div className="sm:mt-3">
                    <div className={clsx("text-sm font-semibold", i <= current ? "text-white" : "text-ink-500")}>{STATUS_INFO[s].client}</div>
                    {at && i <= current && <div className="mt-0.5 text-xs text-ink-400">{formatDateTime(at.slice(0, 16))}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Работы</h2>
          <ul className="divide-y divide-ink-800">
            {b.items.map((it) => (
              <li key={it.serviceId} className="flex justify-between gap-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-ink-200"><Wrench className="size-4 text-ink-500" />{it.service.name}</span>
                <span className="whitespace-nowrap font-mono text-ink-300">{rub(it.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-ink-700 pt-4">
            <span className="text-ink-400">Итого за работы</span>
            <span className="font-mono text-xl font-bold text-white">{rub(b.totalPrice)}</span>
          </div>
        </div>
        <div className="card space-y-4 p-6 text-sm">
          <div className="flex gap-3"><Clock className="size-5 shrink-0 text-brand-500" /><div><div className="text-ink-400">Время</div><div className="text-white">{formatDateTime(b.startsAt)} – {addMinutes(b.startsAt, b.durationMin).slice(11)}</div><div className="text-xs text-ink-500">≈ {formatDuration(b.durationMin)}</div></div></div>
          <div className="flex gap-3"><Wrench className="size-5 shrink-0 text-brand-500" /><div><div className="text-ink-400">Мастер · пост</div><div className="text-white">{b.master?.name ?? "Будет назначен"} · {b.bay.name}</div></div></div>
          <div className="flex gap-3"><MapPin className="size-5 shrink-0 text-brand-500" /><div><div className="text-ink-400">Адрес</div><div className="text-white">{COMPANY.address}</div></div></div>
          <a href={COMPANY.phoneHref} className="btn-secondary w-full"><Phone className="size-4" />Позвонить в сервис</a>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-ink-400 hover:text-white">← На главную</Link>
      </div>
    </div>
  );
}
