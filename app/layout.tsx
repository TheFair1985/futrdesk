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
      <body className="font-sans bg-background text-core antialiased relative min-h-screen">
        {/* Aceternity Dot Grid Background */}
        <div className="absolute inset-0 z-0 h-full w-full bg-background bg-[radial-gradient(#bfc0c0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
        
        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
