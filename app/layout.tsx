import '@/styles/globals.css';
import AppShell from '@/components/AppShell';

export const metadata = { title: 'Afrigini App' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
