import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Stricli-Kit Docs",
    default: "Stricli-Kit Docs",
  },
  description:
    "Documentation for Stricli-Kit - a toolkit for building file-based CLIs with Stricli",
  metadataBase: new URL("https://stricli-kit.macalinao.dev"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
