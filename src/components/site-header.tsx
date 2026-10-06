"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, User, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./logo";
import { COMPANY } from "@/lib/constants";
import type { Session } from "@/lib/auth-edge";

const NAV = [
  { href: "/services", label: "Услуги и цены" },
  { href: "/#how", label: "Как мы работаем" },
  { href: "/#reviews", label: "Отзывы" },
  { href: "/status", label: "Статус ремонта" },
  { href: "/#contacts", label: "Контакты" },
];

export function SiteHeader({ session }: { session: Session | null }) {
    const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Меню привязано к странице, на которой его открыли: при переходе оно закрывается само
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (v: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const accountHref = session ? (session.role === "admin" ? "/admin" : "/account") : "/login";

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-colors",
        scrolled || open ? "bg-ink-950/95 border-b border-ink-800" : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-6 lg:h-20">
        <Logo />
        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition hover:text-white",
                pathname === n.href ? "text-white" : "text-ink-300",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href={COMPANY.phoneHref} className="hidden items-center gap-2 whitespace-nowrap text-sm font-semibold text-white xl:flex">
            <Phone className="size-4 text-brand-500" />
            {COMPANY.phone}
          </a>
          <Link href={accountHref} className="btn-ghost btn-sm" aria-label="Личный кабинет">
            <User className="size-4" />
            {session ? session.name.split(" ")[0] : "Войти"}
          </Link>
          <Link href="/booking" className="btn-primary">Записаться</Link>
        </div>
        <button className="btn-ghost -mr-2 p-2 xl:hidden" onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Мобильное меню — отдельный fixed-слой от низа шапки до низа экрана */}
      <div
        className={clsx(
          "fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-ink-950 transition lg:top-20 xl:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav className="container-x flex flex-col gap-1 py-6">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-xl px-4 py-4 text-lg font-semibold text-white hover:bg-ink-900">
              {n.label}
            </Link>
          ))}
          <Link href={accountHref} className="rounded-xl px-4 py-4 text-lg font-semibold text-white hover:bg-ink-900">
            {session ? "Личный кабинет" : "Войти"}
          </Link>
          <div className="mt-6 grid gap-3">
            <Link href="/booking" className="btn-primary py-4 text-base">Записаться онлайн</Link>
            <a href={COMPANY.phoneHref} className="btn-secondary py-4 text-base">
              <Phone className="size-4" /> {COMPANY.phone}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
