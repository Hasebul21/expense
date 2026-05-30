import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your monthly personal expenses and visualize spending",
  appleWebApp: {
    capable: true,
    title: "Expenses",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5b5bd6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('expense-tracker:theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      {/* Safe-area insets keep content clear of the notch / status bar and
          landscape side-cutouts when running edge-to-edge (viewportFit: cover).
          The fixed bottom tab bar is viewport-anchored, so it stays
          edge-to-edge and handles its own bottom inset. */}
      <body className="flex min-h-full flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
        {children}
      </body>
    </html>
  );
}
