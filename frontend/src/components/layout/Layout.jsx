import React from 'react';
import Header from './Header';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header component */}
      <Header />

      {/* Main content container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in print:py-0 print:px-0 print:max-w-none">
        {children}
      </main>

      {/* Simple Green themed Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <p>© 2026 Bank Sampah Mandiri (BSM). All rights reserved.</p>
        <p className="mt-1 text-emerald-600 font-semibold">Mewujudkan Lingkungan Bersih dan Bernilai Ekonomi</p>
      </footer>
    </div>
  );
}
