import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VidyaQuest — Interactive Adventure World',
  description: 'Explore Knowledge Village, Science Forest, Mathematics Mountains, Discovery Coast, and Innovation Castle.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="m-0 overflow-hidden bg-[#071426] text-[#F3EFE6] antialiased">{children}</body>
    </html>
  );
}
