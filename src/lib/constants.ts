import type { CarClass, Category, Status } from "@/db/schema";

export const COMPANY = {
  name: "ТОРК",
  full: "Автосервис «ТОРК»",
  phone: "+7 (495) 120-45-45",
  phoneHref: "tel:+74951204545",
  email: "service@tork-auto.ru",
  address: "Москва, ул. Моторная, 7",
  metro: "м. Нагатинская, 5 минут пешком",
  hours: "Ежедневно 9:00–21:00",
};

// Рабочий день мастерской
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 21;
export const SLOT_STEP_MIN = 30;
export const BOOKING_DAYS_AHEAD = 21;

export const CATEGORY_LABEL: Record<Category, string> = {
  maintenance: "Техобслуживание",
  diagnostics: "Диагностика",
  repair: "Ремонт двигателя",
  suspension: "Ходовая и тормоза",
  tires: "Шиномонтаж",
  electrical: "Электрика",
};

export const CAR_CLASS_INFO: Record<CarClass, { label: string; hint: string; multiplier: number }> = {
  A: { label: "Легковой", hint: "Solaris, Rio, Polo, Logan", multiplier: 1 },
  B: { label: "Средний / бизнес", hint: "Camry, Octavia, Optima, Mazda 6", multiplier: 1.25 },
  C: { label: "Кроссовер / премиум", hint: "BMW, Mercedes, Audi, Land Cruiser", multiplier: 1.5 },
};

export const STATUS_INFO: Record<Status, { label: string; color: string; client: string }> = {
  new: { label: "Новая", color: "bg-sky-500/15 text-sky-400 ring-sky-500/30", client: "Заявка получена" },
  confirmed: { label: "Подтверждена", color: "bg-violet-500/15 text-violet-400 ring-violet-500/30", client: "Запись подтверждена" },
  in_progress: { label: "В работе", color: "bg-amber-500/15 text-amber-400 ring-amber-500/30", client: "Автомобиль в работе" },
  ready: { label: "Готово", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30", client: "Можно забирать" },
  done: { label: "Выдано", color: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30", client: "Автомобиль выдан" },
  cancelled: { label: "Отменена", color: "bg-red-500/15 text-red-400 ring-red-500/30", client: "Запись отменена" },
};

export const FLOW: Status[] = ["new", "confirmed", "in_progress", "ready", "done"];

export const CAR_MAKES = [
  "Audi", "BMW", "Chery", "Chevrolet", "Exeed", "Ford", "Geely", "Haval", "Honda", "Hyundai", "Kia",
  "Lada", "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", "Mitsubishi", "Nissan", "Omoda", "Porsche",
  "Renault", "Skoda", "Subaru", "Tank", "Toyota", "Volkswagen", "Volvo", "Другая",
];
