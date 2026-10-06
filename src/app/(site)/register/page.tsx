"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { register } from "@/app/actions/auth";
import { formatPhone } from "@/lib/format";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  const [phone, setPhone] = useState("");
  const err = (k: string) => state?.fields?.[k] && <p className="mt-1.5 text-xs font-medium text-red-400">{state.fields[k]}</p>;

  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-white">Регистрация</h1>
        <p className="mt-2 text-ink-400">Записи по вашему телефону появятся в кабинете автоматически.</p>
        <form action={action} className="card mt-8 space-y-4 p-6 sm:p-8">
          <div>
            <label className="label" htmlFor="name">Имя</label>
            <input id="name" name="name" required autoComplete="name" className="input" />
            {err("name")}
          </div>
          <div>
            <label className="label" htmlFor="phone">Телефон</label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" className="input font-mono" placeholder="+7 (___) ___-__-__"
              value={phone} onChange={(e) => setPhone(e.target.value ? formatPhone(e.target.value) : "")} />
            {err("phone")}
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
            {err("email")}
          </div>
          <div>
            <label className="label" htmlFor="password">Пароль</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
            {err("password")}
          </div>
          <button disabled={pending} className="btn-primary w-full py-3.5">
            {pending && <Loader2 className="size-4 animate-spin" />} Создать аккаунт
          </button>
          <p className="text-center text-sm text-ink-400">
            Уже есть аккаунт? <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">Войти</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
