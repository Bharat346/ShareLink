import './globals.css';

export const metadata = {
  title: 'ShareLink Pro | High Speed P2P File Sharing',
  description: 'Secure, private, direct-to-disk WebRTC file sharing with premium design and optional VPN tunneling.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </head>
      <body>
        <div className="bg-mesh" />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
