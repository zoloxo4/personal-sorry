import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ek Baar Sun Le… ❤️",
  description: "A heartfelt apology, made with love.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hi"><body>{children}</body></html>;
}
