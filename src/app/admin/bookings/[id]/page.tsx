import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, MessageSquare, Phone } from "lucide-react";
import { db, bays, bookings, masters, statusEvents } from "@/db";
import { STATUSES } from "@/db/enums";
import { CAR_CLASS_INFO, STATUS_INFO } from "@/lib/constants";
import { formatPhone, rub } from "@/lib/format";
import { addMinutes, formatDateTime, formatDuration } from "@/lib/time";
import { updateBooking } from "@/app/actions/admin";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }: PageProps<"/admin/bookings/[id]">) {
  const { id } = await params;
  const b = await db.query.bookings.findFirst({
    where: eq(bookings.id, Number(id)),
    with: { items: { with: { service: true } }, events: { orderBy: desc(statusEvents.createdAt) }, master: true, bay: true },
  });
  if (!b) notFound();
  const [masterList, bayList, history] = await Promise.all([
    db.select().from(masters).where(eq(masters.active, true)).orderBy(asc(masters.name)),
    db.select().from(bays).orderBy(bays.id),
    db.select({ n: bookings.id }).from(bookings).where(eq(bookings.phone, b.phone)),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white"><ArrowLeft className="size-4" />Все записи</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{b.carMake} {b.carModel}</h1>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-ink-400">#{b.code} · создана {formatDateTime(b.createdAt.slice(0, 16))}</p>
        </div>
        <Link href={`/status/${b.code}`} target="_blank" className="btn-secondary btn-sm"><ExternalLink className="size-4" />Страница клиента</Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="card space-y-3 p-5 text-sm">
              <h2 className="font-semibold text-white">Клиент</h2>
              <div className="text-lg text-white">{b.clientName}</div>
              <a href={`tel:+${b.phone}`} className="flex items-center gap-2 font-mono text-brand-400 hover:text-brand-300"><Phone className="size-4" />{formatPhone(b.phone)}</a>
              {b.email && <div className="text-ink-400">{b.email}</div>}
              <div className="text-xs text-ink-500">Визитов по этому номеру: {history.length}</div>
            </section>
            <section className="card space-y-2 p-5 text-sm">
              <h2 className="font-semibold text-white">Автомобиль и время</h2>
              <div className="text-ink-200">{b.carMake} {b.carModel}{b.carYear && `, ${b.carYear}`}</div>
              <div className="text-ink-400">{CAR_CLASS_INFO[b.carClass].label}{b.plate && <> · <span className="font-mono text-ink-200">{b.plate}</span></>}</div>
              <div className="pt-2 text-white">{formatDateTime(b.startsAt)} – {addMinutes(b.startsAt, b.durationMin).slice(11)}</div>
              <div className="text-ink-400">{formatDuration(b.durationMin)} · {b.bay.name}</div>
            </section>
          </div>

          {b.comment && (
            <div className="flex gap-3 rounded-2xl bg-sky-500/10 p-4 text-sm text-sky-100 ring-1 ring-sky-500/30">
              <MessageSquare className="mt-0.5 size-4 shrink-0" /><div><b>Комментарий клиента:</b> {b.comment}</div>
            </div>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-semibold text-white">Заказ-наряд</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ink-800">
                {b.items.map((i) => (
                  <tr key={i.serviceId}>
                    <td className="py-3 text-ink-200">{i.service.name}</td>
                    <td className="py-3 text-right text-ink-500">{formatDuration(i.service.durationMin)}</td>
                    <td className="py-3 pl-6 text-right font-mono text-white">{rub(i.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-700"><td className="pt-4 text-ink-400" colSpan={2}>Итого</td><td className="pt-4 text-right font-mono text-xl font-bold text-white">{rub(b.totalPrice)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-white">История</h2>
            <ol className="space-y-4 border-l border-ink-700 pl-5">
              {b.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-brand-500 ring-4 ring-ink-900" />
                  <div className="text-white">{STATUS_INFO[e.status].label}{e.note && <span className="text-ink-400"> — {e.note}</span>}</div>
                  <div className="text-xs text-ink-500">{formatDateTime(e.createdAt.slice(0, 16))}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <form action={updateBooking} className="card h-fit space-y-4 p-5 xl:sticky xl:top-8">
          <h2 className="font-semibold text-white">Управление</h2>
          <input type="hidden" name="id" value={b.id} />
          <div>
            <label className="label" htmlFor="status">Статус</label>
            <select id="status" name="status" defaultValue={b.status} className="input">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="masterId">Мастер</label>
            <select id="masterId" name="masterId" defaultValue={b.masterId ?? ""} className="input">
              <option value="">Не назначен</option>
              {masterList.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bayId">Пост</label>
            <select id="bayId" name="bayId" defaultValue={b.bayId} className="input">
              {bayList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink-500">Сменится, только если пост свободен в это время</p>
          </div>
          <div>
            <label className="label" htmlFor="adminNote">Заметка для команды</label>
            <textarea id="adminNote" name="adminNote" rows={4} defaultValue={b.adminNote ?? ""} className="input resize-none" placeholder="Видна только сотрудникам" />
          </div>
          <SubmitButton className="btn-primary w-full">Сохранить</SubmitButton>
        </form>
      </div>
    </div>
  );
}
