import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Buddy — AI Resume Optimizer",
  description: "Local-first AI-powered resume optimizer. Tailor your resume to any job description, get ATS scores, and generate cover letters — all privately on your machine.",
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
