import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://synciontech.com"),
  title: { default: "Syncion Tech | Web, App & Business Software Development", template: "%s | Syncion Tech" },
  description: "Syncion Tech builds websites, mobile and desktop apps, cloud platforms, business systems, and embedded software. Explore SigByte restaurant POS and EM Khata inventory management.",
  openGraph: {
    title: "Syncion Tech",
    description: "Websites, apps, and business software. Custom development, SigByte restaurant POS, and EM Khata inventory management.",
    url: "https://synciontech.com",
    siteName: "Syncion Tech",
    type: "website",
  },
  icons: { icon: "/favicon.png", apple: "/syncion-app-icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
