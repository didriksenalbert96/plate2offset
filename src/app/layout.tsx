import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import Providers from "@/components/Providers";
import AuthButton from "@/components/AuthButton";
import BottomNav from "@/components/BottomNav";
import OnboardingFlow from "@/components/OnboardingFlow";

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
        <Providers>
          <OfflineBanner />
          <div className="fixed top-2 right-3 z-50">
            <AuthButton />
          </div>
          <div className="pb-16">
            {children}
          </div>
          <BottomNav />
          <OnboardingFlow />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Iframe height sync
                if (window.parent !== window) {
                  function postHeight() {
                    var h = document.documentElement.scrollHeight;
                    window.parent.postMessage({ type: 'plate2offset-height', height: h }, '*');
                  }
                  var ro = new ResizeObserver(postHeight);
                  ro.observe(document.documentElement);
                  postHeight();
                }
                // Register service worker (production only) or unregister in dev
                if ('serviceWorker' in navigator) {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      regs.forEach(function(r) { r.unregister(); });
                    });
                    caches.keys().then(function(keys) {
                      keys.forEach(function(k) { caches.delete(k); });
                    });
                  } else {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
