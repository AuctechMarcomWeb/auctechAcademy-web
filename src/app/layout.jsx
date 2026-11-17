import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE } from "@/lib/constants";
import { DataProvider, SyncErrorBanner } from "@/components/providers/data-provider";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["online courses", "internships", "professional certification", "LMS", "Auctech"],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  icons: { icon: "/auctech-logo.png" },
};

export const viewport = {
  themeColor: "#14213D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla, Grammarly) add attributes to <html>/<body> before React loads.
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <DataProvider>
          <SyncErrorBanner />
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </DataProvider>
        <Toaster richColors position="top-right" closeButton toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
