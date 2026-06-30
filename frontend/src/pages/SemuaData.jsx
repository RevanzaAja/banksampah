import React, { useState, useEffect } from 'react';
import { downloadPDFSemuaData } from '../utils/pdfGenerator';
import { Search, SlidersHorizontal, Trash2, Edit, Printer, FileText, X, AlertCircle } from 'lucide-react';

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

export default function SemuaData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    rt: '',
    tanggal: '',
    bulan: '',
    tahun: ''
  });

  // Edit Modal State
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    nama_penyetor: '',
    rt: '1',
    tanggal_setor: '',
    jenis_sampah: 'Plastik',
    berat: '',
    harga_per_kg: '',
    keterangan: ''
  });
  const [editError, setEditError] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Query parameters construction
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.rt) params.append('rt', filters.rt);
      if (filters.tanggal) params.append('tanggal', filters.tanggal);
      if (filters.bulan) params.append('bulan', filters.bulan);
      if (filters.tahun) params.append('tahun', filters.tahun);

      const res = await fetch(`http://localhost:5000/api/setoran?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data dari server.');
      
      const records = await res.json();
      setData(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      rt: '',
      tanggal: '',
      bulan: '',
      tahun: ''
    });
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data setoran ini?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/setoran/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menghapus data.');

      alert('Data berhasil dihapus.');
      fetchRecords();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditItem(item);
    
    let dateStr = item.tanggal_setor;
    if (dateStr) {
      dateStr = new Date(dateStr).toISOString().split('T')[0];
    }

    setEditForm({
      nama_penyetor: item.nama_penyetor,
      rt: String(item.rt),
      tanggal_setor: dateStr || '',
      jenis_sampah: item.jenis_sampah,
      berat: String(item.berat),
      harga_per_kg: String(item.harga_per_kg),
      keterangan: item.keterangan || ''
    });
    setEditError(null);
  };

  // Edit form submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    // Validation
    if (!editForm.nama_penyetor.trim()) {
      setEditError('Nama penyetor wajib diisi.');
      return;
    }
    const beratNum = Number(editForm.berat);
    if (isNaN(beratNum) || beratNum <= 0) {
      setEditError('Berat sampah harus lebih besar dari 0.');
      return;
    }
    const hargaNum = Number(editForm.harga_per_kg);
    if (isNaN(hargaNum) || hargaNum < 0) {
      setEditError('Harga per Kg tidak boleh negatif.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/setoran/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          rt: Number(editForm.rt),
          berat: beratNum,
          harga_per_kg: hargaNum
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal mengubah data.');

      setEditItem(null); // Close modal
      fetchRecords();
    } catch (err) {
      setEditError(err.message);
    }
  };

  // PDF Export Trigger
  const handlePDFExport = async () => {
    try {
      // We need RT Recap in order to generate section 2 of the overall PDF
      const recapRes = await fetch('http://localhost:5000/api/setoran/rekap-rt');
      const rtRecap = await recapRes.json();
      downloadPDFSemuaData(data, rtRecap);
    } catch (err) {
      alert('Gagal mendownload PDF: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Semua Data Setoran</h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar lengkap transaksi setoran sampah warga. Gunakan filter untuk merapikan visualisasi data.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Printer className="h-4.5 w-4.5" />
            <span>Cetak Halaman</span>
          </button>
          <button
            onClick={handlePDFExport}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Panel (Hidden on print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
          <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-600" />
          <span>Filter & Pencarian</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              placeholder="Cari Nama..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50"
            />
          </div>

          {/* RT Select */}
          <select
            name="rt"
            value={filters.rt}
            onChange={handleFilterChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50 cursor-pointer"
          >
            <option value="">Semua RT</option>
            {[...Array(9)].map((_, i) => (
              <option key={i + 1} value={i + 1}>RT 0{i + 1}</option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            name="tanggal"
            value={filters.tanggal}
            onChange={handleFilterChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50 cursor-pointer"
          />

          {/* Month Select */}
          <select
            name="bulan"
            value={filters.bulan}
            onChange={handleFilterChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50 cursor-pointer"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          {/* Year select */}
          <select
            name="tahun"
            value={filters.tahun}
            onChange={handleFilterChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 bg-slate-50 cursor-pointer"
          >
            <option value="">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Clear filter button */}
        {(filters.search || filters.rt || filters.tanggal || filters.bulan || filters.tahun) && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
          >
            × Hapus Semua Filter
          </button>
        )}
      </div>

      {/* Printable Title */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">LAPORAN TRANSAKSI BANK SAMPAH</h1>
        <p className="text-sm text-slate-500">Dicetak pada: {formatDate(new Date())}</p>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Tidak ada data transaksi setoran yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Nama Penyetor</th>
                  <th className="px-6 py-4">RT</th>
                  <th className="px-6 py-4">Tanggal Setor</th>
                  <th className="px-6 py-4">Jenis Sampah</th>
                  <th className="px-6 py-4">Berat</th>
                  <th className="px-6 py-4">Harga/Kg</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.nama_penyetor}</td>
                    <td className="px-6 py-4">RT 0{row.rt}</td>
                    <td className="px-6 py-4">{formatDate(row.tanggal_setor)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-100">
                        {row.jenis_sampah}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{row.berat} Kg</td>
                    <td className="px-6 py-4">{formatRupiah(row.harga_per_kg)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">
                      {formatRupiah(Number(row.berat) * Number(row.harga_per_kg))}
                    </td>
                    <td className="px-6 py-4 text-right print:hidden space-x-2">
                      <button
                        onClick={() => openEditModal(row)}
                        className="inline-flex p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Data"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="inline-flex p-1.5 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Data"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal (Hidden on Print) */}
      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Setoran Sampah</h3>
              <button onClick={() => setEditItem(null)} className="text-emerald-100 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold">{editError}</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Nama Penyetor</label>
                <input
                  type="text"
                  required
                  value={editForm.nama_penyetor}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nama_penyetor: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* RT & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">RT</label>
                  <select
                    value={editForm.rt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rt: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    {[...Array(9)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>RT 0{i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Tanggal Setor</label>
                  <input
                    type="date"
                    required
                    value={editForm.tanggal_setor}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tanggal_setor: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Jenis Sampah, Berat, Harga */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Jenis Sampah</label>
                  <select
                    value={editForm.jenis_sampah}
                    onChange={(e) => setEditForm(prev => ({ ...prev, jenis_sampah: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="Plastik">Plastik</option>
                    <option value="Kertas">Kertas</option>
                    <option value="Kardus">Kardus</option>
                    <option value="Kaleng">Kaleng</option>
                    <option value="Botol">Botol</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Berat (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.berat}
                    onChange={(e) => setEditForm(prev => ({ ...prev, berat: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Harga/Kg</label>
                  <input
                    type="number"
                    required
                    value={editForm.harga_per_kg}
                    onChange={(e) => setEditForm(prev => ({ ...prev, harga_per_kg: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Keterangan</label>
                <textarea
                  rows="2"
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 font-semibold rounded-lg hover:bg-slate-50 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
