import type { Metadata, Viewport } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "ТОРК — автосервис в Москве с онлайн-записью", template: "%s · ТОРК автосервис" },
  description:
    "Техобслуживание, диагностика, ремонт двигателя и ходовой, шиномонтаж. Фиксированные цены, онлайн-запись и отслеживание статуса ремонта.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "ТОРК автосервис" },
};

export const viewport: Viewport = { themeColor: "#0b0c0e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
