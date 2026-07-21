import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Prederc Forecast Arena", 
  description: "Forecast markets on Arc Testnet using demo points.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}