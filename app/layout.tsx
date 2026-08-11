import './globals.css';
import { Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceMono = Space_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Futrdesk | B2B Invoice Automation',
  description: 'Zero-UI Rechnungsstellung via WhatsApp & Telegram.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${plusJakartaSans.variable} ${spaceMono.variable}`}>
      <body className="font-sans bg-background text-core antialiased">
        {children}
      </body>
    </html>
  );
}
