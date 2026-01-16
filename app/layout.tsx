import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threadbaire Server",
  description: "Entry management for Threadbaire — store and query your addendum and dev log entries.",
  icons: {
    icon: "/threadbaire-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--tb-border)',
        }}>
          <div className="container" style={{
            height: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <a href="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: 'inherit',
            }}>
              <img
                src="/threadbaire-logo.svg"
                alt=""
                aria-hidden="true"
                style={{ height: '2rem', width: '2rem' }}
              />
              <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                Threadbaire Server
              </span>
            </a>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <a href="/" style={{ color: 'var(--tb-gray-700)', textDecoration: 'none' }}>
                Entries
              </a>
              <a
                href="https://github.com/threadbaire/method"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                GitHub
                <svg style={{ width: '1rem', height: '1rem' }} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                </svg>
              </a>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="container section">
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          marginTop: '2rem',
          borderTop: '1px solid var(--tb-border)',
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--tb-gray-500)',
        }}>
          <div className="container">
            <p>
              Threadbaire Server · Open method for AI memory + context
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <a href="https://threadbaire.com" target="_blank" rel="noopener noreferrer">
                threadbaire.com
              </a>
              <span style={{ margin: '0 0.5rem', color: 'var(--tb-gray-300)' }}>·</span>
              <a href="https://github.com/threadbaire/method" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
