import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="font-mono text-8xl font-black text-brand-500">404</div>
        <h1 className="mt-4 text-2xl font-bold text-white">Такой страницы нет</h1>
        <p className="mt-2 text-ink-400">Возможно, код заказа введён с ошибкой или ссылка устарела.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">На главную</Link>
          <Link href="/status" className="btn-secondary">Проверить статус</Link>
        </div>
      </div>
    </div>
  );
}
