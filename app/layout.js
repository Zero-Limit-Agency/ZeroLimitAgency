export const metadata = {
  title: "Zero Limit Agency",
  description:
    "Zero Limit Agency, agence e-sport, management, marketing et design pour structurer les projets, renforcer l'image et accompagner les talents."
};

import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="site-root">
        <div className="app-root">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
