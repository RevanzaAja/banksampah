const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  get: async (path) => {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error('Gagal memuat data dari server.');
    return res.json();
  },
  post: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.');
    return data;
  },
  put: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.');
    return data;
  },
  delete: async (path) => {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.');
    return data;
  },
  download: async (path, filename) => {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error('Gagal mengunduh file.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
