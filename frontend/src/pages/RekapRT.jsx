import React, { useState, useEffect } from 'react';
import { downloadPDFPerRT } from '../utils/pdfGenerator';
import { Users, FileText, Send, Calendar, AlertCircle } from 'lucide-react';

const formatRupiah = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function RekapRT() {
  const [deposits, setDeposits] = useState([]);
  const [rtRecaps, setRtRecaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRT, setSelectedRT] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, recapRes] = await Promise.all([
        fetch('http://localhost:5000/api/setoran'),
        fetch('http://localhost:5000/api/setoran/rekap-rt')
      ]);

      if (!depRes.ok || !recapRes.ok) throw new Error('Gagal memuat data.');

      const depData = await depRes.ok ? await depRes.json() : [];
      const recapData = await recapRes.ok ? await recapRes.json() : [];

      setDeposits(depData);
      setRtRecaps(recapData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter deposits for the selected RT and selected Date
  const selectedRows = deposits.filter(
    item => Number(item.rt) === Number(selectedRT) &&
    (new Date(item.tanggal_setor).toISOString().split('T')[0] === selectedDate)
  );

  // Group by resident name to construct details
  const residentMap = {};
  selectedRows.forEach(row => {
    const name = row.nama_penyetor.trim();
    if (!residentMap[name]) {
      residentMap[name] = {
        name,
        breakdown: {},
        totalWeight: 0,
        totalValue: 0
      };
    }
    const type = row.jenis_sampah;
    const weight = Number(row.berat);
    const value = weight * Number(row.harga_per_kg);

    if (!residentMap[name].breakdown[type]) {
      residentMap[name].breakdown[type] = 0;
    }
    residentMap[name].breakdown[type] += weight;
    residentMap[name].totalWeight += weight;
    residentMap[name].totalValue += value;
  });

  const residentsList = Object.values(residentMap);
  const totalWeightRT = selectedRows.reduce((acc, r) => acc + Number(r.berat), 0);
  const totalValueRT = selectedRows.reduce((acc, r) => acc + (Number(r.berat) * Number(r.harga_per_kg)), 0);

  // PDF Export Trigger
  const handlePDFDownload = () => {
    if (!selectedRT) return;
    downloadPDFPerRT(selectedRT, selectedDate, deposits);
  };

  // WhatsApp Message Trigger
  const handleWhatsAppSend = () => {
    if (!selectedRT) return;
    
    const text = `Laporan Bank Sampah\n\nRT 0${selectedRT}\nTanggal ${formatDate(selectedDate)}\n\nTotal Sampah : ${totalWeightRT.toFixed(1)} Kg\nTotal Nilai : ${formatRupiah(totalValueRT)}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Rekapitulasi RT</h1>
        <p className="text-slate-500 text-sm mt-1">
          Lihat akumulasi sampah terkumpul dan total tabungan per Rukun Tetangga (RT 1 - RT 9).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* RT List Panel (Left/Top) */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Pilih RT</h3>
            <div className="grid grid-cols-3 gap-3">
              {rtRecaps.map(item => (
                <button
                  key={item.rt}
                  onClick={() => setSelectedRT(item.rt)}
                  className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                    selectedRT === item.rt
                      ? 'bg-emerald-800 border-emerald-800 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-600'
                  }`}
                >
                  <span className="block text-xs font-bold uppercase text-slate-400 group-hover:text-emerald-300">RT</span>
                  <span className="block text-2xl font-black mt-0.5">0{item.rt}</span>
                </button>
              ))}
            </div>

            {/* Quick stats cards of all RTs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
              <h4 className="font-bold text-slate-800 text-sm">Akumulasi Total RT Terpilih</h4>
              {selectedRT ? (
                (() => {
                  const r = rtRecaps.find(item => item.rt === selectedRT);
                  return (
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Warga Penyetor:</span>
                        <span className="font-bold text-slate-800">{r?.jumlah_warga} Orang</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Sampah:</span>
                        <span className="font-bold text-slate-800">{r?.total_berat} Kg</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
                        <span>Total Tabungan:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(r?.total_uang || 0)}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-slate-400 text-xs">Pilih RT di atas untuk melihat akumulasi historis.</p>
              )}
            </div>
          </div>

          {/* Detailed Recap Panel (Right/Bottom) */}
          <div className="md:col-span-2 space-y-4">
            {selectedRT ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Detail Harian RT 0{selectedRT}</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Pilih tanggal setoran untuk melihat rekap detail.</p>
                  </div>
                  {/* Date selection inside detail */}
                  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent focus:outline-none text-sm text-slate-800 font-medium cursor-pointer"
                    />
                  </div>
                </div>

                {/* Group Details */}
                {selectedRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                    <p className="text-sm">Tidak ada transaksi setoran di RT 0{selectedRT} pada tanggal {formatDate(selectedDate)}.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {residentsList.map((res, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <span className="block font-bold text-slate-800 text-base">{res.name}</span>
                            <div className="mt-2 space-y-1">
                              {Object.entries(res.breakdown).map(([type, w]) => (
                                <span key={type} className="inline-block bg-white text-slate-600 text-xs px-2.5 py-1 rounded-full border border-slate-200 font-medium mr-2">
                                  {type}: {w} Kg
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:text-right flex flex-col justify-between sm:h-full">
                            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total</span>
                            <span className="font-extrabold text-emerald-700 text-base mt-1">{formatRupiah(res.totalValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary row */}
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between text-emerald-800 font-bold text-sm sm:text-base">
                      <span>Total RT 0{selectedRT} ({formatDate(selectedDate)}) :</span>
                      <div className="text-right">
                        <span className="block text-xs font-medium text-emerald-600">{totalWeightRT.toFixed(1)} Kg</span>
                        <span className="block text-emerald-800 font-black mt-0.5">{formatRupiah(totalValueRT)}</span>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleWhatsAppSend}
                        className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all"
                      >
                        <Send className="h-4.5 w-4.5" />
                        <span>Kirim ke WhatsApp</span>
                      </button>
                      <button
                        onClick={handlePDFDownload}
                        className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                      >
                        <FileText className="h-4.5 w-4.5" />
                        <span>Unduh PDF RT</span>
                      </button>
                    </div>
                  </>
                )}

              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <Users className="h-12 w-12 text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-600">Pilih RT Terlebih Dahulu</h3>
                <p className="text-sm mt-1 max-w-sm">Klik salah satu Rukun Tetangga di panel sebelah kiri untuk menampilkan detail data harian.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
