import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: "GnoBounty | Dev Network",
  description: "Decentralized Task Force on Gno.land",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceMono.className} bg-[#050510] text-blue-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-100`}>
        {children}
      </body>
    </html>
  );
}
