import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, LayoutDashboard, ClipboardList, Users, CalendarDays, Banknote, Menu, X, PenLine } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', subtitle: 'Ringkasan & Statistik', path: '/', icon: LayoutDashboard },
    { name: 'Input Setoran', subtitle: 'Catat setoran warga', path: '/input-setoran', icon: PenLine },
    { name: 'Data Setoran', subtitle: 'Semua riwayat transaksi', path: '/semua-data', icon: ClipboardList },
    { name: 'Rekap RT', subtitle: 'Laporan per RT', path: '/rekap-rt', icon: Users },
    { name: 'Rekap Harian', subtitle: 'Laporan per tanggal', path: '/rekap-tanggal', icon: CalendarDays },
    { name: 'Penjualan', subtitle: 'Hasil penjualan BSM', path: '/hasil-penjualan', icon: Banknote },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group">
            <div className="bg-white text-emerald-800 p-1.5 rounded-lg shadow-inner group-hover:rotate-12 transition-transform duration-300">
              <Recycle className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wide block leading-none">BSM GADINGKASRI RW 1</span>
              <span className="text-[10px] text-emerald-200 tracking-widest uppercase font-semibold">Bank Sampah Mandiri</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex space-x-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-emerald-900 text-emerald-100 shadow-md border-b-2 border-emerald-400'
                      : 'hover:bg-emerald-700 hover:text-white text-emerald-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="xl:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="xl:hidden bg-emerald-900 border-t border-emerald-700 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-emerald-950 text-white shadow-inner border-l-4 border-emerald-400'
                      : 'hover:bg-emerald-800 text-emerald-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <span className="block text-base font-medium">{item.name}</span>
                    <span className="block text-xs text-emerald-300/70">{item.subtitle}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
