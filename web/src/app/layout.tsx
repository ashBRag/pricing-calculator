import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { Providers } from "@/providers/providers";
import { BackendPing } from "@/utils/backend-ping";
import "@/styles/globals.css";

const fira = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pricing Calculator",
  description: "Multi-rate pricing calculator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fira.variable} antialiased`}>
        <BackendPing />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
