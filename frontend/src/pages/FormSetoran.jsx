import React, { useState, useEffect } from 'react';
import { Recycle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WASTE_PRICES, WASTE_TYPES, RT_LIST } from '../constants';
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
    const beratNum = Number(formData.berat);
    if (isNaN(beratNum) || beratNum <= 0) {
      setError('Berat sampah harus berupa angka lebih besar dari 0.');
      return;
    }
    const hargaNum = Number(formData.harga_per_kg);
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
    <div className="max-w-2xl mx-auto">
      {/* Top Banner (Google Form Style Header Decor) */}
      <div className="h-4 bg-gradient-to-r from-emerald-600 to-green-500 rounded-t-2xl shadow-sm"></div>

      {/* Main Container */}
      <div className="bg-white rounded-b-2xl shadow-lg border border-slate-100 p-6 md:p-8 space-y-6">
        
        {/* Title Section */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
              <Recycle className="h-6 w-6 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Formulir Setoran Sampah</h1>
          </div>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Gunakan formulir ini untuk mendata setoran sampah dari warga secara cepat. Data akan langsung terkapitulasi dalam sistem dashboard.
          </p>
        </div>

        {/* Notifications */}
        {success && (
          <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold">Data berhasil disimpan.</p>
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

          {/* Keterangan */}
          <div className="space-y-2">
            <label htmlFor="keterangan" className="block text-sm font-semibold text-slate-700">
              Keterangan
            </label>
            <textarea
              id="keterangan"
              name="keterangan"
              rows="3"
              value={formData.keterangan}
              onChange={handleChange}
              placeholder="Contoh: Botol minum plastik bersih tanpa label (opsional)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800 bg-slate-50 hover:bg-slate-100/50 resize-y"
            ></textarea>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
          >
            {loading ? 'Menyimpan...' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
