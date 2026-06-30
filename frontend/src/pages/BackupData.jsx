import React, { useState } from 'react';
import { Database, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BackupData() {
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Trigger download of SQL file
  const handleExport = async () => {
    try {
      setError(null);
      setSuccess(null);
      const res = await fetch('http://localhost:5000/api/backup/export');
      if (!res.ok) throw new Error('Gagal mengekspor database.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-banksampah-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Database berhasil diekspor sebagai file SQL.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Trigger restore from uploaded SQL file
  const handleRestore = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Silakan pilih file SQL cadangan terlebih dahulu.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const sqlContent = event.target.result;
      try {
        const res = await fetch('http://localhost:5000/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: sqlContent })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Gagal memulihkan database.');

        setSuccess(result.message || 'Database berhasil dipulihkan.');
        setFile(null);
        // Reset file input element
        document.getElementById('sqlFile').value = '';
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file SQL.');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Cadangan & Pemulihan Data</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ekspor semua data transaksi setoran dan penjualan BSM ke dalam file SQL, atau unggah file SQL cadangan untuk memulihkan status database.
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Export Database */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl w-fit">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Ekspor Salinan Cadangan</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Mengekspor seluruh skema tabel dan data setoran serta penjualan BSM saat ini ke dalam satu script SQL terkompresi. Simpan salinan ini secara aman sebagai cadangan berkala.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm w-full"
          >
            <Download className="h-5 w-5" />
            <span>Ekspor Database (.sql)</span>
          </button>
        </div>

        {/* Card 2: Restore Database */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl w-fit">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Pulihkan Data</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Unggah file script SQL cadangan (.sql) hasil ekspor sebelumnya. Proses ini akan menimpa seluruh status database setoran dan penjualan BSM dengan data dari file cadangan.
            </p>
          </div>

          <form onSubmit={handleRestore} className="space-y-4">
            <div className="space-y-1">
              <input
                type="file"
                id="sqlFile"
                accept=".sql"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex items-center justify-center space-x-2 bg-slate-850 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm w-full"
            >
              <Upload className="h-5 w-5" />
              <span>{loading ? 'Memulihkan...' : 'Pulihkan Database'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
