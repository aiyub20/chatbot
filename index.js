const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cek API key
if (!process.env.TOGETHER_API_KEY) {
  console.error('❌ TOGETHER_API_KEY tidak ditemukan di environment!');
}

function ekstrakAngka(text) {
  const angka = text.match(/-?\d+(\.\d+)?/g);
  return angka ? angka.map(Number) : [];
}

function hitungStatistik(angka, jenis) {
  if (!angka.length) return 'Tidak ditemukan data angka.';

  if (jenis === 'mean') {
    const jumlah = angka.reduce((a, b) => a + b, 0);
    const mean = jumlah / angka.length;

    return `Mean dari data tersebut adalah ${mean.toFixed(2)}. 📖 Dalam Islam, mean mencerminkan prinsip keadilan dan keseimbangan.`;
  }

  if (jenis === 'median') {
    const sorted = [...angka].sort((a, b) => a - b);
    const tengah = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[tengah - 1] + sorted[tengah]) / 2
      : sorted[tengah];
    return `Median dari data tersebut adalah ${median}. 📖 Median mencerminkan nilai tengah yang adil.`;
  }

  if (jenis === 'modus') {
    const frekuensi = {};
    angka.forEach(num => {
      frekuensi[num] = (frekuensi[num] || 0) + 1;
    });

    const maxFrekuensi = Math.max(...Object.values(frekuensi));
    const modus = Object.keys(frekuensi)
      .filter(k => frekuensi[k] === maxFrekuensi)
      .map(Number);

    return `Modus dari data tersebut adalah ${modus.join(', ')}. 📖 Modus mengajarkan pentingnya konsistensi dalam Islam.`;
  }

  return 'Jenis perhitungan tidak dikenal.';
}

function deteksiJenisHitung(text) {
  const lc = text.toLowerCase();

  if (lc.includes('apa itu') || lc.includes('pengertian') || lc.includes('fungsi') || lc.includes('kenapa')) {
    if (lc.includes('mean') || lc.includes('rata-rata')) return 'penjelasan_mean';
    if (lc.includes('median')) return 'penjelasan_median';
    if (lc.includes('modus')) return 'penjelasan_modus';
  }

  if (lc.includes('mean') || lc.includes('rata-rata')) return 'mean';
  if (lc.includes('median')) return 'median';
  if (lc.includes('modus')) return 'modus';

  return null;
}

// Endpoint utama
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const jenisHitung = deteksiJenisHitung(userMessage);

  console.log('[LOG] Pesan user:', userMessage);
  console.log('[LOG] Jenis hitung:', jenisHitung);

  if (['mean', 'median', 'modus'].includes(jenisHitung)) {
    const angka = ekstrakAngka(userMessage);
    if (!angka.length) {
      return res.json({ reply: 'Mohon masukkan data angka untuk dihitung, contoh: "Hitung mean dari 2, 4, 6"' });
    }
    const hasil = hitungStatistik(angka, jenisHitung);
    return res.json({ reply: hasil });
  }

  if (['penjelasan_mean', 'penjelasan_median', 'penjelasan_modus'].includes(jenisHitung)) {
    try {
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: `Kamu adalah chatbot AI bernama SAFINAH. Jelaskan statistik dasar kepada siswa SMA dengan nilai-nilai Islam.`
            },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const botReply = response.data.choices[0].message.content;
      return res.json({ reply: botReply });
    } catch (error) {
      console.error('❌ Gagal menghubungi Together API:', error.response?.data || error.message);
      return res.json({
        reply: 'Maaf, saya tidak bisa menjawab sekarang karena ada gangguan koneksi ke AI.'
      });
    }
  }

  return res.json({ reply: 'Maaf, saya belum mengerti pertanyaan Anda. Coba tanyakan tentang mean, median, atau modus.' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SAFINAH aktif di http://localhost:${PORT}`);
});
