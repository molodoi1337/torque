"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Car, Check, Clock, Loader2, User, Wrench } from "lucide-react";
import clsx from "clsx";
import { createBooking, getAvailableSlots } from "@/app/actions/booking";
import { CAR_CLASS_INFO, CAR_MAKES, CATEGORY_LABEL } from "@/lib/constants";
import { formatPhone, priceFor, rub } from "@/lib/format";
import { formatDate, formatDuration } from "@/lib/time";
import type { CarClass, Category } from "@/db/enums";
import type { Slot } from "@/lib/availability";

type S = { id: number; name: string; category: Category; basePrice: number; durationMin: number; popular: boolean };
type Props = {
  services: S[];
  initialIds: number[];
  initialClass: CarClass;
  days: string[];
  user: { name: string; phone: string; email: string } | null;
};

const STEPS = [
  { title: "Услуги", icon: Wrench },
  { title: "Автомобиль", icon: Car },
  { title: "Дата и время", icon: CalendarDays },
  { title: "Контакты", icon: User },
];

export function BookingWizard({ services, initialIds, initialClass, days, user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialIds.length ? 1 : 0);
  const [ids, setIds] = useState<number[]>(initialIds);
  const [carClass, setCarClass] = useState<CarClass>(initialClass);
  const [car, setCar] = useState({ make: "", model: "", year: "", plate: "" });
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [contact, setContact] = useState({
    name: user?.name ?? "",
    phone: user?.phone ? formatPhone(user.phone) : "",
    email: user?.email ?? "",
    comment: "",
    agree: !!user,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loadingSlots, startSlots] = useTransition();
  const [submitting, startSubmit] = useTransition();

  const picked = services.filter((s) => ids.includes(s.id));
  const total = picked.reduce((a, s) => a + priceFor(s.basePrice, carClass), 0);
  const duration = picked.reduce((a, s) => a + s.durationMin, 0);

  const grouped = useMemo(() => {
    const m = new Map<Category, S[]>();
    for (const s of services) m.set(s.category, [...(m.get(s.category) ?? []), s]);
    return [...m.entries()];
  }, [services]);

  // Слоты зависят от даты и суммарной длительности
  useEffect(() => {
    if (step !== 2) return;
    startSlots(async () => {
      const res = await getAvailableSlots(date, ids);
      setSlots(res);
      setTime((t) => (t && res.some((s) => s.time === t && s.free) ? t : null));
    });
  }, [step, date, ids]);

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0 && !ids.length) e.serviceIds = "Выберите хотя бы одну услугу";
    if (s === 1) {
      if (!car.make) e.carMake = "Выберите марку";
      if (!car.model.trim()) e.carModel = "Укажите модель";
    }
    if (s === 2 && !time) e.time = "Выберите время";
    if (s === 3) {
      if (contact.name.trim().length < 2) e.name = "Введите имя";
      if (contact.phone.replace(/\D/g, "").length !== 11) e.phone = "Введите телефон полностью";
      if (!contact.agree) e.agree = "Нужно согласие";
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  const next = () => validate(step) && setStep((s) => s + 1);

  function submit() {
    if (!validate(3)) return;
    setFormError("");
    startSubmit(async () => {
      const res = await createBooking({
        serviceIds: ids,
        carClass,
        carMake: car.make,
        carModel: car.model,
        carYear: car.year,
        plate: car.plate,
        date,
        time: time ?? "",
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        comment: contact.comment,
        agree: contact.agree as true,
      });
      if (res.ok) {
        router.push(`/status/${res.code}?new=1`);
      } else {
        setFormError(res.error);
        setErrors(res.fields ?? {});
        if (res.fields?.time || res.error.includes("время")) {
          setStep(2);
          setTime(null);
          setSlots(await getAvailableSlots(date, ids));
        }
      }
    });
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1.5 text-xs font-medium text-red-400">{errors[k]}</p> : null);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        {/* Прогресс */}
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                className="group w-full text-left disabled:cursor-default"
              >
                <div className={clsx("h-1 rounded-full transition", i <= step ? "bg-brand-500" : "bg-ink-800")} />
                <div className={clsx("mt-3 flex items-center gap-2 text-xs font-medium sm:text-sm", i === step ? "text-white" : i < step ? "text-ink-300" : "text-ink-500")}>
                  <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full text-[11px]", i < step ? "bg-brand-500 text-white" : i === step ? "bg-white text-ink-950" : "bg-ink-800")}>
                    {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              </button>
            </li>
          ))}
        </ol>

        <div className="card p-5 sm:p-8">
          {step === 0 && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-white">Что нужно сделать?</h2>
              {grouped.map(([cat, items]) => (
                <div key={cat}>
                  <div className="label">{CATEGORY_LABEL[cat]}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((s) => {
                      const on = ids.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setIds((v) => (on ? v.filter((x) => x !== s.id) : [...v, s.id]))}
                          className={clsx(
                            "flex items-center gap-3 rounded-xl p-3 text-left text-sm ring-1 transition",
                            on ? "bg-brand-500/10 text-white ring-brand-500" : "bg-ink-850 text-ink-300 ring-ink-700 hover:ring-ink-500",
                          )}
                        >
                          <span className={clsx("grid size-5 shrink-0 place-items-center rounded-md ring-1", on ? "bg-brand-500 ring-brand-500" : "ring-ink-600")}>
                            {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
                          </span>
                          <span className="flex-1">{s.name}</span>
                          <span className="whitespace-nowrap font-mono text-xs text-ink-400">{rub(priceFor(s.basePrice, carClass))}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {err("serviceIds")}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Ваш автомобиль</h2>
              <div>
                <span className="label">Класс</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(CAR_CLASS_INFO) as CarClass[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCarClass(c)}
                      className={clsx("rounded-xl p-3 text-left ring-1 transition", carClass === c ? "bg-brand-500/10 ring-brand-500" : "bg-ink-850 ring-ink-700 hover:ring-ink-500")}
                    >
                      <div className="text-sm font-semibold text-white">{CAR_CLASS_INFO[c].label}</div>
                      <div className="mt-0.5 text-xs text-ink-400">{CAR_CLASS_INFO[c].hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="make">Марка</label>
                  <select id="make" className="input" value={car.make} onChange={(e) => setCar({ ...car, make: e.target.value })}>
                    <option value="">Выберите марку</option>
                    {CAR_MAKES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  {err("carMake")}
                </div>
                <div>
                  <label className="label" htmlFor="model">Модель</label>
                  <input id="model" className="input" placeholder="Например, Camry" value={car.model} onChange={(e) => setCar({ ...car, model: e.target.value })} />
                  {err("carModel")}
                </div>
                <div>
                  <label className="label" htmlFor="year">Год выпуска</label>
                  <input id="year" className="input" inputMode="numeric" maxLength={4} placeholder="2019" value={car.year} onChange={(e) => setCar({ ...car, year: e.target.value.replace(/\D/g, "") })} />
                  {err("carYear")}
                </div>
                <div>
                  <label className="label" htmlFor="plate">Госномер <span className="normal-case tracking-normal text-ink-500">(необязательно)</span></label>
                  <input id="plate" className="input font-mono uppercase" placeholder="А123ВС777" maxLength={12} value={car.plate} onChange={(e) => setCar({ ...car, plate: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white">Когда удобно приехать?</h2>
                <span className="flex items-center gap-1.5 text-sm text-ink-400"><Clock className="size-4" />{formatDuration(duration)}</span>
              </div>
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8">
                {days.map((d) => {
                  const wd = formatDate(d, { weekday: "short" });
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={clsx(
                        "flex w-16 shrink-0 flex-col items-center rounded-xl py-3 ring-1 transition",
                        date === d ? "bg-white text-ink-950 ring-white" : "bg-ink-850 text-ink-300 ring-ink-700 hover:ring-ink-500",
                      )}
                    >
                      <span className="text-xs uppercase">{wd}</span>
                      <span className="text-xl font-bold">{Number(d.slice(8))}</span>
                      <span className="text-[10px] opacity-60">{formatDate(d, { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative min-h-40">
                {loadingSlots && !slots && <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-ink-500" /></div>}
                {slots && slots.every((s) => !s.free) && !loadingSlots && (
                  <p className="rounded-xl bg-ink-850 p-6 text-center text-sm text-ink-400">На этот день свободных окон нет — выберите другую дату.</p>
                )}
                {slots && slots.some((s) => s.free) && (
                  <div className={clsx("grid grid-cols-4 gap-2 transition sm:grid-cols-6", loadingSlots && "opacity-40")}>
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        disabled={!s.free}
                        onClick={() => setTime(s.time)}
                        className={clsx(
                          "rounded-lg py-2.5 font-mono text-sm ring-1 transition",
                          time === s.time
                            ? "bg-brand-500 text-white ring-brand-500"
                            : s.free
                              ? "bg-ink-850 text-ink-100 ring-ink-700 hover:ring-brand-500"
                              : "cursor-not-allowed text-ink-600 line-through ring-ink-800",
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {err("time")}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">Как с вами связаться?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="name">Имя</label>
                  <input id="name" className="input" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                  {err("name")}
                </div>
                <div>
                  <label className="label" htmlFor="phone">Телефон</label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className="input font-mono"
                    placeholder="+7 (___) ___-__-__"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value ? formatPhone(e.target.value) : "" })}
                  />
                  {err("phone")}
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="email">Email <span className="normal-case tracking-normal text-ink-500">(для чека и напоминаний)</span></label>
                  <input id="email" type="email" autoComplete="email" className="input" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                  {err("email")}
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="comment">Комментарий</label>
                  <textarea id="comment" rows={3} className="input resize-none" placeholder="Опишите симптомы: стук, запах, ошибка на панели…" value={contact.comment} onChange={(e) => setContact({ ...contact, comment: e.target.value })} />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-300">
                <input type="checkbox" className="mt-0.5 size-4 accent-brand-500" checked={contact.agree} onChange={(e) => setContact({ ...contact, agree: e.target.checked })} />
                Согласен на обработку персональных данных для записи в сервис
              </label>
              {err("agree")}
            </div>
          )}

          {formError && <p className="mt-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-300 ring-1 ring-red-500/30">{formError}</p>}

          <div className="mt-8 flex justify-between gap-3 border-t border-ink-800 pt-6">
            <button type="button" onClick={() => setStep((s) => s - 1)} className={clsx("btn-ghost", step === 0 && "invisible")}>
              <ArrowLeft className="size-4" /> Назад
            </button>
            {step < 3 ? (
              <button type="button" onClick={next} className="btn-primary">Далее <ArrowRight className="size-4" /></button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Записаться
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Сводка */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-800 p-6">
            <h3 className="font-semibold text-white">Ваша запись</h3>
          </div>
          <dl className="space-y-4 p-6 text-sm">
            <div>
              <dt className="text-ink-500">Услуги</dt>
              <dd className="mt-2 space-y-1.5">
                {picked.length ? picked.map((s) => (
                  <div key={s.id} className="flex justify-between gap-3 text-ink-200">
                    <span>{s.name}</span>
                    <span className="whitespace-nowrap font-mono text-ink-400">{rub(priceFor(s.basePrice, carClass))}</span>
                  </div>
                )) : <span className="text-ink-500">—</span>}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-ink-500">Автомобиль</dt><dd className="text-right text-ink-200">{car.make ? `${car.make} ${car.model}` : CAR_CLASS_INFO[carClass].label}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Когда</dt><dd className="text-ink-200">{time ? `${formatDate(date)}, ${time}` : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Время работ</dt><dd className="text-ink-200">{duration ? `≈ ${formatDuration(duration)}` : "—"}</dd></div>
          </dl>
          <div className="flex items-end justify-between border-t border-ink-800 bg-ink-850 p-6">
            <span className="text-sm text-ink-400">Итого</span>
            <span className="font-mono text-3xl font-bold text-white">{rub(total)}</span>
          </div>
        </div>
        <p className="mt-4 px-2 text-xs leading-relaxed text-ink-500">Стоимость запчастей согласуется отдельно после осмотра. Отменить или перенести запись можно в личном кабинете или по телефону.</p>
      </aside>
    </div>
  );
}
