"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Clock, Flame, Plus, Search, X } from "lucide-react";
import clsx from "clsx";
import { CAR_CLASS_INFO, CATEGORY_LABEL } from "@/lib/constants";
import { priceFor, rub, plural } from "@/lib/format";
import { formatDuration } from "@/lib/time";
import { CATEGORIES, type CarClass, type Category } from "@/db/enums";
import type { Service } from "@/db/schema";

export function ServicesCatalog({ services, initialCategory }: { services: Service[]; initialCategory: Category | "all" }) {
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const [carClass, setCarClass] = useState<CarClass>("A");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(
      (s) => (category === "all" || s.category === category) && (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
    );
  }, [services, category, query]);

  const grouped = useMemo(() => {
    const m = new Map<Category, Service[]>();
    for (const s of filtered) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return [...m.entries()];
  }, [filtered]);

  const cartItems = services.filter((s) => cart.includes(s.id));
  const cartTotal = cartItems.reduce((a, s) => a + priceFor(s.basePrice, carClass), 0);
  const cartTime = cartItems.reduce((a, s) => a + s.durationMin, 0);
  const toggle = (id: number) => setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <>
      {/* Панель фильтров */}
      <div className="sticky top-16 z-30 -mx-4 mt-10 border-y border-ink-800 bg-ink-950/95 px-4 py-4 sm:mx-0 sm:rounded-2xl sm:border lg:top-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
            {(["all", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 transition",
                  category === c ? "bg-white text-ink-950 ring-white" : "text-ink-300 ring-ink-700 hover:text-white hover:ring-ink-500",
                )}
              >
                {c === "all" ? "Все" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск услуги" className="input py-2.5 pl-9 lg:w-56" />
            </div>
            <select value={carClass} onChange={(e) => setCarClass(e.target.value as CarClass)} className="input py-2.5 lg:w-56" aria-label="Класс авто">
              {(Object.keys(CAR_CLASS_INFO) as CarClass[]).map((c) => (
                <option key={c} value={c}>{CAR_CLASS_INFO[c].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-14 pb-28">
        {grouped.length === 0 && (
          <div className="card p-12 text-center text-ink-400">
            Ничего не найдено. Опишите проблему по телефону — подскажем, что нужно.
          </div>
        )}
        {grouped.map(([cat, items]) => (
          <section key={cat}>
            <h2 className="mb-5 text-xl font-bold text-white">{CATEGORY_LABEL[cat]}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((s) => {
                const inCart = cart.includes(s.id);
                return (
                  <article
                    key={s.id}
                    className={clsx("card flex gap-4 p-5 transition", inCart && "ring-brand-500/70 bg-ink-850")}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{s.name}</h3>
                        {s.popular && (
                          <span className="badge bg-brand-500/10 text-brand-400 ring-brand-500/30"><Flame className="size-3" />Часто берут</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{s.description}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock className="size-3.5" /> {formatDuration(s.durationMin)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-3">
                      <div className="whitespace-nowrap font-mono text-lg font-bold text-white">{rub(priceFor(s.basePrice, carClass))}</div>
                      <button
                        onClick={() => toggle(s.id)}
                        className={clsx("btn-sm", inCart ? "btn-primary" : "btn-secondary")}
                        aria-pressed={inCart}
                      >
                        {inCart ? <><Check className="size-3.5" />Выбрано</> : <><Plus className="size-3.5" />Добавить</>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Плавающая корзина */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-900/95 transition duration-300",
          cart.length ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="container-x flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCart([])} className="btn-ghost p-2" aria-label="Очистить"><X className="size-4" /></button>
            <div>
              <div className="text-sm text-ink-300">
                {cart.length} {plural(cart.length, ["услуга", "услуги", "услуг"])} · ≈ {formatDuration(cartTime)}
              </div>
              <div className="font-mono text-xl font-bold text-white">{rub(cartTotal)}</div>
            </div>
          </div>
          <Link href={`/booking?services=${cart.join(",")}&class=${carClass}`} className="btn-primary py-3.5">
            Выбрать дату и время →
          </Link>
        </div>
      </div>
    </>
  );
}
