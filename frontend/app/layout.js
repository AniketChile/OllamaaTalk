// app/layout.js
'use client';

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-50 to-blue-100 text-gray-900 border border-black overflow-y-auto hide-scrollbar">
        {children}
      </body>
    </html>
  );
}
