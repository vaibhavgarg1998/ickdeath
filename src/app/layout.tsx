import type { Metadata } from "next";
import {
  Anton,
  Bebas_Neue,
  IBM_Plex_Mono,
  Inter,
  Space_Mono,
} from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const ibmPlex = IBM_Plex_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ICK DEATH — End the Bare Hand Era",
  description:
    "Tiny hygiene tabs that help you lift the toilet seat without touching it directly. Buy Seat Safe Tabs online.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#101010",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${anton.variable} ${ibmPlex.variable} ${spaceMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-white">{children}</body>
    </html>
  );
}
