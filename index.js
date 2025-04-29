const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variable dari .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// === Helper untuk hitung statistik dan nilai Islam ===
function ekstrakAngka(text) {
  const angka = text.match(/-?\d+(\.\d+)?/g);
  return angka ? angka.map(Number) : [];
}

function hitungStatistik(angka, jenis) {
  if (!angka.length) return 'Tidak ditemukan data angka.';

  if (jenis === 'mean') {
    const jumlah = angka.reduce((a, b) => a + b, 0);
    const mean = jumlah / angka.length;

    const penjelasanIslami = [
      `📖 Dalam Islam, rata-rata mencerminkan prinsip *keadilan*. Allah berfirman: *"Sesungguhnya Allah menyuruh (kamu) berlaku adil..."* (QS. An-Nahl: 90)`,
      `📖 Mean menunjukkan *keseimbangan* dalam data, seperti ajaran Islam tentang umat yang seimbang: *"Dan demikianlah Kami menjadikan kamu umat yang wasat (seimbang)..."* (QS. Al-Baqarah: 143)`,
      `📖 Menghitung mean mencerminkan semangat *hisab* (perhitungan), sebagaimana dalam Al-Qur’an: *"Dan timbanglah dengan timbangan yang adil..."* (QS. Al-Isra: 35)`,
      `📖 Rata-rata bisa membantu kita untuk *bersyukur* dan mengevaluasi nikmat Allah: *"Dan jika kamu menghitung nikmat Allah, kamu tak akan sanggup menghitungnya."* (QS. Ibrahim: 34)`
    ];

    // Pilih satu penjelasan secara acak
    const penjelasan = penjelasanIslami[Math.floor(Math.random() * penjelasanIslami.length)];

    return `Mean dari data tersebut adalah ${mean.toFixed(2)}.\n\n${penjelasan}`;
  }

  if (jenis === 'median') {
    const sorted = [...angka].sort((a, b) => a - b);
    const tengah = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[tengah - 1] + sorted[tengah]) / 2
        : sorted[tengah];

    const penjelasanIslami = [
      `📖 Median mencerminkan *keseimbangan* antara nilai-nilai ekstrem, selaras dengan prinsip tawazun dalam Islam: *"Dan Kami jadikan kamu umat yang wasat (seimbang)..."* (QS. Al-Baqarah: 143)`,
      `📖 Median mengajarkan pentingnya *tidak berlebihan* dalam segala hal. Islam memerintahkan untuk tidak berlebihan: *"...Dan janganlah kamu berlebih-lebihan. Sesungguhnya Allah tidak menyukai orang-orang yang berlebih-lebihan."* (QS. Al-A'raf: 31)`,
      `📖 Nilai tengah (median) bisa menggambarkan sikap *adil* dan moderat, yang sangat dijunjung dalam Islam: *"Dan hendaklah kamu berlaku adil. Sesungguhnya Allah menyukai orang-orang yang adil."* (QS. Al-Hujurat: 9)`
    ];

    const penjelasan = penjelasanIslami[Math.floor(Math.random() * penjelasanIslami.length)];

    return `Median dari data tersebut adalah ${median}.\n\n${penjelasan}`;
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

    const penjelasanIslami = [
      `📖 Modus menunjukkan *nilai yang paling sering muncul*, mengingatkan kita tentang pentingnya *perilaku baik yang konsisten*. Nabi bersabda: *"Amalan yang paling dicintai oleh Allah adalah yang paling kontinu meskipun sedikit."* (HR. Bukhari)`,
      `📖 Dalam Islam, kebiasaan yang baik harus *diulang dan dibiasakan*, sebagaimana modus menunjukkan frekuensi. Rasulullah SAW mengajarkan pentingnya *istiqamah* (konsistensi) dalam kebaikan.`,
      `📖 Modus mengajarkan kita untuk memperhatikan apa yang *sering terjadi* — dalam Islam, memperhatikan kebiasaan masyarakat bisa menjadi bagian dari amar ma’ruf nahi munkar.`
    ];

    const penjelasan = penjelasanIslami[Math.floor(Math.random() * penjelasanIslami.length)];

    return `Modus dari data tersebut adalah ${modus.join(', ')}.\n\n${penjelasan}`;
  }

  return 'Jenis perhitungan tidak dikenal.';
}

function deteksiJenisHitung(text) {
  const lc = text.toLowerCase();

  // Jika hanya bertanya penjelasan, bukan perhitungan
  if (lc.includes('apa itu') || lc.includes('pengertian') || lc.includes('fungsi') || lc.includes('mengapa') || lc.includes('kenapa')) {
    if (lc.includes('mean') || lc.includes('rata-rata')) return 'penjelasan_mean';
    if (lc.includes('median') || lc.includes('nilai tengah')) return 'penjelasan_median';
    if (lc.includes('modus') || lc.includes('nilai terbanyak')) return 'penjelasan_modus';
  }

  // Jika meminta hitung
  if (lc.includes('mean') || lc.includes('rata-rata')) return 'mean';
  if (lc.includes('median') || lc.includes('nilai tengah')) return 'median';
  if (lc.includes('modus') || lc.includes('nilai terbanyak')) return 'modus';

  return null;
}

// Endpoint utama
app.post('/chat', async (req, res) => {
  let userMessage = req.body.message;
  const jenisHitung = deteksiJenisHitung(userMessage);

  // === Kalau jenis perhitungan ditemukan (mean, median, modus) ===
  if (['mean', 'median', 'modus'].includes(jenisHitung)) {
    const angka = ekstrakAngka(userMessage);
    if (!angka.length) {
      return res.json({
        reply: `Sepertinya kamu belum menyebutkan data angkanya. Coba ketik contoh seperti: "Hitung mean dari 2, 4, 6, 8, 10".`,
      });
    }
    const hasil = hitungStatistik(angka, jenisHitung);
    return res.json({ reply: hasil });
  }

  // === Kalau hanya minta penjelasan konsep (tanpa angka) ===
  if (['penjelasan_mean', 'penjelasan_median', 'penjelasan_modus'].includes(jenisHitung)) {
    try {
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: `Kamu adalah chatbot AI bernama SAFINAH. Tugasmu adalah menjelaskan konsep statistik dasar seperti mean, median, dan modus kepada siswa SMA, dan mengaitkannya dengan nilai-nilai Islam seperti keadilan, tawazun, hisab, syukur, dsb. Gunakan bahasa sederhana.`
            },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply = response.data.choices[0].message.content;
      return res.json({ reply: botReply });
    } catch (error) {
      console.error('❌ Error dari Together.ai:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Terjadi kesalahan saat menghubungi Together.ai' });
    }
  }

  return res.json({ reply: 'Maaf, saya tidak mengerti pertanyaan Anda.' });
});

// Sajikan file HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ SAFINAH berjalan di http://localhost:${PORT}`);
});
