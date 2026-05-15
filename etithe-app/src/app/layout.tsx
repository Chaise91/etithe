import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eTithe",
  description: "Donation and tithe platform for organizations and parishioners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
