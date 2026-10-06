"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Clock } from "lucide-react";
import clsx from "clsx";
import { CAR_CLASS_INFO } from "@/lib/constants";
import { priceFor, rub } from "@/lib/format";
import { formatDuration } from "@/lib/time";
import type { CarClass } from "@/db/schema";

type S = { id: number; name: string; basePrice: number; durationMin: number };

export function QuickCalculator({ services }: { services: S[] }) {
  const [carClass, setCarClass] = useState<CarClass>("A");
  const [picked, setPicked] = useState<number[]>(services.slice(0, 2).map((s) => s.id));

  const total = useMemo(() => {
    const items = services.filter((s) => picked.includes(s.id));
    return {
      price: items.reduce((a, s) => a + priceFor(s.basePrice, carClass), 0),
      time: items.reduce((a, s) => a + s.durationMin, 0),
    };
  }, [services, picked, carClass]);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <span className="label">Класс автомобиля</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(CAR_CLASS_INFO) as CarClass[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCarClass(c)}
                className={clsx(
                  "rounded-xl p-3 text-left ring-1 transition",
                  carClass === c ? "bg-brand-500/10 ring-brand-500" : "bg-ink-850 ring-ink-700 hover:ring-ink-500",
                )}
              >
                <div className="text-sm font-semibold text-white">{CAR_CLASS_INFO[c].label}</div>
                <div className="mt-0.5 text-xs text-ink-400">{CAR_CLASS_INFO[c].hint}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Что нужно сделать</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl p-3 text-left text-sm ring-1 transition",
                    on ? "bg-ink-800 ring-brand-500/60 text-white" : "bg-ink-850 ring-ink-700 text-ink-300 hover:ring-ink-500",
                  )}
                >
                  <span className={clsx("grid size-5 shrink-0 place-items-center rounded-md ring-1", on ? "bg-brand-500 ring-brand-500" : "ring-ink-600")}>
                    {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{s.name}</span>
                  <span className="font-mono text-xs text-ink-400">{rub(priceFor(s.basePrice, carClass))}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-8 bg-ink-850 p-6 sm:p-8 lg:border-l lg:border-ink-800">
        <div>
          <div className="text-sm text-ink-400">Итого за работы</div>
          <div className="mt-2 font-mono text-5xl font-bold tracking-tight text-white tabular-nums">{rub(total.price)}</div>
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-300">
            <Clock className="size-4 text-brand-500" />
            {total.time ? `≈ ${formatDuration(total.time)} на посту` : "Выберите услуги"}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink-400">
            Цена фиксируется при записи. Если при осмотре найдём что-то ещё — сначала согласуем с вами, без самодеятельности.
          </p>
        </div>
        <Link
          href={picked.length ? `/booking?services=${picked.join(",")}&class=${carClass}` : "/booking"}
          className="btn-primary py-4 text-base"
        >
          Выбрать время →
        </Link>
      </div>
    </div>
  );
}
