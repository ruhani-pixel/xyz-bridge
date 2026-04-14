import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { Toaster } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { PWAProvider } from '@/hooks/usePWA';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#C5A059",
};

export const metadata: Metadata = {
  title: "Solid Models — WhatsApp AI Platform",
  description: "Advanced WhatsApp AI Communication Platform | Powered by Solid Models",
  manifest: "/manifest.json",
  icons: {
    icon: "/logopro.png",
    apple: "/logopro.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <PWAProvider>
          <LoadingScreen />
          <Analytics />
          <Toaster position="top-right" richColors closeButton />
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
