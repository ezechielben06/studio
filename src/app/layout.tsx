import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { ThemeHandler } from '@/components/theme-handler';

export const metadata: Metadata = {
  title: 'Libre Chat',
  description: 'Assistant IA professionnel moderne et ouvert',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-hidden selection:bg-primary/20">
        <FirebaseClientProvider>
          <ThemeHandler />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}