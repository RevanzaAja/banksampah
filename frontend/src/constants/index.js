export const WASTE_PRICES = {
  'Plastik': 4000,
  'Kertas': 2000,
  'Kardus': 3000,
  'Kaleng': 8000,
  'Botol': 5000,
  'Lainnya': 1000,
};

export const WASTE_TYPES = Object.keys(WASTE_PRICES);
export const RT_LIST = Array.from({ length: 9 }, (_, i) => i + 1);

export const INDONESIAN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export const formatRupiah = (value) => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};
