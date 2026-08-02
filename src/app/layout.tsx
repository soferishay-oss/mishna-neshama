import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "משנה-נשמה | לימוד משניות שיתופי",
  description: "מערכת דיגיטלית לניהול שיתופי של לימוד משניות לעילוי נשמת",
  openGraph: {
    title: "משנה-נשמה | לימוד משניות שיתופי",
    description: "מערכת דיגיטלית לניהול שיתופי של לימוד משניות לעילוי נשמת",
    siteName: "משנה-נשמה",
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    locale: 'he_IL',
    type: 'website',
  }
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
        <AuthProvider>
          {children}
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
