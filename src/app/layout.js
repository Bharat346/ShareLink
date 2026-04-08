import './globals.css';

export const metadata = {
  title: 'SHARE_LINK | Secure P2P File Transfer',
  description: 'Encrypted, direct-to-disk WebRTC file sharing. Zero intermediary. AES-256 E2EE. No data retention.',
  keywords: ['P2P', 'file sharing', 'WebRTC', 'encryption', 'AES-256', 'secure transfer'],
  authors: [{ name: 'SHARE_LINK' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'SHARE_LINK | Secure P2P File Transfer',
    description: 'Encrypted, direct-to-disk WebRTC file sharing',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#00ff41',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
