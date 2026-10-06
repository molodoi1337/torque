"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Flame, Pencil, Plus, X } from "lucide-react";
import clsx from "clsx";
import { saveService, toggleMaster, toggleService } from "@/app/actions/admin";
import { CATEGORY_LABEL } from "@/lib/constants";
import { rub } from "@/lib/format";
import { formatDuration } from "@/lib/time";
import { CATEGORIES } from "@/db/enums";
import type { Master, Service } from "@/db/schema";
import { SubmitButton } from "@/components/submit-button";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-brand-500" : "bg-ink-700")}
    >
      <span className={clsx("absolute top-0.5 size-5 rounded-full bg-white transition", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function ServiceDialog({ service, onClose }: { service: Partial<Service> | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(saveService, undefined);

  useEffect(() => {
    if (service) ref.current?.showModal();
    else ref.current?.close();
  }, [service]);
  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-ink-900 p-0 text-ink-100 ring-1 ring-ink-700 backdrop:bg-black/70"
    >
      {service && (
        <form action={action} key={service.id ?? "new"} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{service.id ? "Редактировать услугу" : "Новая услуга"}</h2>
            <button type="button" onClick={onClose} className="btn-ghost p-1.5" aria-label="Закрыть"><X className="size-4" /></button>
          </div>
          {service.id && <input type="hidden" name="id" value={service.id} />}
          <div>
            <label className="label" htmlFor="s-name">Название</label>
            <input id="s-name" name="name" required minLength={3} defaultValue={service.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-cat">Категория</label>
            <select id="s-cat" name="category" defaultValue={service.category ?? "maintenance"} className="input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-desc">Описание</label>
            <textarea id="s-desc" name="description" rows={2} maxLength={300} defaultValue={service.description} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="s-price">Базовая цена, ₽</label>
              <input id="s-price" name="basePrice" type="number" min={0} step={50} required defaultValue={service.basePrice} className="input font-mono" />
            </div>
            <div>
              <label className="label" htmlFor="s-dur">Длительность, мин</label>
              <input id="s-dur" name="durationMin" type="number" min={15} step={15} required defaultValue={service.durationMin ?? 60} className="input font-mono" />
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={service.active ?? true} className="size-4 accent-brand-500" />Активна</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="popular" defaultChecked={service.popular} className="size-4 accent-brand-500" />Популярная</label>
          </div>
          {state && "error" in state && <p className="text-sm text-red-400">{state.error}</p>}
          <SubmitButton className="btn-primary w-full">Сохранить</SubmitButton>
        </form>
      )}
    </dialog>
  );
}

export function ServicesTable({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [, start] = useTransition();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Услуги</h1>
          <p className="mt-1 text-sm text-ink-400">Базовые цены для легкового класса. Для других классов применяется коэффициент ×1.25 и ×1.5.</p>
        </div>
        <button onClick={() => setEditing({})} className="btn-primary"><Plus className="size-4" />Добавить услугу</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-ink-800">
              <th className="p-4">Услуга</th><th className="p-4">Категория</th><th className="p-4 text-right">Цена</th>
              <th className="p-4 text-right">Время</th><th className="p-4">Активна</th><th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {services.map((s) => (
              <tr key={s.id} className={clsx("transition hover:bg-ink-850", !s.active && "opacity-50")}>
                <td className="p-4 text-white">
                  <span className="flex items-center gap-2">{s.name}{s.popular && <Flame className="size-3.5 text-brand-500" />}</span>
                </td>
                <td className="p-4 text-ink-400">{CATEGORY_LABEL[s.category]}</td>
                <td className="p-4 text-right font-mono text-white">{rub(s.basePrice)}</td>
                <td className="p-4 text-right text-ink-400">{formatDuration(s.durationMin)}</td>
                <td className="p-4"><Toggle on={s.active} label={`Активность: ${s.name}`} onChange={(v) => start(() => toggleService(s.id, v))} /></td>
                <td className="p-4 text-right"><button onClick={() => setEditing(s)} className="btn-ghost p-2" aria-label="Редактировать"><Pencil className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ServiceDialog service={editing} onClose={() => setEditing(null)} />
    </section>
  );
}

export function MastersList({ masters }: { masters: Master[] }) {
  const [, start] = useTransition();
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">Мастера</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {masters.map((m) => (
          <div key={m.id} className={clsx("card flex items-center gap-4 p-4", !m.active && "opacity-50")}>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink-800 font-bold text-white">
              {m.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-white">{m.name}</div>
              <div className="truncate text-xs text-ink-400">{m.specialization} · стаж {m.experience} лет</div>
            </div>
            <Toggle on={m.active} label={`Мастер работает: ${m.name}`} onChange={(v) => start(() => toggleMaster(m.id, v))} />
          </div>
        ))}
      </div>
    </section>
  );
}
