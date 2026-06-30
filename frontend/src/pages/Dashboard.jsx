import React from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Weight, Banknote, Users, BarChart3, HelpCircle } from 'lucide-react';
import { formatRupiah, INDONESIAN_MONTHS } from '../constants';
import useFetch from '../hooks/useFetch';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Dashboard() {
  const { data: depositsData, loading: loadingDep, error: errorDep } = useFetch('/api/setoran');
  const { data: salesData, loading: loadingSales, error: errorSales } = useFetch('/api/penjualan');

  const loading = loadingDep || loadingSales;
  const error = errorDep || errorSales;
  const deposits = depositsData || [];
  const sales = salesData || [];

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-200">
        <h3 className="font-bold text-lg">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // 1. Calculate General Statistics
  const totalWeight = deposits.reduce((acc, row) => acc + Number(row.berat), 0);
  const totalValue = deposits.reduce((acc, row) => acc + (Number(row.berat) * Number(row.harga_per_kg)), 0);
  const totalWarga = new Set(deposits.map(row => row.nama_penyetor.trim().toLowerCase())).size;
  const totalTransactions = deposits.length;

  // 2. Prepare Data: Waste quantity per RT
  const rtChartData = Array.from({ length: 9 }, (_, i) => {
    const rtNum = i + 1;
    const rtRows = deposits.filter(row => Number(row.rt) === rtNum);
    const weightSum = rtRows.reduce((acc, row) => acc + Number(row.berat), 0);
    return {
      name: `RT 0${rtNum}`,
      'Berat (Kg)': Number(weightSum.toFixed(1))
    };
  });

  // 3. Prepare Data: Waste quantity per Month
  const monthlyMap = {};
  // Initialize current year months
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    monthlyMap[i] = 0;
  }

  deposits.forEach(row => {
    const d = new Date(row.tanggal_setor);
    // Aggregate only if it's the current year (or you can do it across all years)
    if (d.getFullYear() === currentYear) {
      const monthIdx = d.getMonth();
      monthlyMap[monthIdx] += Number(row.berat);
    }
  });

  const monthlyChartData = Object.entries(monthlyMap).map(([monthIdx, weight]) => {
    return {
      name: INDONESIAN_MONTHS[Number(monthIdx)],
      'Berat (Kg)': Number(weight.toFixed(1))
    };
  });

  // 4. Prepare Data: Sales results
  const salesChartData = [...sales]
    .reverse() // Sort chronologically
    .map(s => {
      const d = new Date(s.tanggal_penjualan);
      return {
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        'Penjualan (Rp)': Number(s.total_hasil_penjualan),
        'Kas BSM (Rp)': Number(s.kas_bank_sampah)
      };
    });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Ringkasan</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau statistik volume sampah terkumpul dan riwayat hasil penjualan BSM (Bank Sampah Mandiri).
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Total Berat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
            <Weight className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sampah</span>
            <span className="block text-2xl font-bold text-slate-800 mt-0.5">{totalWeight.toFixed(1)} Kg</span>
          </div>
        </div>

        {/* Stat 2: Nilai Setoran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tabungan</span>
            <span className="block text-2xl font-bold text-slate-800 mt-0.5">{formatRupiah(totalValue)}</span>
          </div>
        </div>

        {/* Stat 3: Jumlah Warga */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-violet-50 text-violet-600 p-3.5 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Warga Aktif</span>
            <span className="block text-2xl font-bold text-slate-800 mt-0.5">{totalWarga} Orang</span>
          </div>
        </div>

        {/* Stat 4: Jumlah Transaksi */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Setoran</span>
            <span className="block text-2xl font-bold text-slate-800 mt-0.5">{totalTransactions} Kali</span>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Sampah per RT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Volume Sampah Per RT</h3>
            <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-medium">RT 1 - RT 9</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rtChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Kg`, 'Berat']} 
                />
                <Bar dataKey="Berat (Kg)" fill="#059669" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sampah per Bulan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Akumulasi Bulanan ({currentYear})</h3>
            <span className="text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full font-medium">Kg</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Kg`, 'Berat']}
                />
                <Line type="monotone" dataKey="Berat (Kg)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Hasil Penjualan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Hasil Penjualan BSM & Alokasi Kas</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
              <span className="text-slate-500 font-medium mr-2">Total Hasil</span>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span className="text-slate-500 font-medium">Kas BSM</span>
            </div>
          </div>
          <div className="h-80">
            {salesChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <HelpCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Belum ada transaksi penjualan BSM yang terdata.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} formatter={(val) => `Rp ${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatRupiah(value)]}
                  />
                  <Area type="monotone" dataKey="Penjualan (Rp)" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Kas BSM (Rp)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorKas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
