import React, { useState, useEffect } from 'react';
import { Recycle, AlertCircle, CheckCircle2, Info, Clock } from 'lucide-react';
import { WASTE_PRICES, WASTE_TYPES, RT_LIST, formatRupiah, formatDate } from '../constants';
import { api } from '../services/api';

export default function FormSetoran() {
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    nama_penyetor: '',
    rt: '1',
    tanggal_setor: getTodayDate(),
    jenis_sampah: 'Plastik',
    berat: '',
    harga_per_kg: String(WASTE_PRICES['Plastik']),
    keterangan: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentData, setRecentData] = useState([]);

  // Fetch recent 5 deposits for quick reference
  const fetchRecent = async () => {
    try {
      const allData = await api.get('/api/setoran');
      // Take latest 5
      setRecentData((allData || []).slice(0, 5));
    } catch {
      // Silently fail — this is a convenience feature
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  // Automatically update standard price per kg when waste type changes
  useEffect(() => {
    if (WASTE_PRICES[formData.jenis_sampah]) {
      setFormData(prev => ({
        ...prev,
        harga_per_kg: String(WASTE_PRICES[formData.jenis_sampah])
      }));
    }
  }, [formData.jenis_sampah]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Live preview calculation
  const beratNum = Number(formData.berat) || 0;
  const hargaNum = Number(formData.harga_per_kg) || 0;
  const totalPreview = beratNum * hargaNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.nama_penyetor.trim()) {
      setError('Nama penyetor wajib diisi.');
      return;
    }
    if (!formData.tanggal_setor) {
      setError('Tanggal setor wajib diisi.');
      return;
    }
    if (isNaN(beratNum) || beratNum <= 0) {
      setError('Berat sampah harus berupa angka lebih besar dari 0.');
      return;
    }
    if (isNaN(hargaNum) || hargaNum < 0) {
      setError('Harga per Kg tidak boleh negatif.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/setoran', {
        ...formData,
        rt: Number(formData.rt),
        berat: beratNum,
        harga_per_kg: hargaNum
      });

      setSuccess(true);
      // Reset form (keeping RT and Date the same for consecutive entry comfort)
      setFormData(prev => ({
        ...prev,
        nama_penyetor: '',
        berat: '',
        keterangan: ''
      }));

      // Refresh recent data
      fetchRecent();

      // Auto close success notification
      setTimeout(() => {
        setSuccess(false);
      }, 4000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Banner (Google Form Style Header Decor) */}
      <div>
        <div className="h-4 bg-gradient-to-r from-emerald-600 to-green-500 rounded-t-2xl shadow-sm"></div>

        {/* Main Container */}
        <div className="bg-white rounded-b-2xl shadow-lg border border-slate-100 p-6 md:p-8 space-y-6">
          
          {/* Title Section */}
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
                <Recycle className="h-6 w-6 animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Input Setoran Sampah</h1>
            </div>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              Catat setoran sampah warga dengan cepat. Data langsung masuk ke dashboard dan laporan.
            </p>
          </div>

          {/* Price Guide Badge */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2.5">
              <Info className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Harga Standar per Jenis Sampah</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(WASTE_PRICES).map(([type, price]) => (
                <span
                  key={type}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    formData.jenis_sampah === type
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {type}: {formatRupiah(price)}/Kg
                </span>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {success && (
            <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold">Data berhasil disimpan! ✓</p>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nama Penyetor */}
            <div className="space-y-2">
              <label htmlFor="nama_penyetor" className="block text-sm font-semibold text-slate-700">
                Nama Penyetor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nama_penyetor"
                name="nama_penyetor"
                required
                value={formData.nama_penyetor}
                onChange={handleChange}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50"
              />
            </div>

            {/* RT Row & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* RT Selection */}
              <div className="space-y-2">
                <label htmlFor="rt" className="block text-sm font-semibold text-slate-700">
                  RT (Rukun Tetangga) <span className="text-red-500">*</span>
                </label>
                <select
                  id="rt"
                  name="rt"
                  required
                  value={formData.rt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50 cursor-pointer"
                >
                  {[...Array(9)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      RT 0{i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Setor */}
              <div className="space-y-2">
                <label htmlFor="tanggal_setor" className="block text-sm font-semibold text-slate-700">
                  Tanggal Setor <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="tanggal_setor"
                  name="tanggal_setor"
                  required
                  value={formData.tanggal_setor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50 cursor-pointer"
                />
              </div>

            </div>

            {/* Jenis Sampah Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Jenis Sampah */}
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="jenis_sampah" className="block text-sm font-semibold text-slate-700">
                  Jenis Sampah <span className="text-red-500">*</span>
                </label>
                <select
                  id="jenis_sampah"
                  name="jenis_sampah"
                  required
                  value={formData.jenis_sampah}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50 cursor-pointer"
                >
                  {Object.keys(WASTE_PRICES).map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Berat (Kg) */}
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="berat" className="block text-sm font-semibold text-slate-700">
                  Berat (Kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="berat"
                  name="berat"
                  required
                  value={formData.berat}
                  onChange={handleChange}
                  placeholder="0.0"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50"
                />
              </div>

              {/* Harga per Kg */}
              <div className="space-y-2 md:col-span-1">
                <label htmlFor="harga_per_kg" className="block text-sm font-semibold text-slate-700">
                  Harga per Kg (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="harga_per_kg"
                  name="harga_per_kg"
                  required
                  value={formData.harga_per_kg}
                  onChange={handleChange}
                  placeholder="Standard Rp"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50"
                />
              </div>

            </div>

            {/* Live Preview Total */}
            {beratNum > 0 && hargaNum > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-emerald-800">
                    Estimasi Nilai Setoran
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 block">{beratNum} Kg × {formatRupiah(hargaNum)}</span>
                  <span className="text-xl font-black text-emerald-800">{formatRupiah(totalPreview)}</span>
                </div>
              </div>
            )}

            {/* Keterangan */}
            <div className="space-y-2">
              <label htmlFor="keterangan" className="block text-sm font-semibold text-slate-700">
                Keterangan <span className="text-slate-400 font-normal text-xs">(opsional)</span>
              </label>
              <textarea
                id="keterangan"
                name="keterangan"
                rows="2"
                value={formData.keterangan}
                onChange={handleChange}
                placeholder="Contoh: Botol minum plastik bersih tanpa label"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50 resize-y"
              ></textarea>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
            >
              {loading ? 'Menyimpan...' : 'Simpan Data Setoran'}
            </button>

          </form>
        </div>
      </div>

      {/* Recent 5 Deposits - Mini Table */}
      {recentData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-slate-700 text-sm">5 Setoran Terakhir</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-5 py-3">RT</th>
                  <th className="px-5 py-3">Jenis</th>
                  <th className="px-5 py-3">Berat</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {recentData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-2.5 font-semibold text-slate-800">{row.nama_penyetor}</td>
                    <td className="px-5 py-2.5">RT 0{row.rt}</td>
                    <td className="px-5 py-2.5">
                      <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {row.jenis_sampah}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">{row.berat} Kg</td>
                    <td className="px-5 py-2.5 font-bold text-emerald-700">
                      {formatRupiah(Number(row.berat) * Number(row.harga_per_kg))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
