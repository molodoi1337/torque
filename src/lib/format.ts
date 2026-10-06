import { CAR_CLASS_INFO } from "./constants";
import type { CarClass } from "@/db/schema";

export const rub = (n: number) => `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;

/** Цена услуги с учётом класса автомобиля, округлённая до 50 ₽ */
export function priceFor(basePrice: number, carClass: CarClass) {
  return Math.round((basePrice * CAR_CLASS_INFO[carClass].multiplier) / 50) * 50;
}

export function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  return d.slice(0, 11);
}

export function formatPhone(raw: string) {
  const d = normalizePhone(raw);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  return "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") +
    (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
}

export function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

export function bookingCode() {
  // Без похожих символов (0/O, 1/I)
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => abc[b % abc.length]).join("");
}
