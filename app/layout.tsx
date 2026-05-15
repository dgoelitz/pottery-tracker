import type { ReactNode } from "react";
import "./globals.css";
import { SWRegistrar } from "./SWRegistrar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a202c" />
      </head>
      <body>
        {children}
        <SWRegistrar />
      </body>
    </html>
  );
}
