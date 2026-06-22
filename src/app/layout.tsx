import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "משנה-נשמה | לימוד משניות שיתופי",
  description: "מערכת דיגיטלית לניהול שיתופי של לימוד משניות לעילוי נשמת",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f8fafc", // slate-50
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
