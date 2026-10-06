import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./nav";

export const metadata: Metadata = { title: { default: "Админка", template: "%s · Админка ТОРК" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <AdminNav name={session.name} />
      <div className="min-w-0">
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
