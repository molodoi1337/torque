import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

export const metadata: Metadata = { title: "Статус ремонта" };

async function lookup(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  redirect(code ? `/status/${code}` : "/status");
}

export default function StatusLookupPage() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-16">
      <div className="w-full max-w-md text-center">
        <span className="eyebrow">Онлайн-статус</span>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Где моя машина?</h1>
        <p className="mt-3 text-ink-300">Введите код заказа из SMS или письма — покажем, на каком этапе ремонт.</p>
        <form action={lookup} className="mt-8 flex gap-2">
          <input
            name="code"
            required
            maxLength={8}
            placeholder="K7M2QX"
            className="input text-center font-mono text-lg uppercase tracking-[0.3em]"
            aria-label="Код заказа"
          />
          <button className="btn-primary px-4" aria-label="Найти"><Search className="size-5" /></button>
        </form>
      </div>
    </div>
  );
}
