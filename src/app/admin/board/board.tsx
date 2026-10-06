"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronRight, GripVertical, User, Wrench } from "lucide-react";
import clsx from "clsx";
import { setStatus } from "@/app/actions/admin";
import { STATUS_INFO } from "@/lib/constants";
import { rub } from "@/lib/format";
import { formatDate } from "@/lib/time";
import type { Status } from "@/db/enums";

export type Card = {
  id: number;
  code: string;
  status: Status;
  startsAt: string;
  car: string;
  plate: string | null;
  client: string;
  services: string[];
  master: string | null;
  total: number;
};

const COLUMNS: Status[] = ["new", "confirmed", "in_progress", "ready", "done"];
const ACCENT: Record<Status, string> = {
  new: "bg-sky-500", confirmed: "bg-violet-500", in_progress: "bg-amber-500", ready: "bg-emerald-500", done: "bg-zinc-500", cancelled: "bg-red-500",
};

export function Board({ initial }: { initial: Card[] }) {
  const [cards, moveOptimistic] = useOptimistic(initial, (state, { id, status }: { id: number; status: Status }) =>
    state.map((c) => (c.id === id ? { ...c, status } : c)),
  );
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<Status | null>(null);

  function move(id: number, status: Status) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;
    startTransition(async () => {
      moveOptimistic({ id, status });
      await setStatus(id, status);
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="grid min-w-[1100px] grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const list = cards.filter((c) => c.status === col);
          const next = COLUMNS[COLUMNS.indexOf(col) + 1];
          return (
            <section
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOver(col); }}
              onDragLeave={() => setOver((o) => (o === col ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId) move(dragId, col);
                setDragId(null);
              }}
              className={clsx("flex min-h-[60vh] flex-col rounded-2xl bg-ink-900/60 p-3 ring-1 transition", over === col ? "ring-brand-500 bg-brand-500/5" : "ring-ink-800")}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className={clsx("size-2 rounded-full", ACCENT[col])} />
                  {STATUS_INFO[col].label}
                </div>
                <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-400">{list.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2">
                {list.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => setDragId(null)}
                    className={clsx(
                      "group cursor-grab rounded-xl bg-ink-850 p-3 ring-1 ring-ink-700 transition hover:ring-ink-500 active:cursor-grabbing",
                      dragId === c.id && "opacity-40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-ink-400">
                        <span className="font-mono">{c.startsAt.slice(11)}</span> · {formatDate(c.startsAt, { day: "numeric", month: "short" })}
                      </div>
                      <GripVertical className="size-4 shrink-0 text-ink-600 group-hover:text-ink-400" />
                    </div>
                    <Link href={`/admin/bookings/${c.id}`} className="mt-1 block font-semibold text-white hover:text-brand-400">{c.car}</Link>
                    {c.plate && <div className="mt-0.5 inline-block rounded bg-ink-950 px-1.5 py-0.5 font-mono text-[11px] text-ink-300 ring-1 ring-ink-700">{c.plate}</div>}
                    <p className="mt-2 line-clamp-2 text-xs text-ink-400">{c.services.join(", ")}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-ink-700/60 pt-2 text-xs">
                      <span className="flex items-center gap-1 text-ink-400">
                        {c.master ? <><Wrench className="size-3" />{c.master.split(" ")[0]}</> : <><User className="size-3" />{c.client}</>}
                      </span>
                      <span className="font-mono font-semibold text-white">{rub(c.total)}</span>
                    </div>
                    {/* Кнопка для тач-устройств, где нет drag-and-drop */}
                    {next && (
                      <button onClick={() => move(c.id, next)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs text-ink-400 ring-1 ring-ink-700 transition hover:bg-ink-800 hover:text-white">
                        {STATUS_INFO[next].label} <ChevronRight className="size-3" />
                      </button>
                    )}
                  </article>
                ))}
                {list.length === 0 && <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-ink-800 p-6 text-center text-xs text-ink-600">Перетащите сюда</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
