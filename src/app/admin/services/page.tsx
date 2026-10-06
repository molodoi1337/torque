import { asc } from "drizzle-orm";
import { db, masters, services } from "@/db";
import { ServicesTable, MastersList } from "./client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Услуги и мастера" };

export default async function AdminServicesPage() {
  const [list, team] = await Promise.all([
    db.select().from(services).orderBy(asc(services.category), asc(services.name)),
    db.select().from(masters).orderBy(asc(masters.name)),
  ]);
  return (
    <div className="space-y-10">
      <ServicesTable services={list} />
      <MastersList masters={team} />
    </div>
  );
}
