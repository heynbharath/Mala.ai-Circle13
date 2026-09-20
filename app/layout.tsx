import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nitya — Divine Japa Mala Sanctuary",
  description: "A breathtaking digital Japa Mala for Hare Krishna, Radha Naam, and Shiva meditation. Turn sacred Tulsi, Rudraksha, or Sphatik beads with realistic physical touch and divine temple soundscapes.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nitya",
  },
};

export const viewport: Viewport = {
  themeColor: "#070402",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-[#070402] text-[#f7eedf] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
