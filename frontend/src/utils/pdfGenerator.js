import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

// 1. Download per RT (with details per resident)
export const downloadPDFPerRT = (rtNumber, date, deposits) => {
  const doc = new jsPDF();
  const title = `LAPORAN BANK SAMPAH - RT 0${rtNumber}`;
  const dateFormatted = formatDate(date);

  // Styling header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52); // Forest green
  doc.text(title, 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // Slate
  doc.setFont('Helvetica', 'normal');
  doc.text(`Tanggal Laporan : ${dateFormatted}`, 14, 27);
  doc.text(`Dicetak pada     : ${formatDate(new Date())}`, 14, 33);
  doc.line(14, 36, 196, 36);

  // Group by resident
  const rtRows = deposits.filter(
    item => Number(item.rt) === Number(rtNumber) && 
    (new Date(item.tanggal_setor).toISOString().split('T')[0] === date)
  );

  if (rtRows.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(153, 27, 27); // Dark Red
    doc.text('Tidak ada data setoran untuk RT dan tanggal ini.', 14, 45);
    doc.save(`laporan-RT0${rtNumber}-${date}.pdf`);
    return;
  }

  const residentMap = {};
  rtRows.forEach(row => {
    const name = row.nama_penyetor.trim();
    if (!residentMap[name]) {
      residentMap[name] = {
        name,
        breakdown: {},
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
    residentMap[name].totalValue += value;
  });

  let currentY = 45;
  let totalRTVal = 0;

  Object.values(residentMap).forEach(res => {
    // Check page overflow
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Nama : ${res.name}`, 14, currentY);
    currentY += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    // Print breakdown
    Object.entries(res.breakdown).forEach(([type, weight]) => {
      doc.text(`- ${type} : ${weight} Kg`, 18, currentY);
      currentY += 5;
    });

    doc.text(`Total : ${formatRupiah(res.totalValue)}`, 18, currentY);
    currentY += 8; // spacing between residents
    totalRTVal += res.totalValue;
  });

  // Print RT grand total
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }
  doc.line(14, currentY, 196, currentY);
  currentY += 7;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text(`Total RT : ${formatRupiah(totalRTVal)}`, 14, currentY);

  doc.save(`laporan-RT0${rtNumber}-${date}.pdf`);
};

// 2. Download per Tanggal
export const downloadPDFPerTanggal = (date, deposits) => {
  const doc = new jsPDF();
  const dateFormatted = formatDate(date);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52);
  doc.text(`LAPORAN HARIAN BANK SAMPAH`, 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Tanggal Laporan : ${dateFormatted}`, 14, 27);
  doc.text(`Dicetak pada     : ${formatDate(new Date())}`, 14, 33);
  doc.line(14, 36, 196, 36);

  const filtered = deposits.filter(
    item => new Date(item.tanggal_setor).toISOString().split('T')[0] === date
  );

  if (filtered.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(153, 27, 27);
    doc.text('Tidak ada transaksi setoran pada tanggal ini.', 14, 45);
    doc.save(`laporan-harian-${date}.pdf`);
    return;
  }

  // Draw table
  const tableHeaders = [['No', 'Nama Penyetor', 'RT', 'Jenis Sampah', 'Berat (Kg)', 'Harga/Kg', 'Total (Rp)']];
  const tableData = filtered.map((row, index) => [
    index + 1,
    row.nama_penyetor,
    `RT ${row.rt}`,
    row.jenis_sampah,
    `${row.berat} Kg`,
    formatRupiah(row.harga_per_kg),
    formatRupiah(Number(row.berat) * Number(row.harga_per_kg))
  ]);

  const totalWeight = filtered.reduce((acc, r) => acc + Number(r.berat), 0);
  const totalMoney = filtered.reduce((acc, r) => acc + (Number(r.berat) * Number(r.harga_per_kg)), 0);

  doc.autoTable({
    startY: 40,
    head: tableHeaders,
    body: tableData,
    headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Ringkasan Harian:`, 14, finalY);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Total Sampah Terkumpul: ${totalWeight.toFixed(2)} Kg`, 14, finalY + 6);
  doc.text(`Total Nilai Transaksi   : ${formatRupiah(totalMoney)}`, 14, finalY + 12);

  doc.save(`laporan-harian-${date}.pdf`);
};

// 3. Download Semua Data
export const downloadPDFSemuaData = (deposits, rtRecap) => {
  const doc = new jsPDF();

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(22, 101, 52);
  doc.text('LAPORAN AKUMULASI BANK SAMPAH', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Dicetak pada : ${formatDate(new Date())}`, 14, 27);
  doc.line(14, 30, 196, 30);

  // Section 1: Overall Summary
  const grandTotalWeight = deposits.reduce((acc, r) => acc + Number(r.berat), 0);
  const grandTotalMoney = deposits.reduce((acc, r) => acc + (Number(r.berat) * Number(r.harga_per_kg)), 0);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ringkasan Keseluruhan', 14, 38);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Penyetoran    : ${deposits.length} kali transaksi`, 14, 44);
  doc.text(`Total Berat Sampah  : ${grandTotalWeight.toFixed(2)} Kg`, 14, 49);
  doc.text(`Total Nilai Tabungan: ${formatRupiah(grandTotalMoney)}`, 14, 54);

  // Section 2: Table Summary RT
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Rekapitulasi per RT', 14, 64);

  const rtHeaders = [['RT', 'Jumlah Warga Penyetor', 'Total Berat (Kg)', 'Total Uang (Rp)']];
  const rtData = rtRecap.map(item => [
    `RT ${String(item.rt).padStart(2, '0')}`,
    `${item.jumlah_warga} Orang`,
    `${item.total_berat} Kg`,
    formatRupiah(item.total_uang)
  ]);

  doc.autoTable({
    startY: 68,
    head: rtHeaders,
    body: rtData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }, // Dark slate
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
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
    `RT ${row.rt}`,
    formatDate(row.tanggal_setor),
    row.jenis_sampah,
    `${row.berat} Kg`,
    formatRupiah(row.harga_per_kg),
    formatRupiah(Number(row.berat) * Number(row.harga_per_kg))
  ]);

  doc.autoTable({
    startY: nextY > 240 ? 24 : nextY + 4,
    head: transHeaders,
    body: transData,
    headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 }
  });

  doc.save('laporan-akumulasi-bank-sampah.pdf');
};
