import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import * as s from "../src/db/schema";
import { CAR_CLASS_INFO, CLOSE_HOUR, FLOW, OPEN_HOUR } from "../src/lib/constants";
import { addDays, addMinutes, fromMinutes, nowLocal } from "../src/lib/time";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema: s });

// Детерминированный генератор, чтобы демо-данные были одинаковыми при каждом сиде
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

const SERVICES: (typeof s.services.$inferInsert)[] = [
  { name: "Замена масла и фильтра", category: "maintenance", basePrice: 1200, durationMin: 30, popular: true, description: "Слив старого масла, новый фильтр, проверка уровня жидкостей. Масло — ваше или наше." },
  { name: "ТО по регламенту производителя", category: "maintenance", basePrice: 4900, durationMin: 120, popular: true, description: "Работы по сервисной книжке с сохранением гарантии дилера." },
  { name: "Замена воздушного и салонного фильтров", category: "maintenance", basePrice: 800, durationMin: 30, description: "Оба фильтра за один визит. Угольный салонный — по желанию." },
  { name: "Замена свечей зажигания", category: "maintenance", basePrice: 1500, durationMin: 60, description: "Для 4-цилиндровых двигателей. V6/V8 — по согласованию." },
  { name: "Замена тормозной жидкости", category: "maintenance", basePrice: 1600, durationMin: 60, description: "Полная прокачка системы с проверкой температуры кипения." },
  { name: "Замена антифриза", category: "maintenance", basePrice: 2200, durationMin: 60, description: "Слив, промывка при необходимости, заливка и удаление воздушных пробок." },
  { name: "Компьютерная диагностика", category: "diagnostics", basePrice: 1500, durationMin: 30, popular: true, description: "Чтение и расшифровка ошибок всех блоков, отчёт с рекомендациями." },
  { name: "Диагностика ходовой части", category: "diagnostics", basePrice: 900, durationMin: 30, description: "Осмотр на подъёмнике, проверка люфтов. Бесплатно при ремонте у нас." },
  { name: "Проверка авто перед покупкой", category: "diagnostics", basePrice: 4500, durationMin: 90, popular: true, description: "Толщиномер, эндоскопия цилиндров, диагностика, тест-драйв с мастером." },
  { name: "Эндоскопия двигателя", category: "diagnostics", basePrice: 2500, durationMin: 60, description: "Осмотр стенок цилиндров через свечные отверстия, видео — вам." },
  { name: "Замена ремня ГРМ с роликами", category: "repair", basePrice: 9500, durationMin: 240, description: "Комплект ремня, ролики, помпа по необходимости. Гарантия 1 год." },
  { name: "Замена цепи ГРМ", category: "repair", basePrice: 18000, durationMin: 480, description: "Цепь, натяжители, успокоители, сальники. Гарантия 1 год." },
  { name: "Ремонт системы охлаждения", category: "repair", basePrice: 3500, durationMin: 120, description: "Замена помпы, термостата, патрубков или радиатора." },
  { name: "Замена прокладки клапанной крышки", category: "repair", basePrice: 2800, durationMin: 90, description: "Устраняем подтёки масла, очищаем двигатель от следов." },
  { name: "Замена тормозных колодок (ось)", category: "suspension", basePrice: 1400, durationMin: 60, popular: true, description: "Передние или задние, с чисткой и смазкой направляющих." },
  { name: "Замена тормозных дисков (ось)", category: "suspension", basePrice: 2400, durationMin: 90, description: "Оба диска одной оси, колодки — отдельно." },
  { name: "Замена амортизаторов (ось)", category: "suspension", basePrice: 3600, durationMin: 120, description: "Стойки или амортизаторы с опорами, после — развал-схождение." },
  { name: "Развал-схождение 3D", category: "suspension", basePrice: 2200, durationMin: 60, popular: true, description: "Стенд Hunter, распечатка параметров до и после." },
  { name: "Замена сайлентблоков рычага", category: "suspension", basePrice: 2600, durationMin: 120, description: "Запрессовка на прессе, без замены рычага целиком." },
  { name: "Сезонный шиномонтаж (4 колеса)", category: "tires", basePrice: 2400, durationMin: 60, popular: true, description: "Снятие, установка, балансировка. Радиус до R17, дальше +10%." },
  { name: "Ремонт прокола", category: "tires", basePrice: 600, durationMin: 30, description: "Грибок или жгут изнутри, проверка на герметичность." },
  { name: "Хранение шин (сезон)", category: "tires", basePrice: 3000, durationMin: 30, description: "Отапливаемый склад, мойка и пакеты включены." },
  { name: "Диагностика электрики", category: "electrical", basePrice: 1800, durationMin: 60, description: "Поиск утечки тока, проверка генератора и стартера." },
  { name: "Замена аккумулятора", category: "electrical", basePrice: 700, durationMin: 30, description: "Установка с сохранением настроек, утилизация старого." },
  { name: "Заправка кондиционера", category: "electrical", basePrice: 2900, durationMin: 60, popular: true, description: "Вакуумирование, проверка на утечки, фреон и масло по норме." },
  { name: "Установка сигнализации с автозапуском", category: "electrical", basePrice: 6500, durationMin: 240, description: "StarLine / Pandora, скрытый монтаж, гарантия на установку 2 года." },
];

const MASTERS = [
  { name: "Сергей Волков", specialization: "Двигатель и ГРМ", experience: 14 },
  { name: "Андрей Ким", specialization: "Диагностика и электрика", experience: 9 },
  { name: "Руслан Абдуллаев", specialization: "Ходовая и тормоза", experience: 11 },
  { name: "Дмитрий Орлов", specialization: "Техобслуживание", experience: 6 },
  { name: "Олег Петренко", specialization: "Шиномонтаж и развал", experience: 8 },
];

const FIRST = ["Александр", "Михаил", "Иван", "Дмитрий", "Артём", "Никита", "Елена", "Анна", "Мария", "Ольга", "Павел", "Егор", "Кирилл", "Татьяна", "Виктор", "Алексей", "Юлия", "Роман"];
const LAST_INITIAL = "АБВГДЕЖЗИКЛМНОПРСТФ";
const CARS: [string, string, s.CarClass][] = [
  ["Hyundai", "Solaris", "A"], ["Kia", "Rio", "A"], ["Volkswagen", "Polo", "A"], ["Lada", "Vesta", "A"], ["Renault", "Logan", "A"],
  ["Skoda", "Octavia", "B"], ["Toyota", "Camry", "B"], ["Kia", "K5", "B"], ["Mazda", "6", "B"], ["Haval", "Jolion", "B"], ["Chery", "Tiggo 7 Pro", "B"],
  ["BMW", "X5", "C"], ["Mercedes-Benz", "E-класс", "C"], ["Toyota", "Land Cruiser Prado", "C"], ["Audi", "Q7", "C"], ["Geely", "Monjaro", "C"], ["Lexus", "RX", "C"],
];
const PLATE_LETTERS = "АВЕКМНОРСТУХ";
const plate = () => `${pick([...PLATE_LETTERS])}${int(100, 999)}${pick([...PLATE_LETTERS])}${pick([...PLATE_LETTERS])}${pick(["77", "97", "99", "177", "197", "199", "777", "799", "50", "750"])}`;
const code = () => Array.from({ length: 6 }, () => pick([..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"])).join("");

const REVIEWS = [
  { author: "Максим Г.", car: "Kia K5", rating: 5, text: "Записался онлайн на замену колодок, приехал — машину взяли сразу. Показали старые колодки, объяснили, что ещё стоит проверить через пару тысяч км. Без навязывания." },
  { author: "Ирина С.", car: "Hyundai Creta", rating: 5, text: "Очень удобно, что статус ремонта видно по ссылке. Не надо звонить и спрашивать «ну что там». Пришло уведомление, что готово, — забрала." },
  { author: "Артур Н.", car: "BMW X3", rating: 5, text: "Проверяли машину перед покупкой. Нашли подкрашенное крыло и ошибку по АКПП, которую продавец сбросил. Сэкономили мне кучу денег." },
  { author: "Денис П.", car: "Skoda Octavia", rating: 4, text: "Делал ГРМ, всё качественно, гарантия на год. Минус звезда — пришлось подождать полчаса сверх обещанного, но извинились и сделали скидку." },
  { author: "Светлана Т.", car: "Toyota RAV4", rating: 5, text: "Переобувала резину и оставила на хранение. Чисто, быстро, есть зона ожидания с кофе. Цена как на сайте, без сюрпризов." },
  { author: "Георгий М.", car: "Lada Vesta", rating: 5, text: "Мастер Сергей нашёл причину троения, которую в двух сервисах не могли найти. Теперь только сюда." },
];

async function main() {
  console.log("Очистка таблиц…");
  for (const t of [s.statusEvents, s.bookingServices, s.bookings, s.reviews, s.services, s.masters, s.bays, s.users]) {
    await db.delete(t);
  }

  const pass = await bcrypt.hash("demo1234", 10);
  const [admin, demoClient] = await db
    .insert(s.users)
    .values([
      { email: "admin@tork.demo", passwordHash: pass, name: "Администратор", role: "admin", phone: "79990000000" },
      { email: "client@tork.demo", passwordHash: pass, name: "Алексей Смирнов", role: "client", phone: "79161234567" },
    ])
    .returning();
  void admin;

  const services = await db.insert(s.services).values(SERVICES).returning();
  const masters = await db.insert(s.masters).values(MASTERS).returning();
  const bays = await db.insert(s.bays).values([{ name: "Пост 1" }, { name: "Пост 2" }, { name: "Пост 3" }, { name: "Пост 4" }]).returning();
  await db.insert(s.reviews).values(REVIEWS);

  console.log("Генерация записей…");
  const now = nowLocal();
  const today = now.slice(0, 10);
  // Занятость постов по дням: bayId -> [start,end][]
  let created = 0;

  for (let dayOffset = -60; dayOffset <= 10; dayOffset++) {
    const date = addDays(today, dayOffset);
    const busy = new Map<number, [number, number][]>(bays.map((b) => [b.id, []]));
    // Будни загружены сильнее, будущие дни — слабее
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const base = weekday === 0 ? 4 : weekday === 6 ? 7 : 9;
    const count = dayOffset > 0 ? Math.max(1, Math.round(base * (0.7 - dayOffset * 0.06))) : base + int(-2, 3);

    for (let i = 0; i < count; i++) {
      // 1–3 услуги, чаще популярные
      const n = rnd() < 0.55 ? 1 : rnd() < 0.7 ? 2 : 3;
      const chosen = new Set<(typeof services)[number]>();
      while (chosen.size < n) chosen.add(rnd() < 0.6 ? pick(services.filter((x) => x.popular)) : pick(services));
      const items = [...chosen];
      const duration = Math.min(items.reduce((a, x) => a + x.durationMin, 0), (CLOSE_HOUR - OPEN_HOUR) * 60);

      // ищем свободный пост и время
      let placed: { bayId: number; start: number } | null = null;
      for (let attempt = 0; attempt < 12 && !placed; attempt++) {
        const start = OPEN_HOUR * 60 + int(0, Math.max(0, ((CLOSE_HOUR - OPEN_HOUR) * 60 - duration) / 30)) * 30;
        const bay = bays.find((b) => !busy.get(b.id)!.some(([a, z]) => a < start + duration && start < z));
        if (bay) placed = { bayId: bay.id, start };
      }
      if (!placed) continue;
      busy.get(placed.bayId)!.push([placed.start, placed.start + duration]);

      const [make, model, carClass] = pick(CARS);
      const startsAt = `${date}T${fromMinutes(placed.start)}`;
      const endsAt = addMinutes(startsAt, duration);

      // Статус по времени относительно «сейчас»
      let status: s.Status;
      if (endsAt < now) status = rnd() < 0.07 ? "cancelled" : "done";
      else if (startsAt <= now) status = rnd() < 0.5 ? "in_progress" : "ready";
      else status = dayOffset <= 2 ? (rnd() < 0.7 ? "confirmed" : "new") : rnd() < 0.4 ? "confirmed" : "new";

      const isDemoClient = rnd() < 0.04;
      const prices = items.map((x) => Math.round((x.basePrice * CAR_CLASS_INFO[carClass].multiplier) / 50) * 50);
      const createdAt = `${addDays(date, -int(0, 6))}T${fromMinutes(int(8 * 60, 22 * 60))}:00`;

      const [b] = await db
        .insert(s.bookings)
        .values({
          code: code(),
          userId: isDemoClient ? demoClient.id : null,
          clientName: isDemoClient ? demoClient.name : `${pick(FIRST)} ${pick([...LAST_INITIAL])}.`,
          phone: isDemoClient ? demoClient.phone! : `79${int(10, 99)}${int(1000000, 9999999)}`,
          carMake: isDemoClient ? "Toyota" : make,
          carModel: isDemoClient ? "Camry" : model,
          carYear: int(2012, 2025),
          carClass: isDemoClient ? "B" : carClass,
          plate: plate(),
          startsAt,
          durationMin: duration,
          bayId: placed.bayId,
          masterId: status === "new" ? null : pick(masters).id,
          status,
          totalPrice: prices.reduce((a, x) => a + x, 0),
          comment: rnd() < 0.15 ? pick(["Стук справа при повороте", "Горит check engine", "Нужен отчёт для страховой", "Позвоните перед началом работ", "Своё масло привезу"]) : null,
          createdAt,
        })
        .returning({ id: s.bookings.id });

      await db.insert(s.bookingServices).values(items.map((x, k) => ({ bookingId: b.id, serviceId: x.id, price: prices[k] })));

      // История статусов
      const events: (typeof s.statusEvents.$inferInsert)[] = [{ bookingId: b.id, status: "new", createdAt }];
      const path = status === "cancelled" ? ["cancelled"] : FLOW.slice(1, FLOW.indexOf(status) + 1);
      let t = startsAt;
      for (const st of path) {
        const at = st === "confirmed" ? `${createdAt.slice(0, 16)}` : t;
        events.push({ bookingId: b.id, status: st as s.Status, createdAt: `${addMinutes(at.slice(0, 16), st === "confirmed" ? 15 : 0)}:00` });
        if (st === "in_progress") t = addMinutes(startsAt, duration);
        if (st === "ready") t = addMinutes(t, int(30, 240));
      }
      await db.insert(s.statusEvents).values(events);
      created++;
    }
  }

  console.log(`Готово: ${services.length} услуг, ${masters.length} мастеров, ${created} записей.`);
  console.log("Демо-доступ: admin@tork.demo / demo1234, client@tork.demo / demo1234");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
