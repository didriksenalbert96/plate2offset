import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plate2Offset",
  description: "Offset the impact of your meals on farmed animals with a small donation.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plate2Offset",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.parent === window) return;
                function postHeight() {
                  var h = document.documentElement.scrollHeight;
                  window.parent.postMessage({ type: 'plate2offset-height', height: h }, '*');
                }
                var ro = new ResizeObserver(postHeight);
                ro.observe(document.documentElement);
                postHeight();
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
