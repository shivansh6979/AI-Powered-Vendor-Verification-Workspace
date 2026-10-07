import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Vendor Verification Workspace',
  description: 'AI-Powered Vendor Verification and Onboarding Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-900">
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
