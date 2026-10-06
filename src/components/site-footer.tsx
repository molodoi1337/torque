import Link from "next/link";
import { Logo } from "./logo";
import { COMPANY } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-ink-400">Независимый автосервис с 2016 года. Честные цены, гарантия на работы до 12 месяцев.</p>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-500">Клиентам</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><Link href="/services" className="hover:text-white">Услуги и цены</Link></li>
            <li><Link href="/booking" className="hover:text-white">Онлайн-запись</Link></li>
            <li><Link href="/status" className="hover:text-white">Статус ремонта</Link></li>
            <li><Link href="/account" className="hover:text-white">Личный кабинет</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-500">Контакты</h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li><a href={COMPANY.phoneHref} className="hover:text-white">{COMPANY.phone}</a></li>
            <li><a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a></li>
            <li>{COMPANY.address}</li>
            <li>{COMPANY.hours}</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-500">Реквизиты</h4>
          <p className="text-sm text-ink-400">ООО «ТОРК Сервис»<br />ИНН 7700000000<br />ОГРН 1167700000000</p>
        </div>
      </div>
      <div className="border-t border-ink-800">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} ТОРК. Все цены указаны с учётом НДС.</span>
          <span>Демо-проект для портфолио · компания вымышленная</span>
        </div>
      </div>
    </footer>
  );
}
