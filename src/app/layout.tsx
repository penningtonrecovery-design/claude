import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoProvider } from "@/lib/store";
import { AppShell, DemoBanner } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "MARcheck — eMAR demo (not for clinical use)",
  description: "Demonstration electronic Medication Administration Record for small residential care homes. Fictional data only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e2b57",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
