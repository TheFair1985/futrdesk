export const metadata = {
  title: 'Futrdesk | B2B Invoice Automation',
  description: 'Zero-UI Rechnungsstellung via WhatsApp & Telegram.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
