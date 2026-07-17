import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper: Format currency in IDR
const formatRupiah = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

// Helper: Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Common function for drawing letterhead (kop surat)
const drawHeader = (doc, title, subtitle) => {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52); // Forest green
  doc.text('BANK SAMPAH MANDIRI (BSM GADINGKASRI RW 1)', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(22, 101, 52);
  doc.line(14, 25, doc.internal.pageSize.getWidth() - 14, 25);
  doc.line(14, 26, doc.internal.pageSize.getWidth() - 14, 26); // Double line

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Laporan: ${title}`, 14, 35);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, 14, 40);
  doc.text(`Dicetak pada: ${formatDate(new Date())}`, 14, 45);
};

// Common function for drawing page numbers
const addPageNumbers = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Line separator for footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(14, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 15);
    
    // Page number left, printed by right
    doc.text(`Halaman ${i} dari ${pageCount}`, 14, doc.internal.pageSize.getHeight() - 10);
    doc.text('Dicetak oleh Sistem BSM', doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }
};

// 1. Download per RT (with details per resident)
export const downloadPDFPerRT = (rtNumber, date, deposits) => {
  const doc = new jsPDF();
  const title = `Rekapitulasi RT 0${rtNumber}`;
  const subtitle = `Tanggal Setoran: ${formatDate(date)}`;
  
  drawHeader(doc, title, subtitle);

  // Group by resident
  const rtRows = deposits.filter(
    item => Number(item.rt) === Number(rtNumber) && 
    (new Date(item.tanggal_setor).toISOString().split('T')[0] === date)
  );

  if (rtRows.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(153, 27, 27);
    doc.text('Tidak ada data setoran untuk RT dan tanggal ini.', 14, 55);
    addPageNumbers(doc);
    doc.save(`laporan-RT0${rtNumber}-${date}.pdf`);
    return;
  }

  // Draw table
  const tableHeaders = [['No', 'Nama Penyetor', 'Jenis Sampah', 'Berat (Kg)', 'Harga/Kg', 'Total (Rp)']];
  const tableData = [];
  
  let currentNo = 1;
  let totalRTWeight = 0;
  let totalRTVal = 0;

  // Flattened data for table
  rtRows.forEach(row => {
      const weight = Number(row.berat);
      const value = weight * Number(row.harga_per_kg);
      
      tableData.push([
        currentNo++,
        row.nama_penyetor,
        row.jenis_sampah,
        weight,
        formatRupiah(row.harga_per_kg),
        formatRupiah(value)
      ]);
      
      totalRTWeight += weight;
      totalRTVal += value;
  });
  
  // Add Grand Total row
  tableData.push([
      { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${totalRTWeight.toFixed(2)} Kg`, styles: { fontStyle: 'bold' } },
      '',
      { content: formatRupiah(totalRTVal), styles: { fontStyle: 'bold', textColor: [22, 101, 52] } }
  ]);

  autoTable(doc, {
    startY: 50,
    head: tableHeaders,
    body: tableData,
    headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });

  addPageNumbers(doc);
  doc.save(`laporan-RT0${rtNumber}-${date}.pdf`);
};

// 2. Download per Tanggal
export const downloadPDFPerTanggal = (date, deposits) => {
  const doc = new jsPDF();
  const title = `Rekap Harian Semua RT`;
  const subtitle = `Tanggal Setoran: ${formatDate(date)}`;

  drawHeader(doc, title, subtitle);

  const filtered = deposits.filter(
    item => new Date(item.tanggal_setor).toISOString().split('T')[0] === date
  );

  if (filtered.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(153, 27, 27);
    doc.text('Tidak ada transaksi setoran pada tanggal ini.', 14, 55);
    addPageNumbers(doc);
    doc.save(`laporan-harian-${date}.pdf`);
    return;
  }

  const tableHeaders = [['No', 'Nama Penyetor', 'RT', 'Jenis Sampah', 'Berat (Kg)', 'Harga/Kg', 'Total (Rp)']];
  const tableData = [];
  
  let totalWeight = 0;
  let totalMoney = 0;

  filtered.forEach((row, index) => {
      const weight = Number(row.berat);
      const value = weight * Number(row.harga_per_kg);
      
      tableData.push([
        index + 1,
        row.nama_penyetor,
        `RT 0${row.rt}`,
        row.jenis_sampah,
        weight,
        formatRupiah(row.harga_per_kg),
        formatRupiah(value)
      ]);
      
      totalWeight += weight;
      totalMoney += value;
  });

  tableData.push([
      { content: 'TOTAL HARIAN', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `${totalWeight.toFixed(2)} Kg`, styles: { fontStyle: 'bold' } },
      '',
      { content: formatRupiah(totalMoney), styles: { fontStyle: 'bold', textColor: [22, 101, 52] } }
  ]);

  autoTable(doc, {
    startY: 50,
    head: tableHeaders,
    body: tableData,
    headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });

  addPageNumbers(doc);
  doc.save(`laporan-harian-${date}.pdf`);
};

// 3. Download Semua Data
export const downloadPDFSemuaData = (deposits, rtRecap) => {
  const doc = new jsPDF();
  const title = `Laporan Akumulasi Keseluruhan`;
  const subtitle = `Seluruh riwayat setoran sejak awal operasional`;

  drawHeader(doc, title, subtitle);

  // Section 1: Overall Summary
  const grandTotalWeight = deposits.reduce((acc, r) => acc + Number(r.berat), 0);
  const grandTotalMoney = deposits.reduce((acc, r) => acc + (Number(r.berat) * Number(r.harga_per_kg)), 0);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ringkasan Keseluruhan', 14, 55);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Penyetoran    : ${deposits.length} kali transaksi`, 14, 61);
  doc.text(`Total Berat Sampah  : ${grandTotalWeight.toFixed(2)} Kg`, 14, 66);
  doc.text(`Total Nilai Tabungan: ${formatRupiah(grandTotalMoney)}`, 14, 71);

  // Section 2: Table Summary RT
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Rekapitulasi per RT', 14, 82);

  const rtHeaders = [['RT', 'Jumlah Warga Penyetor', 'Total Berat (Kg)', 'Total Uang (Rp)']];
  const rtData = rtRecap.map(item => [
    `RT 0${item.rt}`,
    `${item.jumlah_warga} Orang`,
    `${item.total_berat} Kg`,
    formatRupiah(item.total_uang)
  ]);

  autoTable(doc, {
    startY: 86,
    head: rtHeaders,
    body: rtData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }, // Dark slate
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });

  // Section 3: All Transactions (adds new page automatically if required)
  const nextY = doc.lastAutoTable.finalY + 12;
  
  if (nextY > 240) {
    doc.addPage();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. Seluruh Detail Transaksi Setoran', 14, 20);
  } else {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. Seluruh Detail Transaksi Setoran', 14, nextY);
  }

  const transHeaders = [['No', 'Penyetor', 'RT', 'Tanggal', 'Jenis', 'Berat', 'Harga/Kg', 'Total']];
  const transData = deposits.map((row, idx) => [
    idx + 1,
    row.nama_penyetor,
    `RT 0${row.rt}`,
    formatDate(row.tanggal_setor),
    row.jenis_sampah,
    `${row.berat} Kg`,
    formatRupiah(row.harga_per_kg),
    formatRupiah(Number(row.berat) * Number(row.harga_per_kg))
  ]);

  autoTable(doc, {
    startY: nextY > 240 ? 24 : nextY + 4,
    head: transHeaders,
    body: transData,
    headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });

  addPageNumbers(doc);
  doc.save('laporan-akumulasi-bank-sampah.pdf');
};
