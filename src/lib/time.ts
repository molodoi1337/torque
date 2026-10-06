// Все даты в базе — «время мастерской» (Москва) без часового пояса.
// Сервер (например, Vercel) работает в UTC, поэтому «сейчас» считаем явно.
export const TZ = "Europe/Moscow";

const pad = (n: number) => String(n).padStart(2, "0");

export function nowLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export const todayLocal = () => nowLocal().slice(0, 10);

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMinutes(dateTime: string, minutes: number): string {
  const d = new Date(`${dateTime}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16);
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", weekday: "short" }) {
  return new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString("ru-RU", { ...opts, timeZone: "UTC" });
}

export function formatDateTime(dateTime: string) {
  return `${formatDate(dateTime, { day: "numeric", month: "long" })}, ${dateTime.slice(11, 16)}`;
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h && `${h} ч`, m && `${m} мин`].filter(Boolean).join(" ") || "0 мин";
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
