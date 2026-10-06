import Image from "next/image";
import Link from "next/link";
import { asc, count, eq, desc, sql } from "drizzle-orm";
import {
  ArrowRight, BatteryCharging, CalendarCheck, CircleGauge, Clock, Cog, Disc3, MapPin, MessageSquareText,
  Phone, ScanSearch, ShieldCheck, Smartphone, Star, Wrench, Zap,
} from "lucide-react";
import { db, bookings, reviews, services } from "@/db";
import { CATEGORY_LABEL, COMPANY } from "@/lib/constants";
import { rub } from "@/lib/format";
import { QuickCalculator } from "@/components/quick-calculator";
import type { Category } from "@/db/schema";

export const dynamic = "force-dynamic";

const CATEGORY_ICON: Record<Category, React.ElementType> = {
  maintenance: Cog,
  diagnostics: ScanSearch,
  repair: Wrench,
  suspension: Disc3,
  tires: CircleGauge,
  electrical: BatteryCharging,
};

const STEPS = [
  { icon: CalendarCheck, title: "Запись за минуту", text: "Выбираете услуги и свободное время онлайн. Цена фиксируется сразу." },
  { icon: ScanSearch, title: "Осмотр и согласование", text: "Мастер проверяет авто. Доп. работы — только после вашего «да»." },
  { icon: Smartphone, title: "Статус онлайн", text: "По ссылке видно, что происходит с машиной: принята, в работе, готова." },
  { icon: ShieldCheck, title: "Гарантия до 12 мес.", text: "Выдаём заказ-наряд, старые запчасти и гарантию на работы." },
];

const FAQ = [
  ["Можно приехать со своими запчастями?", "Да. На работы со своими запчастями гарантия сохраняется, на сами детали — нет. Масло и фильтры тоже можно привезти."],
  ["Сохранится ли гарантия дилера?", "Да. Мы проводим ТО строго по регламенту производителя, используем допущенные материалы и ставим отметку в сервисную книжку."],
  ["Сколько ждать, если я записался?", "Нисколько — пост бронируется под вас. Если машина задерживается в работе, мы предупредим заранее."],
  ["Есть ли зона ожидания?", "Есть: кофе, Wi-Fi, рабочее место и окно в цех — можно наблюдать за работой."],
  ["Как оплатить?", "Картой, по СБП или наличными после выдачи автомобиля. Для юрлиц — по счёту, работаем с НДС."],
];

export default async function HomePage() {
  const [cats, popular, revs, [{ done }]] = await Promise.all([
    db
      .select({ category: services.category, from: sql<number>`min(${services.basePrice})`, n: count() })
      .from(services)
      .where(eq(services.active, true))
      .groupBy(services.category),
    db.select().from(services).where(eq(services.popular, true)).orderBy(asc(services.basePrice)).limit(8),
    db.select().from(reviews).orderBy(desc(reviews.rating)).limit(6),
    db.select({ done: count() }).from(bookings).where(eq(bookings.status, "done")),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-20 lg:pt-20">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="container-x relative grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow"><span className="size-1.5 rounded-full bg-brand-500" /> Автосервис в Москве · с 2016 года</span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
              Ремонт без <span className="text-brand-500">сюрпризов</span> в&nbsp;счёте
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-300">
              Техобслуживание, диагностика и ремонт любых марок. Цена известна до визита, а статус ремонта — у вас в телефоне.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking" className="btn-primary px-7 py-4 text-base">Записаться онлайн <ArrowRight className="size-4" /></Link>
              <Link href="/services" className="btn-secondary px-7 py-4 text-base">Цены на услуги</Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-800 pt-8">
              <div><dt className="text-xs text-ink-400">Выполнено заказов</dt><dd className="mt-1 whitespace-nowrap text-2xl font-bold text-white">{(12400 + done).toLocaleString("ru-RU")}</dd></div>
              <div><dt className="text-xs text-ink-400">Рейтинг на Картах</dt><dd className="mt-1 flex items-center gap-1 text-2xl font-bold text-white">4.9 <Star className="size-5 fill-brand-500 text-brand-500" /></dd></div>
              <div><dt className="text-xs text-ink-400">Гарантия</dt><dd className="mt-1 text-2xl font-bold text-white">12 мес.</dd></div>
            </dl>
          </div>

          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-ink-800 sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image src="/img/hero.jpg" alt="Мастер работает с двигателем" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent" />
            </div>
            {/* Карточка-демо статуса */}
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl bg-ink-900/95 p-4 shadow-2xl ring-1 ring-ink-700 sm:left-auto sm:-left-8 sm:right-auto sm:w-80">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span className="font-mono">Заказ #K7M2QX</span>
                <span className="badge bg-amber-500/15 text-amber-400 ring-amber-500/30"><span className="size-1.5 animate-pulse rounded-full bg-current" />В работе</span>
              </div>
              <div className="mt-3 text-sm font-semibold text-white">Skoda Octavia · замена ГРМ</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-800"><div className="h-full w-3/5 rounded-full bg-brand-500" /></div>
              <div className="mt-2 flex justify-between text-xs text-ink-400"><span>Мастер: Сергей В.</span><span>Готово к 17:30</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ПРЕИМУЩЕСТВА-ЛЕНТА */}
      <section className="border-y border-ink-800 bg-ink-900/50">
        <div className="container-x grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {[
            [Zap, "Диагностика за 30 минут"],
            [ShieldCheck, "Гарантия на работы"],
            [Clock, "Без очередей — по записи"],
            [MessageSquareText, "Фото и видео дефектов"],
          ].map(([Icon, text], i) => {
            const I = Icon as React.ElementType;
            return (
              <div key={i} className="flex items-center gap-3 text-sm font-medium text-ink-100">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-500"><I className="size-5" /></span>
                {text as string}
              </div>
            );
          })}
        </div>
      </section>

      {/* КАТЕГОРИИ */}
      <section className="container-x py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Услуги</span>
            <h2 className="h-section mt-3">Всё для машины в одном месте</h2>
          </div>
          <Link href="/services" className="btn-secondary self-start md:self-auto">Все услуги и цены <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => {
            const Icon = CATEGORY_ICON[c.category];
            return (
              <Link
                key={c.category}
                href={`/services?category=${c.category}`}
                className="card group relative overflow-hidden p-6 transition hover:-translate-y-1 hover:ring-brand-500/50"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-ink-800 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <ArrowRight className="size-5 -rotate-45 text-ink-600 transition group-hover:rotate-0 group-hover:text-brand-500" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-white">{CATEGORY_LABEL[c.category]}</h3>
                <p className="mt-1 text-sm text-ink-400">{c.n} услуг · от {rub(c.from)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* КАЛЬКУЛЯТОР */}
      <section className="border-y border-ink-800 bg-ink-900/40 py-20 lg:py-28">
        <div className="container-x">
          <div className="max-w-2xl">
            <span className="eyebrow">Калькулятор</span>
            <h2 className="h-section mt-3">Посчитайте стоимость до визита</h2>
            <p className="mt-4 text-ink-300">Цены зависят только от класса автомобиля. Никаких «а это уже отдельно».</p>
          </div>
          <div className="mt-12">
            <QuickCalculator services={popular.map(({ id, name, basePrice, durationMin }) => ({ id, name, basePrice, durationMin }))} />
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕМ */}
      <section id="how" className="container-x scroll-mt-24 py-20 lg:py-28">
        <span className="eyebrow">Процесс</span>
        <h2 className="h-section mt-3 max-w-2xl">Как проходит ремонт в ТОРК</h2>
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-4 font-mono text-5xl font-bold text-ink-800">0{i + 1}</span>
              <s.icon className="size-7 text-brand-500" />
              <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ПОЧЕМУ МЫ */}
      <section className="container-x pb-20 lg:pb-28">
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <div className="relative min-h-72 overflow-hidden rounded-3xl lg:row-span-2">
            <Image src="/img/workshop.jpg" alt="Инструмент в цехе" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30" />
            <div className="absolute bottom-0 p-6">
              <div className="text-4xl font-black text-white">4 поста</div>
              <p className="mt-1 text-sm text-ink-300">подъёмники, стенд развала Hunter, шиномонтаж и диагностика в одном цехе</p>
            </div>
          </div>
          <div className="card p-8 lg:col-span-2">
            <h3 className="text-2xl font-bold text-white">Показываем, а не рассказываем</h3>
            <p className="mt-3 max-w-xl text-ink-300">
              Найденные дефекты фотографируем и отправляем вам до начала работ. Старые детали отдаём вместе с машиной — чтобы было видно, за что вы платите.
            </p>
          </div>
          <div className="relative min-h-56 overflow-hidden rounded-3xl">
            <Image src="/img/wheel.jpg" alt="Шиномонтаж" fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90" />
            <div className="absolute bottom-0 p-6 text-lg font-semibold text-white">Шиномонтаж без очереди в сезон</div>
          </div>
          <div className="card flex flex-col justify-between bg-brand-500 p-8 ring-brand-500">
            <div className="text-5xl font-black text-white">0 ₽</div>
            <p className="mt-4 text-white/90">диагностика ходовой, если ремонт делаете у нас. Осмотр на подъёмнике — в подарок.</p>
          </div>
        </div>
      </section>

      {/* ОТЗЫВЫ */}
      <section id="reviews" className="scroll-mt-24 border-y border-ink-800 bg-ink-900/40 py-20 lg:py-28">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="eyebrow">Отзывы</span>
              <h2 className="h-section mt-3">Что говорят клиенты</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-ink-300">
              <span className="text-3xl font-bold text-white">4.9</span>
              <span>из 5 · 1 240 оценок<br />на Яндекс Картах</span>
            </div>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {revs.map((r) => (
              <figure key={r.id} className="card flex flex-col p-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`size-4 ${i < r.rating ? "fill-brand-500 text-brand-500" : "text-ink-700"}`} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-300">{r.text}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-800 pt-4">
                  <span className="grid size-10 place-items-center rounded-full bg-ink-800 font-semibold text-white">{r.author[0]}</span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{r.author}</span>
                    <span className="block text-xs text-ink-400">{r.car}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.5fr] lg:py-28">
        <div>
          <span className="eyebrow">Вопросы</span>
          <h2 className="h-section mt-3">Частые вопросы</h2>
          <p className="mt-4 text-ink-300">Не нашли ответ? Позвоните — мастер-приёмщик ответит на любой вопрос.</p>
          <a href={COMPANY.phoneHref} className="btn-secondary mt-6"><Phone className="size-4" />{COMPANY.phone}</a>
        </div>
        <div className="divide-y divide-ink-800 border-y border-ink-800">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-800 text-brand-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 pr-12 text-sm leading-relaxed text-ink-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contacts" className="container-x scroll-mt-24 pb-20 lg:pb-28">
        <div className="card grid overflow-hidden lg:grid-cols-2">
          <div className="space-y-6 p-8 sm:p-12">
            <span className="eyebrow">Контакты</span>
            <h2 className="h-section">Приезжайте</h2>
            <ul className="space-y-4 text-ink-200">
              <li className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-brand-500" /><span>{COMPANY.address}<br /><span className="text-sm text-ink-400">{COMPANY.metro}</span></span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-brand-500" />{COMPANY.hours}</li>
              <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-brand-500" /><a href={COMPANY.phoneHref} className="hover:text-white">{COMPANY.phone}</a></li>
            </ul>
            <Link href="/booking" className="btn-primary">Записаться онлайн <ArrowRight className="size-4" /></Link>
          </div>
          <div className="relative min-h-80">
            <iframe
              title="Карта проезда"
              src="https://www.openstreetmap.org/export/embed.html?bbox=37.605%2C55.676%2C37.645%2C55.690&layer=mapnik&marker=55.683%2C37.625"
              className="absolute inset-0 size-full grayscale invert-[.9] hue-rotate-180"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
