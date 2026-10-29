import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Applikator - AI Career Application Workspace",
  description: "A local-first AI workspace for tailoring resumes, tracking applications, and preparing stronger job applications privately on your machine.",
  icons: {
    icon: "/applikator-icon.svg",
    shortcut: "/applikator-icon.svg",
    apple: "/applikator-icon.svg",
  },
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
