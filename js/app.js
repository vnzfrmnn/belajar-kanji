// KODE AKSES — berisi SIDIK JARI SHA-256 (hex) dari kode, BUKAN kode aslinya.
// Hash dihitung dari kode yang di-trim + di-UPPERCASE-kan, jadi masukan tetap
// tidak peka huruf besar/kecil. Simpan daftar kode asli di tempat pribadi
// (JANGAN di repo). Tambah/revoke = hitung SHA-256 dari KODE.toUpperCase()
// lalu tambah/ganti hex di sini + deploy ulang.
// Dideklarasikan di global scope (bukan di dalam IIFE) supaya bisa dibaca oleh
// Views.renderGate() di js/views.js.
const ACCESS_CODE_HASHES = [
  '8c8d15df0c4adcd4553b073072ede6552f488fb824a333fee0c91cf1bd79b53f',
  '50101e139469dfe5a9cc74b0b5d06fb1493f155feb4e3535cfed3062b2873465',
  '028eb12b125d832d5b17ecfbc3ae09269670dd868d1c835393c2d0caee57b3f3',
  'fc294fed0e5203f1606967e9269c159ecd181500fe39d714fbcc8c65ade65d88',
  '1df36a71aa81553f72dca64bbc2568e19e949fb8f93d7583c6fc6d939ab13937',
  'b84b5fc96c0796975c4f357015e958a589c106061115396104feb12c411c1117',
  'ce176d0b277a11ed555c10a575c015b903f0ba2dd328675d2e9d15ea0e44b86b'
];
const GATE_KEY = 'kanji.gate.unlocked'; // PENTING: prefix beda dari kanji.v1.* agar Reset Progres tidak mengunci ulang

window.App = (function() {
  'use strict';

  let currentView = 'home';

  // Gerbang kode akses: kalau belum pernah unlock, tampilkan overlay-nya dan
  // TUNDAKAN init aplikasi (fetch data + render) sampai kodenya benar.
  function init() {
    loadTheme(); // tema dulu supaya gerbang ikut tema gelap/terang

    let unlocked = false;
    try {
      unlocked = localStorage.getItem(GATE_KEY) === '1';
    } catch (e) {
      unlocked = false; // localStorage bermasalah → anggap terkunci, tanya lagi
    }

    if (unlocked) {
      startApp();
      return;
    }

    document.body.classList.add('is-gated');
    if (typeof Views.renderGate === 'function') {
      document.body.append(Views.renderGate(onGateSuccess));
    } else {
      // Cache belum sinkron (views.js lama) — jangan sampai layar terkunci selamanya.
      console.warn('renderGate tidak tersedia — aplikasi dibuka tanpa gerbang.');
      startApp();
    }
  }

  // Callback sukses dari gerbang: simpan unlock, bersihkan DOM, lalu init aplikasi.
  function onGateSuccess() {
    try {
      localStorage.setItem(GATE_KEY, '1');
    } catch (e) {
      // localStorage gagal → cukup lanjut; pengunjung akan ditanya lagi di load berikutnya.
    }

    document.body.classList.remove('is-gated');
    const gate = document.getElementById('gate-overlay');
    if (gate) gate.remove();

    startApp();
  }

  // Init aplikasi "normal" — dipanggil sekali, baik lewat jalur unlock maupun
  // langsung dari localStorage yang sudah ter-unlock.
  function startApp() {
    setupThemeToggle();
    setupHeaderSocials();
    setupNavigation();
    loadData();
  }

  // Sosial di header: disuntik dari Views (satu sumber SOCIAL_LINKS),
  // ditempatkan sebelum theme-toggle agar judul tetap di kiri.
  function setupHeaderSocials() {
    const header = document.getElementById('header');
    const themeToggle = document.getElementById('theme-toggle');
    if (!header || !themeToggle || typeof Views.renderHeaderSocials !== 'function') return;
    header.insertBefore(Views.renderHeaderSocials(), themeToggle);
  }

  function loadTheme() {
    // try/catch: kalau localStorage diblokir, tema default tetap jalan
    // dan gerbang kode akses tetap bisa tampil.
    let theme = 'light';
    try {
      theme = localStorage.getItem('kanji.theme') || 'light';
    } catch (e) { /* abaikan */ }
    document.documentElement.setAttribute('data-theme', theme);
  }

  function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('kanji.theme', next);
    });
  }

  function setupNavigation() {
    const nav = document.getElementById('bottom-nav');
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;

      const view = btn.dataset.view;
      render(view);

      nav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  async function loadData() {
    try {
      const response = await fetch('kanji_1_200.json');
      const data = await response.json();
      Views.setData(data);
      render('home');
    } catch (error) {
      showError('Gagal memuat data kanji. Pastikan koneksi internet aktif pada kunjungan pertama.');
    }
  }

  function render(view) {
    currentView = view;
    Views.setCurrentView(view);
    const main = document.getElementById('main-content');
    main.innerHTML = '';

    let content;
    switch (view) {
      case 'home':
        content = Views.renderHome();
        document.getElementById('header-title').textContent = 'Belajar Kanji';
        break;
      case 'list':
        content = Views.renderList();
        document.getElementById('header-title').textContent = 'Daftar Kanji';
        break;
      case 'flashcard':
        content = Views.renderFlashcardSetup();
        document.getElementById('header-title').textContent = 'Flashcard';
        break;
      case 'quiz':
        content = Views.renderQuizSetup();
        document.getElementById('header-title').textContent = 'Kuis';
        break;
      default:
        content = Views.renderHome();
    }

    if (content) {
      main.append(content);
    }
  }

  function navigateToBlock(blockNo) {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    const content = Views.renderBlockDetail(blockNo);
    main.append(content);
    document.getElementById('header-title').textContent = `Blok ${blockNo}`;
  }

  function showError(message) {
    const main = document.getElementById('main-content');
    main.innerHTML = '';
    main.append(
      Views.el('div', { className: 'empty-state' },
        Views.el('div', { className: 'empty-state-icon' }, '⚠️'),
        Views.el('div', {}, message)
      )
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    render,
    navigateToBlock
  };
})();
