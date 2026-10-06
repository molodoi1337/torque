import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, services } from "@/db";
import { ServicesCatalog } from "./catalog";
import { CATEGORIES, type Category } from "@/db/schema";

export const metadata: Metadata = {
  title: "Услуги и цены",
  description: "Фиксированные цены на техобслуживание, диагностику, ремонт двигателя и ходовой, шиномонтаж и электрику.",
};
export const dynamic = "force-dynamic";

export default async function ServicesPage({ searchParams }: PageProps<"/services">) {
  const { category } = await searchParams;
  const list = await db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.category), asc(services.basePrice));
  const initial = CATEGORIES.includes(category as Category) ? (category as Category) : "all";

  return (
    <div className="container-x py-12 lg:py-16">
      <span className="eyebrow">Прайс-лист</span>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Услуги и цены</h1>
      <p className="mt-4 max-w-2xl text-ink-300">
        Цена указана за работу и зависит от класса автомобиля. Запчасти подбираем под ваш бюджет: оригинал или проверенные аналоги.
      </p>
      <ServicesCatalog services={list} initialCategory={initial} />
    </div>
  );
}
