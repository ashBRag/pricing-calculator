import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { Providers } from "@/providers/providers";
import "@/styles/globals.css";

const fira = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "App",
  description: "App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fira.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
