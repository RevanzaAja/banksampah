import React, { useState, useEffect } from 'react';
import { downloadPDFPerTanggal } from '../services/pdfGenerator';
import { Calendar, FileText, Send, AlertCircle, Table } from 'lucide-react';
import { formatRupiah, formatDate } from '../constants';
import useFetch from '../hooks/useFetch';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function RekapTanggal() {
  const { data, loading } = useFetch('/api/setoran');
  const deposits = data || [];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter records by the selected date
  const filtered = deposits.filter(
    item => new Date(item.tanggal_setor).toISOString().split('T')[0] === selectedDate
  );

  const totalWeight = filtered.reduce((acc, r) => acc + Number(r.berat), 0);
  const totalValue = filtered.reduce((acc, r) => acc + (Number(r.berat) * Number(r.harga_per_kg)), 0);

  // PDF Export Trigger
  const handlePDFDownload = () => {
    downloadPDFPerTanggal(selectedDate, deposits);
  };

  // WhatsApp Message Trigger
  const handleWhatsAppSend = () => {
    const text = `Laporan Bank Sampah\n\nTanggal ${formatDate(selectedDate)}\n\nTotal Sampah : ${totalWeight.toFixed(1)} Kg\nTotal Nilai : ${formatRupiah(totalValue)}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Rekap Berdasarkan Tanggal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Lihat daftar transaksi setoran sampah dan total perolehan harian pada tanggal tertentu.
          </p>
        </div>
      </div>

      {/* Date Picker Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-slate-700">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-sm sm:text-base">Pilih Tanggal Laporan</span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50 cursor-pointer w-full sm:w-auto font-medium"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="h-10 w-10 text-slate-300" />
          <h3 className="font-bold text-slate-600 text-base">Tidak Ada Transaksi</h3>
          <p className="text-sm">Tidak ditemukan catatan setoran sampah warga pada tanggal {formatDate(selectedDate)}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-800">Total Sampah Terkumpul</span>
              <span className="text-lg font-black text-emerald-950">{totalWeight.toFixed(2)} Kg</span>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-800">Total Nilai Transaksi</span>
              <span className="text-lg font-black text-blue-950">{formatRupiah(totalValue)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Nama Penyetor</th>
                    <th className="px-6 py-4">RT</th>
                    <th className="px-6 py-4">Jenis Sampah</th>
                    <th className="px-6 py-4">Berat</th>
                    <th className="px-6 py-4">Harga/Kg</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filtered.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.nama_penyetor}</td>
                      <td className="px-6 py-4">RT 0{row.rt}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {row.jenis_sampah}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.berat} Kg</td>
                      <td className="px-6 py-4">{formatRupiah(row.harga_per_kg)}</td>
                      <td className="px-6 py-4 font-extrabold text-emerald-700">
                        {formatRupiah(Number(row.berat) * Number(row.harga_per_kg))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleWhatsAppSend}
              className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <Send className="h-4.5 w-4.5" />
              <span>Kirim ke WhatsApp</span>
            </button>
            <button
              onClick={handlePDFDownload}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
            >
              <FileText className="h-4.5 w-4.5" />
              <span>Unduh PDF Laporan</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
