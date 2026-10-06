import Link from "next/link";

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="ТОРК — на главную">
      <svg viewBox="0 0 32 32" className="size-8 text-brand-500 transition group-hover:rotate-45 duration-500" aria-hidden>
        <path
          fill="currentColor"
          d="M13.6 2h4.8l.8 3.6a11 11 0 0 1 2.9 1.2l3.1-2 3.4 3.4-2 3.1c.5.9.9 1.9 1.2 2.9l3.6.8v4.8l-3.6.8a11 11 0 0 1-1.2 2.9l2 3.1-3.4 3.4-3.1-2c-.9.5-1.9.9-2.9 1.2l-.8 3.6h-4.8l-.8-3.6a11 11 0 0 1-2.9-1.2l-3.1 2-3.4-3.4 2-3.1a11 11 0 0 1-1.2-2.9L2 18.4v-4.8l3.6-.8c.3-1 .7-2 1.2-2.9l-2-3.1 3.4-3.4 3.1 2c.9-.5 1.9-.9 2.9-1.2zM16 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
        />
      </svg>
      <span className="text-xl font-black tracking-tight text-white">
        ТОРК{suffix && <span className="ml-2 text-xs font-medium uppercase tracking-widest text-ink-400">{suffix}</span>}
      </span>
    </Link>
  );
}
