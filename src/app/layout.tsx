import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poker API Debug",
  description: "A Poker API debug tool built with Next.js 16 and Tailwind CSS v4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-gray-200">
        <Navbar />
        <div className="min-h-screen pt-2">{children}</div>
      </body>
    </html>
  );
}
