import type { Metadata } from "next";
import "./globals.css";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { GlobalLoadingCurtain } from "@/components/global-loading-curtain";

export const metadata: Metadata = {
  title: {
    default: "Meridian Commerce",
    template: "%s · Meridian Commerce",
  },
  description: "Multi-store commerce infrastructure for modern retail brands.",
};

const colorModeScript = `(function(){try{var stored=localStorage.getItem("meridian-color-mode");var mode=stored==="light"||stored==="dark"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.colorMode=mode;document.documentElement.style.colorScheme=mode;}catch(error){document.documentElement.dataset.colorMode="light";document.documentElement.style.colorScheme="light";}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head><script dangerouslySetInnerHTML={{ __html: colorModeScript }} /></head>
      <body><GlobalLoadingCurtain /><ThemeModeToggle className="global-theme-toggle" />{children}</body>
    </html>
  );
}
