"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarRange, ClipboardList, ExternalLink, KanbanSquare, LayoutDashboard, LogOut, Menu, Users, Wrench, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/logo";
import { logout } from "@/app/actions/auth";

const ITEMS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/board", label: "Доска заказов", icon: KanbanSquare },
  { href: "/admin/schedule", label: "Расписание постов", icon: CalendarRange },
  { href: "/admin/bookings", label: "Все записи", icon: ClipboardList },
  { href: "/admin/clients", label: "Клиенты", icon: Users },
  { href: "/admin/services", label: "Услуги и мастера", icon: Wrench },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  // Меню привязано к странице, на которой его открыли: при переходе оно закрывается само
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (v: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const links = (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            isActive(href) ? "bg-ink-800 text-white" : "text-ink-400 hover:bg-ink-850 hover:text-white",
          )}
        >
          <Icon className={clsx("size-4", isActive(href) && "text-brand-500")} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-ink-800 pt-4">
      <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 hover:bg-ink-850 hover:text-white">
        <ExternalLink className="size-4" /> Открыть сайт
      </Link>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 hover:bg-ink-850 hover:text-white">
          <LogOut className="size-4" /> Выйти ({name})
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Мобильная шапка */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-800 bg-ink-950 px-4 lg:hidden">
        <Logo href="/admin" suffix="admin" />
        <button onClick={() => setOpen((v) => !v)} className="btn-ghost p-2" aria-label="Меню">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div className={clsx("fixed inset-x-0 top-14 bottom-0 z-40 flex flex-col justify-between gap-6 overflow-y-auto bg-ink-950 p-4 lg:hidden", open ? "flex" : "hidden")}>
        {links}
        {footer}
      </div>

      {/* Десктопный сайдбар */}
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r border-ink-800 bg-ink-900/40 p-4 lg:flex">
        <div className="space-y-8">
          <div className="px-2 pt-2"><Logo href="/admin" suffix="admin" /></div>
          {links}
        </div>
        {footer}
      </aside>
    </>
  );
}
