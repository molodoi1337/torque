import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, services, users } from "@/db";
import { CAR_CLASSES, type CarClass } from "@/db/enums";
import { getSession } from "@/lib/auth";
import { BOOKING_DAYS_AHEAD } from "@/lib/constants";
import { addDays, todayLocal } from "@/lib/time";
import { BookingWizard } from "./wizard";

export const metadata: Metadata = { title: "Онлайн-запись" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }: PageProps<"/booking">) {
  const sp = await searchParams;
  const session = await getSession();
  const [list, me] = await Promise.all([
    db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.category), asc(services.basePrice)),
    session ? db.query.users.findFirst({ where: eq(users.id, session.userId) }) : null,
  ]);

  const ids = typeof sp.services === "string" ? sp.services.split(",").map(Number).filter((id) => list.some((s) => s.id === id)) : [];
  const carClass = CAR_CLASSES.includes(sp.class as CarClass) ? (sp.class as CarClass) : "A";
  const today = todayLocal();
  const days = Array.from({ length: BOOKING_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));

  return (
    <div className="container-x py-10 lg:py-14">
      <span className="eyebrow">Онлайн-запись</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Запись в сервис</h1>
      <p className="mt-3 text-ink-300">4 шага, около минуты. Пост бронируется за вами сразу.</p>
      <BookingWizard
        services={list.map(({ id, name, category, basePrice, durationMin, popular }) => ({ id, name, category, basePrice, durationMin, popular }))}
        initialIds={ids}
        initialClass={carClass}
        days={days}
        user={me ? { name: me.name, phone: me.phone ?? "", email: me.email } : null}
      />
    </div>
  );
}
