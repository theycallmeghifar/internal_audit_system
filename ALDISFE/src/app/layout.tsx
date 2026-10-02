import type { Metadata } from "next";
import "./globals.css";
import TemplateScripts from "../components/layouts/TemplateScripts";

export const metadata: Metadata = {
  title: {
    default: "ALDIS",
    template: "ALDIS | %s",
  },
  description: "Internal Audit System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="/assets/css/base.min.css" />
        <link rel="stylesheet" href="/assets/css/select2.min.css" />
      </head>

      <body>
        {children}
        <TemplateScripts />
      </body>
    </html>
  );
}
