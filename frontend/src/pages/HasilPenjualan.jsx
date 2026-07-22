import React, { useState, useEffect } from 'react';
import { Banknote, Percent, Weight, ChevronRight, ChevronDown, Calculator, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';
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
    rt: '',
    total_berat: '',
    total_hasil_penjualan: ''
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Sharing calculation results state
  const [calculationResult, setCalculationResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Accordion state for formula guide
  const [showGuide, setShowGuide] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    // Validation
    const rtNum = Number(form.rt);
    if (isNaN(rtNum) || rtNum <= 0) {
      setFormError('Nomor RT harus diisi dengan angka yang valid.');
      return;
    }
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
        rt: rtNum,
        total_berat: beratNum,
        total_hasil_penjualan: hasilNum
      });

      // Reset form
      setForm({
        tanggal_penjualan: new Date().toISOString().split('T')[0],
        rt: '',
        total_berat: '',
        total_hasil_penjualan: ''
      });

      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 4000);

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

  // Live preview for allocation
  const hasilNum = Number(form.total_hasil_penjualan) || 0;
  const previewKas = hasilNum * 0.2;
  const previewJasa = hasilNum * 0.3;
  const previewWarga = hasilNum * 0.5;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Penjualan BSM</h1>
        <p className="text-slate-500 text-sm mt-1">
          Catat hasil penjualan sampah dan hitung pembagian hasil otomatis untuk kas, pengelola, dan warga.
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

            {formSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-semibold">Data penjualan berhasil disimpan!</span>
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
                <label className="text-xs font-bold text-slate-600 uppercase">RT Berapa?</label>
                <input
                  type="number"
                  name="rt"
                  required
                  placeholder="Contoh: 1, 2, 3"
                  value={form.rt}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Berapa total berat yang dijual? (Kg)</label>
                <input
                  type="number"
                  step="0.01"
                  name="total_berat"
                  required
                  placeholder="Contoh: 150"
                  value={form.total_berat}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Berapa total uang yang diterima? (Rp)</label>
                <input
                  type="number"
                  name="total_hasil_penjualan"
                  required
                  placeholder="Contoh: 1000000"
                  value={form.total_hasil_penjualan}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
                />
              </div>

              {/* Live Allocation Preview */}
              {hasilNum > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 animate-fade-in">
                  <span className="text-xs font-bold text-slate-500 uppercase">Preview Pembagian</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 font-semibold">20% Kas BSM</span>
                      <span className="font-bold text-amber-800">{formatRupiah(previewKas)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-semibold">30% Jasa Pengelola</span>
                      <span className="font-bold text-blue-800">{formatRupiah(previewJasa)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold">50% Dana Warga</span>
                      <span className="font-bold text-emerald-800">{formatRupiah(previewWarga)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
              >
                {submitLoading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </button>
            </form>
          </div>

          {/* Collapsible Formula Guide */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-slate-700 text-sm">Cara Pembagian Hasil</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            
            {showGuide && (
              <div className="px-5 pb-5 space-y-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-fade-in">
                <p>
                  Total pendapatan penjualan grosir dibagi sebagai berikut:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>20% Kas BSM:</strong> Untuk kas operasional Bank Sampah.</li>
                  <li><strong>30% Jasa Pengelola:</strong> Untuk biaya operasional pengelola.</li>
                  <li><strong>50% Dana Warga:</strong> Dibagi proporsional berdasarkan berat setoran warga.</li>
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
              </div>
            )}
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
                Belum ada data penjualan BSM. Mulai catat penjualan pertama di form sebelah kiri.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">RT</th>
                      <th className="px-6 py-4">Berat Terjual</th>
                      <th className="px-6 py-4">Total Hasil</th>
                      <th className="px-6 py-4 text-right">Kalkulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {sales.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 font-semibold text-slate-800">{formatDate(row.tanggal_penjualan)}</td>
                        <td className="px-6 py-4">RT {row.rt || '-'}</td>
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
              Penjualan Tanggal {formatDate(calculationResult.salesDetail.tanggal_penjualan)} {calculationResult.salesDetail.rt_penjualan ? `(RT ${calculationResult.salesDetail.rt_penjualan})` : ''} | Total {formatRupiah(calculationResult.salesDetail.total_hasil_penjualan)}
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
              <span>Nilai proporsional per Kg :</span>
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
