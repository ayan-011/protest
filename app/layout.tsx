import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Record | Police Accountability Archive",
  description:
    "A documented, sourced archive of police conduct incidents — every identification tiered by evidence, every claim linked to its source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Serif+4:wght@400;600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="masthead">
          <div className="masthead-inner">
            <Link href="/" className="masthead-title">
              The Record
            </Link>
            <nav className="masthead-nav">
              <Link href="/incidents">Archive</Link>
              <Link href="/submit">Submit Footage</Link>
              <Link href="/methodology">Verification Standards</Link>
              <Link href="/admin">Reviewer Login</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          The Record is a documentation project. Identifications are tiered by
          evidence — see Verification Standards. Disagree with an entry? Use
          the dispute link on any profile.
        </footer>
      </body>
    </html>
  );
}
