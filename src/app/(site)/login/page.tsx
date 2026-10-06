import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";
import { demoLogin } from "@/app/actions/auth";
import { ShieldCheck, User } from "lucide-react";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-white">Вход в кабинет</h1>
        <p className="mt-2 text-ink-400">История визитов, статусы ремонта и быстрая запись.</p>

        <div className="card mt-8 p-6 sm:p-8">
          <LoginForm next={typeof next === "string" ? next : ""} />
          <p className="mt-6 text-center text-sm text-ink-400">
            Нет аккаунта? <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300">Зарегистрироваться</Link>
          </p>
        </div>

        {/* Демо-доступ для проверяющих портфолио */}
        <div className="mt-6 rounded-2xl border border-dashed border-ink-700 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">Демо-доступ</div>
          <p className="mt-1 text-sm text-ink-500">Войдите одной кнопкой, чтобы посмотреть функциональность.</p>
          <form action={demoLogin} className="mt-4 grid gap-2 sm:grid-cols-2">
            <button name="role" value="admin" className="btn-secondary"><ShieldCheck className="size-4 text-brand-500" />Администратор</button>
            <button name="role" value="client" className="btn-secondary"><User className="size-4 text-brand-500" />Клиент</button>
          </form>
        </div>
      </div>
    </div>
  );
}
