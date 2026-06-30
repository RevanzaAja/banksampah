import React, { useState, useEffect } from 'react';
import { Banknote, Percent, Weight, ChevronRight, Calculator, AlertCircle, HelpCircle } from 'lucide-react';
import { formatRupiah, formatDate } from '../constants';
import { api } from '../services/api';
import useFetch from '../hooks/useFetch';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function HasilPenjualan() {
  const { data: salesData, loading, error, refetch: fetchSales } = useFetch('/api/penjualan');
  const sales = salesData || [];

  // Form input state
  const [form, setForm] = useState({
    tanggal_penjualan: new Date().toISOString().split('T')[0],
    total_berat: '',
    total_hasil_penjualan: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Sharing calculation results state
  const [calculationResult, setCalculationResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/penjualan');
      if (!res.ok) throw new Error('Gagal mengambil data penjualan.');
      const data = await res.json();
      setSales(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const beratNum = Number(form.total_berat);
    if (isNaN(beratNum) || beratNum <= 0) {
      setFormError('Total berat harus lebih besar dari 0.');
      return;
    }
    const hasilNum = Number(form.total_hasil_penjualan);
    if (isNaN(hasilNum) || hasilNum < 0) {
      setFormError('Total hasil penjualan tidak boleh negatif.');
      return;
    }

    setSubmitLoading(true);

    try {
      await api.post('/api/penjualan', {
        tanggal_penjualan: form.tanggal_penjualan,
        total_berat: beratNum,
        total_hasil_penjualan: hasilNum
      });

      // Reset form
      setForm({
        tanggal_penjualan: new Date().toISOString().split('T')[0],
        total_berat: '',
        total_hasil_penjualan: ''
      });

      fetchSales();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Trigger automated sharing calculation
  const handleCalculateSharing = async (saleId) => {
    setCalcLoading(true);
    setCalculationResult(null);

    try {
      const result = await api.get(`/api/penjualan/${saleId}/pembagian`);
      setCalculationResult(result);
    } catch (err) {
      alert('Error kalkulasi: ' + err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Hasil Penjualan BSM</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola hasil penjualan sampah grosir dari gudang Bank Sampah dan hitung pembagian hasil otomatis untuk kas, pengelola, serta warga secara proporsional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Entry (Left/Top) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              <span>Input Penjualan</span>
            </h3>

            {formError && (
              <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-xs font-semibold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Tanggal Penjualan</label>
                <input
                  type="date"
                  name="tanggal_penjualan"
                  required
                  value={form.tanggal_penjualan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Total Berat Terjual (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_berat"
                  required
                  placeholder="0.0"
                  value={form.total_berat}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Total Pendapatan Penjualan (Rp)</label>
                <input
                  type="number"
                  name="total_hasil_penjualan"
                  required
                  placeholder="Rp"
                  value={form.total_hasil_penjualan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
              >
                {submitLoading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </button>
            </form>
          </div>

          {/* Formula & Simulation Guide Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-100 pb-2">
              <HelpCircle className="h-4.5 w-4.5 text-emerald-600" />
              <span>Panduan Rumus Pembagian</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Ketika tombol <strong>"Hitung Pembagian"</strong> ditekan, sistem membagi total pendapatan penjualan grosir sebagai berikut:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>20% Kas BSM:</strong> Untuk kas operasional Bank Sampah.</li>
                <li><strong>30% Jasa Pengelola:</strong> Untuk biaya operasional pengelola.</li>
                <li><strong>50% Dana Warga:</strong> Dibagi secara proporsional kepada semua warga penyetor.</li>
              </ul>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-2 mt-2">
                <span className="block font-bold text-emerald-800">Rumus Proporsional Warga:</span>
                <code className="block bg-white p-1.5 rounded border border-emerald-200 font-mono text-[10px] text-slate-700 leading-normal">
                  Nilai per Kg = Dana Warga / Total Kg Setoran Semua Warga
                </code>
                <code className="block bg-white p-1.5 rounded border border-emerald-200 font-mono text-[10px] text-slate-700 leading-normal">
                  Hak Uang Warga = Total Kg Setoran Warga × Nilai per Kg
                </code>
              </div>
              <p className="text-[10px] text-slate-400">
                *Contoh: Hasil penjualan Rp 1.000.000 (Dana Warga Rp 500.000). Jika total berat setoran seluruh warga adalah 98 Kg, maka per Kg sampah bernilai Rp 5.102.
              </p>

              <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
                <span className="block font-bold text-slate-700">Simulasi Pembagian per Warga:</span>
                <div className="border border-slate-100 rounded-lg overflow-hidden mt-1">
                  <table className="w-full text-[10px] text-left border-collapse bg-slate-50">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                        <th className="px-2.5 py-1">Nama</th>
                        <th className="px-2.5 py-1 text-center">RT</th>
                        <th className="px-2.5 py-1 text-right">Setoran</th>
                        <th className="px-2.5 py-1 text-right">Uang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Joko</td>
                        <td className="px-2.5 py-1 text-center">RT 03</td>
                        <td className="px-2.5 py-1 text-right">40 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 204.082</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Agus</td>
                        <td className="px-2.5 py-1 text-center">RT 03</td>
                        <td className="px-2.5 py-1 text-right">20 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 102.041</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Aminah</td>
                        <td className="px-2.5 py-1 text-center">RT 03</td>
                        <td className="px-2.5 py-1 text-right">15 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 76.531</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Lani</td>
                        <td className="px-2.5 py-1 text-center">RT 05</td>
                        <td className="px-2.5 py-1 text-right">10 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 51.020</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Budi</td>
                        <td className="px-2.5 py-1 text-center">RT 01</td>
                        <td className="px-2.5 py-1 text-right">8 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 40.816</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1 font-semibold">Siti</td>
                        <td className="px-2.5 py-1 text-center">RT 01</td>
                        <td className="px-2.5 py-1 text-right">5 Kg</td>
                        <td className="px-2.5 py-1 text-right font-bold text-emerald-700">Rp 25.510</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History List (Right/Bottom) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base">Riwayat Penjualan BSM</h3>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : sales.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Belum ada data penjualan BSM yang terinput.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Berat Terjual</th>
                      <th className="px-6 py-4">Total Hasil</th>
                      <th className="px-6 py-4 text-right">Kalkulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {sales.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 font-semibold text-slate-800">{formatDate(row.tanggal_penjualan)}</td>
                        <td className="px-6 py-4">{row.total_berat} Kg</td>
                        <td className="px-6 py-4 font-bold text-emerald-800">{formatRupiah(row.total_hasil_penjualan)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleCalculateSharing(row.id)}
                            className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-100 hover:border-emerald-600"
                          >
                            <span>Hitung Pembagian</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Calculation Details Section */}
      {calcLoading && (
        <div className="flex items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
          <span className="text-sm font-semibold text-slate-600">Sedang menghitung pembagian proporsional warga...</span>
        </div>
      )}

      {calculationResult && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 animate-fade-in">
          {/* Header detail */}
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl font-bold text-slate-800">Hasil Pembagian Otomatis</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Penjualan Tanggal {formatDate(calculationResult.salesDetail.tanggal_penjualan)} | Total {formatRupiah(calculationResult.salesDetail.total_hasil_penjualan)}
            </p>
          </div>

          {/* Allocation Cards (20% Kas, 50% Warga, 30% Jasa) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Kas BSM */}
            <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-3 top-3 text-amber-200">
                <Percent className="h-10 w-10" />
              </div>
              <span className="block text-xs font-bold text-amber-600 uppercase tracking-wider">Kas Bank Sampah (20%)</span>
              <span className="block text-2xl font-black text-amber-950 mt-1.5">
                {formatRupiah(calculationResult.salesDetail.kas_bank_sampah)}
              </span>
            </div>

            {/* Dana Warga */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-3 top-3 text-emerald-200">
                <Percent className="h-10 w-10" />
              </div>
              <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider">Dana Pembagian Warga (50%)</span>
              <span className="block text-2xl font-black text-emerald-950 mt-1.5">
                {formatRupiah(calculationResult.salesDetail.dana_warga)}
              </span>
            </div>

            {/* Jasa Pengelola */}
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-3 top-3 text-blue-200">
                <Percent className="h-10 w-10" />
              </div>
              <span className="block text-xs font-bold text-blue-600 uppercase tracking-wider">Jasa Pengelola (30%)</span>
              <span className="block text-2xl font-black text-blue-950 mt-1.5">
                {formatRupiah(calculationResult.salesDetail.jasa_pengelola)}
              </span>
            </div>
          </div>

          {/* Proportional details text */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Total sampah terkumpul seluruh warga :</span>
              <span className="font-bold text-slate-800">{calculationResult.salesDetail.total_berat_deposit} Kg</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-1 mt-1 font-semibold text-emerald-800">
              <span>Nilai proporsional per Kg (Dana Warga / Total Sampah) :</span>
              <span className="font-bold">{formatRupiah(calculationResult.salesDetail.nilai_per_kg)} / Kg</span>
            </div>
          </div>

          {/* Warga distribution table */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Rincian Hak Uang Warga</h3>
            
            {calculationResult.pembagian.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-slate-100 rounded-2xl">
                Tidak ada data warga penyetor untuk dibagi.
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-100 sticky top-0">
                      <th className="px-6 py-3">Nama Warga</th>
                      <th className="px-6 py-3">RT</th>
                      <th className="px-6 py-3">Total Setor (Kg)</th>
                      <th className="px-6 py-3">Hak Uang (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {calculationResult.pembagian.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-slate-800">{row.nama}</td>
                        <td className="px-6 py-3.5">RT 0{row.rt}</td>
                        <td className="px-6 py-3.5 font-medium">{row.total_berat} Kg</td>
                        <td className="px-6 py-3.5 font-extrabold text-emerald-700">{formatRupiah(row.hak_uang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
