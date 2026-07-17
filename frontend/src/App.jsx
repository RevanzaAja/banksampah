import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import FormSetoran from './pages/FormSetoran';
import Dashboard from './pages/Dashboard';
import SemuaData from './pages/SemuaData';
import RekapRT from './pages/RekapRT';
import RekapTanggal from './pages/RekapTanggal';
import HasilPenjualan from './pages/HasilPenjualan';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/input-setoran" element={<FormSetoran />} />
          <Route path="/semua-data" element={<SemuaData />} />
          <Route path="/rekap-rt" element={<RekapRT />} />
          <Route path="/rekap-tanggal" element={<RekapTanggal />} />
          <Route path="/hasil-penjualan" element={<HasilPenjualan />} />
        </Routes>
      </Layout>
    </Router>
  );
}
