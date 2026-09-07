import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acadule",
  description: "Academic timetable management for colleges and coaching institutes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
