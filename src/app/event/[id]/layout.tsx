import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  let title = "משנה-נשמה | לימוד משניות שיתופי";
  let description = "מערכת דיגיטלית לניהול שיתופי של לימוד משניות לעילוי נשמת";

  try {
    const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    if (dbUrl) {
      const res = await fetch(`${dbUrl}/events/${id}.json`, { next: { revalidate: 60 } });
      const event = await res.json();
      if (event && event.deceasedName) {
        const deceasedTitle = event.deceasedTitle ? ` ${event.deceasedTitle}` : ' ז"ל';
        title = `משנה-נשמה לעילוי נשמת ${event.deceasedName}${deceasedTitle}`;
        const targetDate = event.targetDateHebrew || event.shloshimDateHebrew || '';
        description = `הצטרפו ללימוד משניות משותף לעילוי נשמת ${event.deceasedName}${deceasedTitle}${targetDate ? ` (עד ${targetDate})` : ''}. בואו לקחת מסכת!`;
      }
    }
  } catch (e) {
    // fallback to defaults if fetch fails
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "משנה-נשמה",
      images: [{ url: '/icon-512.png', width: 512, height: 512 }],
      locale: 'he_IL',
      type: 'website',
    }
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
