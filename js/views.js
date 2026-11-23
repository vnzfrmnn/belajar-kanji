window.Views = (function() {
  'use strict';

  let kanjiData = [];
  let currentView = 'home';
  const BLOCK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

  // Sakelar latar foto melayang. MATI untuk sementara; set true + kembalikan
  // BG_COUNT di sw.js & daftar gambar di build_zip saat ingin dinyalakan lagi.
  const ENABLE_BG_FLOATERS = false;

  // Blok 7 = seluruh area 300-400 (termasuk entri nyasar bernomor 700-896).
  // Blok 8 = 401-500.
  function blockRangeLabel(blockNo) {
    const start = blockNo === 8 ? 401 : (blockNo - 1) * 50 + 1;
    const end = blockNo === 2 ? 100 : (blockNo === 7 ? 400 : (blockNo === 8 ? 500 : blockNo * 50));
    return `No ${start}-${end}`;
  }

  // Konfigurasi link sosial — satu sumber untuk footer.
  const SOCIAL_LINKS = [
    { label: 'Instagram', href: 'https://www.instagram.com/vnzfrmnn_/' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@vnzfrmnn_' },
    { label: 'GitHub', href: 'https://github.com/vnzfrmnn' }
  ];

  const SOCIAL_ICONS = {
    Instagram:
      '<svg class="footer-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
    TikTok:
      '<svg class="footer-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.33 6.33 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"></path></svg>',
    GitHub:
      '<svg class="footer-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>'
  };

  function socialIcon(label) {
    const markup = SOCIAL_ICONS[label];
    if (!markup) return null;
    const tpl = document.createElement('template');
    tpl.innerHTML = markup.trim();
    return tpl.content.firstElementChild;
  }

  // Footer copyright + sosial. Dipanggil renderHome/renderList/renderBlockDetail.
  function renderFooter() {
    const year = new Date().getFullYear();

    const socials = el('div', { className: 'footer-socials' },
      SOCIAL_LINKS.map(item =>
        el('a', {
          className: 'footer-social-link',
          href: item.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': item.label
        }, socialIcon(item.label), item.label)
      )
    );

    return el('footer', { className: 'app-footer' },
      el('div', { className: 'footer-copy' }, `© ${year} Vanzy — Dibuat oleh Vanzy`),
      socials
    );
  }

  // Grup ikon sosial untuk header — ikon-only, dibangun dari SOCIAL_LINKS.
  function renderHeaderSocials() {
    return el('div', { className: 'header-socials', 'aria-label': 'Sosial' },
      SOCIAL_LINKS.map(item =>
        el('a', {
          className: 'header-social-link',
          href: item.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': item.label,
          title: item.label
        }, socialIcon(item.label))
      )
    );
  }

  // --- Latar belakang melayang (dekoratif) ------------------------------
  // 10 foto berbentuk lingkaran yang bergerak acak "ke sana kemari" di
  // BELAKANG seluruh konten aplikasi. Latar navy/gelap yang sudah ada tetap
  // terlihat (layer ini transparan). Murni dekoratif: aria-hidden + pointer-
  // events none, jadi tidak menghalangi klik/scroll.
  //
  // Dipasang SEKALI dari js/app.js (append ke document.body). Id unik
  // #bg-floaters + guard di bawah menjamin tidak dobel walau fungsi ini
  // terpanggil lagi saat pindah view.
  function randBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function renderBackgroundFloaters() {
    if (!ENABLE_BG_FLOATERS) return null;
    const existing = document.getElementById('bg-floaters');
    if (existing) return existing; // sudah terpakai — jangan duplikat

    // 30 foto latar (bg-1..bg-30). Menambah foto: taruh image/bg-N.jpg lalu
    // samakan angka ini dengan BG_COUNT di sw.js.
    const BG_IMAGES = Array.from({ length: 30 }, (_, i) => `image/bg-${i + 1}.jpg`);

    const layer = el('div', { id: 'bg-floaters', 'aria-hidden': 'true' });

    // 3 titik simpul perjalanan (rentang ±70–180px, arah acak) — offset
    // besar + durasi singkat supaya gerakannya langsung terlihat.
    function waypoint() {
      const mag = () => {
        const m = Math.round(randBetween(70, 180));
        return (Math.random() < 0.5 ? -m : m);
      };
      return [mag(), mag()];
    }

    for (let i = 0; i < BG_IMAGES.length; i++) {
      const size = Math.round(randBetween(56, 96));              // ukuran ±56–96px
      const left = randBetween(5, 95).toFixed(1);                // 5–95% lebar
      const top = randBetween(5, 90).toFixed(1);                 // 5–90% tinggi
      const opacity = randBetween(0.2, 0.38).toFixed(2);         // tetap terbaca
      const duration = randBetween(13, 24).toFixed(1);           // 13–24 detik (cepat terlihat)
      const delay = (-randBetween(0, 24)).toFixed(1);            // delay negatif → tidak serempak
      const p1 = waypoint();
      const p2 = waypoint();
      const p3 = waypoint();

      const style =
        `--bg-size:${size}px;--bg-left:${left}%;--bg-top:${top}%;` +
        `--bg-op:${opacity};--bg-dur:${duration}s;--bg-delay:${delay}s;` +
        `--bg-dx1:${p1[0]}px;--bg-dy1:${p1[1]}px;` +
        `--bg-dx2:${p2[0]}px;--bg-dy2:${p2[1]}px;` +
        `--bg-dx3:${p3[0]}px;--bg-dy3:${p3[1]}px;`;

      const circle = el('div', { className: 'bg-float', style },
        el('img', {
          src: BG_IMAGES[i],
          alt: '',
          loading: 'lazy',
          decoding: 'async'
        })
      );
      layer.append(circle);
    }

    // Jeda animasi saat tab tidak terlihat (hemat daya). Listener cuma
    // sekali karena guard di atas membuat fungsi ini idempoten.
    document.addEventListener('visibilitychange', () => {
      layer.classList.toggle('bg-paused', document.hidden);
    });

    return layer;
  }

  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') element.className = value;
      else if (key === 'onclick') element.onclick = value;
      else if (key.startsWith('data-') || key.startsWith('aria-')) element.setAttribute(key, value);
      else element[key] = value;
    });
    children.flat().forEach(child => {
      if (child != null) {
        element.append(typeof child === 'string' ? child : child);
      }
    });
    return element;
  }

  function setData(data) {
    kanjiData = data;
    // Daftarkan blok nyata ke progres supaya total & peta blok selalu sinkron.
    if (window.KanjiProgress && typeof window.KanjiProgress.setData === 'function') {
      window.KanjiProgress.setData(data);
    }
  }

  function getData() {
    return kanjiData;
  }

  function getEntryById(id) {
    return kanjiData.find(e => e.id === id);
  }

  function getEntriesByBlock(blockNo) {
    if (blockNo === 0) return kanjiData;
    return kanjiData.filter(e => e.blok === blockNo);
  }

  function renderHome() {
    const totalProgress = KanjiProgress.getScopeProgress(0);
    const lastBlock = KanjiProgress.getLastBlock() || 1;

    const container = el('div', { className: 'fade-in' },
      el('div', { className: 'progress-overview' },
        el('h2', {}, 'Progres Total'),
        el('div', { className: 'progress-main' }, `${totalProgress.hafal}/${kanjiData.length}`),
        el('div', { className: 'progress-label' }, `${totalProgress.persen}% kanji dikuasai`)
      ),
      el('button', {
        className: 'btn btn-primary',
        style: 'width: 100%; margin-bottom: 24px;',
        onclick: () => window.App.navigateToBlock(lastBlock)
      }, `Lanjutkan Belajar - Blok ${lastBlock}`)
    );

    const blockGrid = el('div', { className: 'block-grid' });
    BLOCK_NUMBERS.forEach(blockNo => {
      const entries = getEntriesByBlock(blockNo);
      const progress = KanjiProgress.getBlockProgress(blockNo);
      const quizBest = KanjiProgress.getQuizBest(blockNo);
      const passed = quizBest !== null && quizBest >= 80;

      const blockCard = el('div', {
        className: 'card block-card card-clickable',
        onclick: () => window.App.navigateToBlock(blockNo)
      },
        el('div', { className: 'block-header' },
          el('div', {},
            el('h3', { className: 'block-title' }, `Blok ${blockNo}`),
            el('div', { className: 'block-range' }, `${blockRangeLabel(blockNo)} • ${entries.length} entri`)
          ),
          passed ? el('span', { className: 'badge badge-success' }, '✓ Lulus') : null
        ),
        el('div', { className: 'block-stats' },
          el('div', { className: 'stat-item' },
            el('div', { className: 'stat-label' }, 'Hafal'),
            el('div', { className: 'stat-value' }, `${progress.hafal}/${entries.length}`)
          ),
          el('div', { className: 'stat-item' },
            el('div', { className: 'stat-label' }, 'Skor Terbaik'),
            el('div', { className: 'stat-value' }, quizBest !== null ? `${quizBest}%` : '-')
          )
        )
      );
      blockGrid.append(blockCard);
    });

    container.append(blockGrid);

    const resetBtn = el('button', {
      className: 'btn btn-ghost',
      style: 'width: 100%; margin-top: 32px;',
      onclick: () => {
        if (confirm('Reset semua progres? Semua data hafal dan skor kuis akan dihapus. Tindakan ini tidak dapat dibatalkan.')) {
          KanjiProgress.resetProgress();
          window.App.render('home');
        }
      }
    }, '🔄 Reset Progres');

    container.append(resetBtn, renderFooter());
    return container;
  }

  function renderList() {
    const container = el('div', { className: 'list-container fade-in' });

    const searchBox = el('input', {
      type: 'text',
      className: 'search-box',
      placeholder: 'Cari kanji, bacaan, atau arti...',
      id: 'search-input'
    });

    const filterBlock = el('div', { className: 'filter-group', id: 'filter-block' },
      el('button', { className: 'filter-btn active', 'data-block': '0' }, 'Semua'),
      BLOCK_NUMBERS.map(blockNo =>
        el('button', { className: 'filter-btn', 'data-block': String(blockNo) }, 'Blok ' + blockNo)
      )
    );

    const filterType = el('div', { className: 'filter-group', id: 'filter-type' },
      el('button', { className: 'filter-btn active', 'data-type': 'all' }, 'Semua'),
      el('button', { className: 'filter-btn', 'data-type': 'kanji' }, 'Kanji'),
      el('button', { className: 'filter-btn', 'data-type': 'kosakata' }, 'Kosakata')
    );

    const filterStatus = el('div', { className: 'filter-group', id: 'filter-status' },
      el('button', { className: 'filter-btn active', 'data-status': 'all' }, 'Semua'),
      el('button', { className: 'filter-btn', 'data-status': 'hafal' }, 'Hafal'),
      el('button', { className: 'filter-btn', 'data-status': 'belum' }, 'Belum')
    );

    const kanjiList = el('div', { className: 'kanji-list', id: 'kanji-list' });

    container.append(
      el('h2', { className: 'section-title' }, 'Daftar Kanji'),
      searchBox,
      filterBlock,
      filterType,
      filterStatus,
      kanjiList
    );

    const state = { search: '', block: 0, type: 'all', status: 'all' };

    function updateList() {
      let filtered = kanjiData;

      if (state.search) {
        const q = state.search.toLowerCase();
        filtered = filtered.filter(e =>
          e.kanji.includes(q) ||
          e.bacaan.some(b => b.toLowerCase().includes(q)) ||
          (e.arti && e.arti.toLowerCase().includes(q))
        );
      }

      if (state.block !== 0) {
        filtered = filtered.filter(e => e.blok === state.block);
      }

      if (state.type !== 'all') {
        filtered = filtered.filter(e => e.tipe === state.type);
      }

      if (state.status !== 'all') {
        filtered = filtered.filter(e => {
          const isHafal = KanjiProgress.isHafal(e.id);
          return state.status === 'hafal' ? isHafal : !isHafal;
        });
      }

      kanjiList.innerHTML = '';
      if (filtered.length === 0) {
        kanjiList.append(
          el('div', { className: 'empty-state' },
            el('div', { className: 'empty-state-icon' }, '🔍'),
            el('div', {}, 'Tidak ada kanji yang cocok')
          )
        );
      } else {
        filtered.forEach(entry => {
          const isHafal = KanjiProgress.isHafal(entry.id);
          const item = el('div', {
            className: 'kanji-item',
            onclick: () => showKanjiDetail(entry.id)
          },
            el('div', { className: 'kanji-char' }, entry.kanji),
            el('div', { className: 'kanji-info' },
              el('div', { className: 'kanji-reading' }, entry.bacaan.join(', ')),
              el('div', { className: 'kanji-meaning' }, entry.arti || '(tidak ada arti)')
            ),
            el('div', { className: `kanji-status ${isHafal ? 'hafal' : 'belum'}` })
          );
          kanjiList.append(item);
        });
      }
    }

    searchBox.addEventListener('input', (e) => {
      state.search = e.target.value;
      updateList();
    });

    filterBlock.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterBlock.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.block = parseInt(e.target.dataset.block);
        updateList();
      }
    });

    filterType.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterType.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.type = e.target.dataset.type;
        updateList();
      }
    });

    filterStatus.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filterStatus.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.status = e.target.dataset.status;
        updateList();
      }
    });

    updateList();
    container.append(renderFooter());
    return container;
  }

  function showKanjiDetail(id) {
    const entry = getEntryById(id);
    if (!entry) return;

    const isHafal = KanjiProgress.isHafal(entry.id);
    const canSpeak = 'speechSynthesis' in window;

    const modal = el('div', { className: 'modal', id: 'kanji-modal' },
      el('div', { className: 'modal-content' },
        el('div', { className: 'modal-header' },
          el('h3', { className: 'modal-title' }, 'Detail Kanji'),
          el('button', {
            className: 'icon-btn',
            onclick: () => document.getElementById('kanji-modal').remove()
          }, '✕')
        ),
        el('div', { className: 'modal-body' },
          el('div', { className: 'kanji-detail-char' }, entry.kanji),
          el('div', { className: 'kanji-detail-info' },
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Nomor'),
              el('div', { className: 'info-value' }, `${entry.no}`)
            ),
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Blok'),
              el('div', { className: 'info-value' }, `Blok ${entry.blok}`)
            ),
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Tipe'),
              el('div', { className: 'info-value' }, entry.tipe === 'kanji' ? 'Kanji' : 'Kosakata')
            ),
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Bacaan'),
              el('div', { className: 'info-value' }, entry.bacaan.join(', '))
            ),
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Arti'),
              el('div', { className: 'info-value' }, entry.arti || '(tidak ada arti)')
            ),
            el('div', { className: 'info-row' },
              el('div', { className: 'info-label' }, 'Status'),
              el('div', { className: 'info-value' }, isHafal ? '✓ Hafal' : 'Belum hafal')
            )
          )
        ),
        el('div', { className: 'modal-actions' },
          canSpeak ? el('button', {
            className: 'btn btn-secondary',
            onclick: () => speakText(entry.bacaan[0])
          }, '🔊 Dengar') : null,
          el('button', {
            className: `btn ${isHafal ? 'btn-secondary' : 'btn-success'}`,
            onclick: () => {
              KanjiProgress.setStatus(entry.id, isHafal ? 'belum' : 'hafal');
              document.getElementById('kanji-modal').remove();
              if (currentView === 'list') {
                window.App.render('list');
              }
            }
          }, isHafal ? 'Tandai Belum Hafal' : 'Tandai Hafal')
        )
      )
    );

    document.body.append(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }

  function renderFlashcard(scope = 1, acak = false) {
    const entries = getEntriesByBlock(scope);
    if (entries.length === 0) {
      return el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state-icon' }, '📚'),
        el('div', {}, 'Tidak ada kartu tersedia')
      );
    }

    let queue = KanjiFlashcards.buildQueue(entries, { acak });
    let currentIndex = 0;
    let isFlipped = false;

    const TAP_THRESHOLD = 10;
    const SWIPE_THRESHOLD = 56;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchAxis = null; // null | 'x' | 'y'
    let suppressClickUntil = 0;

    const container = el('div', { className: 'flashcard-container fade-in' });

    const info = el('div', { className: 'flashcard-info' }, `Kartu 1 dari ${queue.length}`);

    const flashcard = el('div', { className: 'flashcard', id: 'flashcard' });
    const canSpeak = 'speechSynthesis' in window;

    function activeCard() {
      if (currentIndex < 0 || currentIndex >= queue.length) return null;
      const local = queue[currentIndex];
      try {
        const card = KanjiFlashcards.current(queue, currentIndex);
        if (card && card.id === local.id) return card;
      } catch (err) {
        // pakai kartu lokal
      }
      return local;
    }

    function resolveIndex(name, fallback) {
      try {
        const idx = KanjiFlashcards[name](queue, currentIndex);
        if (Number.isInteger(idx) && idx >= 0 && idx < queue.length) {
          if (queue.length > 1 && idx === currentIndex) return fallback;
          return idx;
        }
      } catch (err) {
        // antrean kosong / API belum siap -> pakai fallback
      }
      return fallback;
    }

    function applySlide(direction) {
      flashcard.style.transition = '';
      flashcard.style.transform = '';
      flashcard.style.opacity = '';
      flashcard.classList.remove('slide-next', 'slide-prev');
      void flashcard.offsetWidth; // restart animasi
      flashcard.classList.add(direction === 'prev' ? 'slide-prev' : 'slide-next');
    }

    function moveTo(index, direction) {
      if (queue.length === 0) return;
      const before = activeCard();
      currentIndex = index;
      renderCard();
      const after = activeCard();
      if (after && (!before || after.id !== before.id)) applySlide(direction);
    }

    function goNext() {
      if (queue.length === 0) return;
      moveTo(resolveIndex('nextIndex', (currentIndex + 1) % queue.length), 'next');
    }

    function goPrev() {
      if (queue.length === 0) return;
      moveTo(resolveIndex('prevIndex', (currentIndex - 1 + queue.length) % queue.length), 'prev');
    }

    function handleMark(result) {
      const before = activeCard();
      if (!before) return;
      queue = KanjiFlashcards.mark(queue, currentIndex, result);
      KanjiProgress.setStatus(before.entry.id, result);

      let direction = 'next';
      if (currentIndex >= queue.length) {
        // kartu terakhir di-mark 'hafal': bungkus ke kartu tersisa, atau sesi selesai
        currentIndex = Math.max(0, queue.length - 1);
        direction = 'prev';
      }

      const after = activeCard();
      renderCard();
      if (after && after.id !== before.id) applySlide(direction);
    }

    function renderCard() {
      const current = activeCard();
      if (!current) {
        container.innerHTML = '';
        container.append(
          el('div', { className: 'empty-state' },
            el('div', { className: 'empty-state-icon' }, '🎉'),
            el('h2', {}, 'Sesi Selesai!'),
            el('div', {}, `Anda telah menyelesaikan ${entries.length} kartu`),
            el('button', {
              className: 'btn btn-primary',
              style: 'margin-top: 24px;',
              onclick: () => window.App.render('flashcard')
            }, 'Mulai Lagi')
          )
        );
        return;
      }

      const entry = current.entry;
      isFlipped = false;

      const inner = el('div', { className: 'flashcard-inner' },
        el('div', { className: 'flashcard-face flashcard-front' },
          el('div', { className: 'flashcard-kanji' }, entry.kanji),
          el('div', { className: 'flashcard-hint' }, 'Ketuk untuk melihat jawaban')
        ),
        el('div', { className: 'flashcard-face flashcard-back' },
          el('div', { className: 'flashcard-reading' }, entry.bacaan.join(', ')),
          el('div', { className: 'flashcard-meaning' }, entry.arti || '(tidak ada arti)'),
          canSpeak ? el('button', {
            className: 'btn btn-secondary',
            onclick: (e) => {
              e.stopPropagation();
              speakText(entry.bacaan[0]);
            }
          }, '🔊 Dengar') : null
        )
      );

      flashcard.innerHTML = '';
      flashcard.className = 'flashcard';
      flashcard.style.transition = '';
      flashcard.style.transform = '';
      flashcard.style.opacity = '';
      flashcard.append(inner);
      flashcard.onclick = () => {
        if (Date.now() < suppressClickUntil) return;
        isFlipped = !isFlipped;
        flashcard.classList.toggle('flipped', isFlipped);
      };

      info.textContent = `Kartu ${currentIndex + 1} dari ${queue.length}`;
    }

    // --- Gesture: geser kiri = kartu berikutnya, geser kanan = kartu sebelumnya
    flashcard.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchAxis = null;
      flashcard.style.transition = 'none';
      flashcard.style.transform = '';
      flashcard.style.opacity = '';
    }, { passive: true });

    flashcard.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1 || touchAxis === 'y') return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (touchAxis === null) {
        if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD) return;
        touchAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (touchAxis === 'x') suppressClickUntil = Date.now() + 450;
        if (touchAxis === 'y') return;
      }

      flashcard.style.transform = `translateX(${dx}px)`;
      flashcard.style.opacity = String(1 - Math.min(Math.abs(dx) / 480, 0.3));
    }, { passive: true });

    function finishTouch(e, allowNavigate) {
      if (touchAxis !== 'x') {
        touchAxis = null;
        flashcard.style.transition = '';
        flashcard.style.transform = '';
        flashcard.style.opacity = '';
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStartX;
      touchAxis = null;
      flashcard.style.transition = '';
      flashcard.style.transform = '';
      flashcard.style.opacity = '';

      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        suppressClickUntil = Date.now() + 450;
        if (allowNavigate) {
          if (dx < 0) goNext();
          else goPrev();
        }
      }
    }

    flashcard.addEventListener('touchend', (e) => finishTouch(e, true), { passive: true });
    flashcard.addEventListener('touchcancel', (e) => finishTouch(e, false), { passive: true });

    const navRow = el('div', { className: 'flashcard-nav' },
      el('button', {
        className: 'flashcard-nav-btn',
        'aria-label': 'Kartu sebelumnya',
        onclick: goPrev
      }, '‹'),
      el('button', {
        className: 'flashcard-nav-btn',
        'aria-label': 'Kartu berikutnya',
        onclick: goNext
      }, '›')
    );

    const swipeHint = el('div', { className: 'flashcard-swipe-hint' },
      'Geser ke kiri: lanjut • ke kanan: kembali'
    );

    const actions = el('div', { className: 'flashcard-actions' },
      el('button', {
        className: 'btn btn-secondary',
        onclick: () => handleMark('belum')
      }, 'Belum Hafal'),
      el('button', {
        className: 'btn btn-success',
        onclick: () => handleMark('hafal')
      }, 'Hafal')
    );

    const controls = el('div', { className: 'flashcard-controls' },
      el('button', {
        className: 'btn btn-ghost',
        onclick: () => window.App.render('flashcard')
      }, '⚙️ Ubah Pengaturan')
    );

    container.append(info, flashcard, navRow, swipeHint, actions, controls);
    renderCard();
    return container;
  }

  function renderFlashcardSetup() {
    const container = el('div', { className: 'fade-in' });

    let selectedScope = 1;
    let acak = false;

    const title = el('h2', { className: 'section-title' }, 'Pengaturan Flashcard');

    const scopeLabel = el('div', { style: 'margin-bottom: 8px; font-weight: 500;' }, 'Pilih Lingkup:');
    const scopeGroup = el('div', { className: 'filter-group', id: 'scope-group' },
      BLOCK_NUMBERS.map(blockNo =>
        el('button', {
          className: 'filter-btn' + (blockNo === 1 ? ' active' : ''),
          'data-scope': String(blockNo)
        }, 'Blok ' + blockNo)
      ),
      el('button', { className: 'filter-btn', 'data-scope': '0' }, 'Semua Blok')
    );

    const acakLabel = el('div', { style: 'margin: 24px 0 8px; font-weight: 500;' }, 'Urutan:');
    const acakGroup = el('div', { className: 'filter-group', id: 'acak-group' },
      el('button', { className: 'filter-btn active', 'data-acak': 'false' }, 'Berurutan'),
      el('button', { className: 'filter-btn', 'data-acak': 'true' }, 'Acak')
    );

    const startBtn = el('button', {
      className: 'btn btn-primary',
      style: 'width: 100%; margin-top: 32px;',
      onclick: () => {
        const content = renderFlashcard(selectedScope, acak);
        document.getElementById('main-content').innerHTML = '';
        document.getElementById('main-content').append(content);
      }
    }, 'Mulai Belajar');

    scopeGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        scopeGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedScope = parseInt(e.target.dataset.scope);
      }
    });

    acakGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        acakGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        acak = e.target.dataset.acak === 'true';
      }
    });

    container.append(title, scopeLabel, scopeGroup, acakLabel, acakGroup, startBtn);
    return container;
  }

  function renderQuizSetup() {
    const container = el('div', { className: 'fade-in' });

    let selectedScope = 1;
    let selectedJenis = 'kanji-arti';
    let selectedJumlah = 10; // nilai jumlah valid terakhir (dipakai sebagai state cadangan)
    let jumlahSemua = false; // true bila chip "Semua" yang aktif
    // Pilih Kanji (opsional) — mode manual: id entri yang dicentang user.
    const selection = new Set();

    const title = el('h2', { className: 'section-title' }, 'Pengaturan Kuis');

    const scopeLabel = el('div', { style: 'margin-bottom: 8px; font-weight: 500;' }, 'Pilih Lingkup:');
    const scopeGroup = el('div', { className: 'filter-group', id: 'scope-group' },
      BLOCK_NUMBERS.map(blockNo =>
        el('button', {
          className: 'filter-btn' + (blockNo === 1 ? ' active' : ''),
          'data-scope': String(blockNo)
        }, 'Blok ' + blockNo)
      ),
      el('button', { className: 'filter-btn', 'data-scope': '0' }, 'Semua Blok')
    );

    const jenisLabel = el('div', { style: 'margin: 24px 0 8px; font-weight: 500;' }, 'Jenis Soal:');
    const jenisGroup = el('div', { className: 'filter-group', id: 'jenis-group' },
      el('button', { className: 'filter-btn active', 'data-jenis': 'kanji-arti' }, 'Kanji → Arti'),
      el('button', { className: 'filter-btn', 'data-jenis': 'kanji-bacaan' }, 'Kanji → Bacaan (romaji)')
    );

    // Jumlah soal — SATU input angka bebas (min. 10) + chip "Semua (N)" sebaris.
    const jumlahLabel = el('label', {
      htmlFor: 'jumlah-input',
      style: 'display: block; margin: 24px 0 8px; font-weight: 500;'
    }, 'Jumlah Soal');
    const jumlahInput = el('input', {
      id: 'jumlah-input',
      className: 'jumlah-input',
      type: 'number',
      inputMode: 'numeric',
      autocomplete: 'off',
      min: '10',
      step: '1',
      value: '10',
      placeholder: 'mis. 10',
      'aria-describedby': 'jumlah-help'
    });
    const semuaChip = el('button', {
      className: 'filter-btn',
      type: 'button',
      'data-jumlah': 'all'
    }, `Semua (${getEntriesByBlock(selectedScope).length})`);
    const jumlahRow = el('div', { className: 'jumlah-row' }, jumlahInput, semuaChip);
    const jumlahHelp = el('p', { id: 'jumlah-help', className: 'jumlah-help' },
      'Min. 10 — atau centang kanji di bawah untuk memilih manual.');
    const jumlahError = el('p', { className: 'jumlah-error', hidden: true });
    jumlahError.setAttribute('role', 'alert');

    function showJumlahError() {
      jumlahError.textContent = 'Minimal 10 soal';
      jumlahError.hidden = false;
      jumlahInput.setAttribute('aria-invalid', 'true');
      jumlahInput.focus();
    }

    function clearJumlahError() {
      jumlahError.hidden = true;
      jumlahInput.removeAttribute('aria-invalid');
    }

    // --- Pilih Kanji (opsional) — checklist entri lingkup untuk mode kuis manual.
    // Baris yang sudah "hafal" tetap muncul & bisa dicentang (tes ulang).
    const pickCount = el('span', { className: 'pick-count' }, '0 dipilih');
    const pickList = el('div', {
      className: 'kanji-pick-list',
      'aria-label': 'Daftar kanji untuk dipilih'
    });

    function updatePickCount() {
      pickCount.textContent = `${selection.size} dipilih`;
    }

    function renderPickList() {
      pickList.innerHTML = '';
      getEntriesByBlock(selectedScope).forEach(entry => {
        const isChecked = selection.has(entry.id);
        const reading = Array.isArray(entry.bacaan) ? (entry.bacaan[0] || '') : '';
        const arti = typeof entry.arti === 'string' ? entry.arti.trim() : '';
        const meta = arti ? `${reading} • ${arti}` : reading;
        const inputId = `pick-${entry.id}`;

        const checkbox = el('input', {
          type: 'checkbox',
          id: inputId,
          checked: isChecked
        });
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selection.add(entry.id);
          else selection.delete(entry.id);
          row.classList.toggle('is-checked', checkbox.checked);
          updatePickCount();
        });

        const row = el('label', {
          className: `kanji-pick-row${isChecked ? ' is-checked' : ''}`,
          htmlFor: inputId
        },
          checkbox,
          el('span', { className: 'kanji-pick-char' }, entry.kanji),
          el('span', { className: 'kanji-pick-meta' }, meta)
        );
        pickList.append(row);
      });
    }

    const pickHeader = el('div', { className: 'pick-header' },
      el('div', { className: 'pick-header-top' },
        el('span', { className: 'pick-label' }, 'Pilih Kanji (opsional)'),
        pickCount
      ),
      el('div', { className: 'pick-actions' },
        el('button', {
          className: 'pick-mini-btn',
          type: 'button',
          onclick: () => {
            getEntriesByBlock(selectedScope).forEach(e => selection.add(e.id));
            renderPickList();
            updatePickCount();
          }
        }, 'Pilih Semua'),
        el('button', {
          className: 'pick-mini-btn',
          type: 'button',
          onclick: () => {
            selection.clear();
            renderPickList();
            updatePickCount();
          }
        }, 'Hapus Pilihan')
      )
    );

    const startBtn = el('button', {
      className: 'btn btn-primary',
      style: 'width: 100%; margin-top: 32px;',
      onclick: () => {
        const scopeEntries = getEntriesByBlock(selectedScope);
        let jumlah;
        let entriesOverride = null;

        // Mode manual: ada checklist "Pilih Kanji" -> pakai entri terpilih apa
        // adanya (boleh 1-9 soal), tanpa validasi min. 10.
        if (selection.size > 0) {
          const picked = scopeEntries.filter(en => selection.has(en.id));
          if (picked.length > 0) {
            jumlah = selection.size;
            entriesOverride = picked;
          }
        }

        // Mode angka: perilaku lama (input min. 10 / chip "Semua", cap stok).
        if (entriesOverride === null) {
          if (jumlahSemua) {
            // Chip "Semua" aktif -> jumlah = jumlah entri lingkup.
            jumlah = scopeEntries.length;
          } else {
            const raw = jumlahInput.value.trim();
            const parsed = Number(raw);
            // Kosong / bukan angka / di bawah 10 -> tampilan error, kuis tidak dimulai.
            if (raw === '' || !Number.isFinite(parsed) || parsed < 10) {
              showJumlahError();
              return;
            }
            jumlah = Math.floor(parsed);
            selectedJumlah = jumlah;
            // Melebihi stok lingkup -> cap otomatis (intent = semua), tanpa error.
            if (jumlah > scopeEntries.length) jumlah = scopeEntries.length;
          }
        }

        clearJumlahError();
        const content = renderQuiz(selectedScope, selectedJenis, jumlah, entriesOverride);
        document.getElementById('main-content').innerHTML = '';
        document.getElementById('main-content').append(content);
      }
    }, 'Mulai Kuis');

    scopeGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        scopeGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedScope = parseInt(e.target.dataset.scope);
        // Hitung ulang label "Semua (N)" saat lingkup berubah.
        const total = getEntriesByBlock(selectedScope).length;
        semuaChip.textContent = `Semua (${total})`;
        if (jumlahSemua) {
          selectedJumlah = total;
          jumlahInput.value = String(total);
        }
        // Mode manual: buang id di luar lingkup baru, hitung ulang counter.
        const scopeIds = new Set(getEntriesByBlock(selectedScope).map(en => en.id));
        selection.forEach(id => { if (!scopeIds.has(id)) selection.delete(id); });
        renderPickList();
        updatePickCount();
      }
    });

    jenisGroup.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        jenisGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        selectedJenis = e.target.dataset.jenis;
      }
    });

    // Chip "Semua" -> mode semua entri lingkup; input mengikuti angka lingkup.
    semuaChip.addEventListener('click', () => {
      jumlahSemua = true;
      semuaChip.classList.add('active');
      const total = getEntriesByBlock(selectedScope).length;
      selectedJumlah = total;
      jumlahInput.value = String(total);
      clearJumlahError();
    });

    // Mengetik di input = angka bebas; keluar dari mode "Semua" dan bersihkan error.
    jumlahInput.addEventListener('input', () => {
      jumlahSemua = false;
      semuaChip.classList.remove('active');
      clearJumlahError();
      const raw = jumlahInput.value.trim();
      const parsed = Number(raw);
      if (raw !== '' && Number.isFinite(parsed) && parsed >= 10) {
        selectedJumlah = Math.floor(parsed);
      }
    });

    renderPickList();

    container.append(title, scopeLabel, scopeGroup, jenisLabel, jenisGroup,
      jumlahLabel, jumlahRow, jumlahHelp, jumlahError,
      pickHeader, pickList, startBtn);
    return container;
  }

  function renderQuiz(scope = 1, jenis = 'kanji-arti', jumlah = 10, entriesOverride) {
    // entriesOverride: mode manual "Pilih Kanji" — pakai entri hasil seleksi,
    // bukan seluruh lingkup. Tanpa override -> perilaku lama (entri lingkup).
    const entries = Array.isArray(entriesOverride) ? entriesOverride : getEntriesByBlock(scope);
    let questions = KanjiQuiz.buildTypedQuestions(entries, { jenis, jumlah: jumlah, acak: true });

    if (questions.length === 0) {
      return el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state-icon' }, '❌'),
        el('div', {}, 'Tidak cukup entri untuk membuat kuis'),
        el('button', {
          className: 'btn btn-primary',
          style: 'margin-top: 24px;',
          onclick: () => window.App.render('quiz')
        }, 'Kembali')
      );
    }

    let currentIndex = 0;
    let userAnswers = [];

    const container = el('div', { className: 'quiz-container fade-in' });

    function placeholderFor(j) {
      return j === 'kanji-arti' ? 'Tulis arti...' : 'Tulis bacaan pakai romaji, contoh: ichi';
    }

    function renderQuestion() {
      if (currentIndex >= questions.length) {
        renderResult();
        return;
      }

      const q = questions[currentIndex];
      const qJenis = q.jenis || jenis;
      let submitted = false;

      const header = el('div', { className: 'quiz-header' },
        el('div', { className: 'quiz-progress' }, `Soal ${currentIndex + 1} dari ${questions.length}`),
        el('button', {
          className: 'btn btn-ghost',
          onclick: () => {
            if (confirm('Keluar dari kuis? Progres tidak akan disimpan.')) {
              window.App.render('quiz');
            }
          }
        }, 'Keluar')
      );

      const question = el('div', { className: 'quiz-question' },
        el('div', { className: 'quiz-prompt' }, q.prompt),
        q.promptSub ? el('div', { className: 'quiz-prompt-sub' }, q.promptSub) : null
      );

      const input = el('input', {
        className: 'quiz-input',
        placeholder: placeholderFor(qJenis)
      });
      input.setAttribute('type', 'text');
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocapitalize', 'none');
      input.setAttribute('spellcheck', 'false');

      const feedback = el('div', { className: 'quiz-feedback' });
      feedback.setAttribute('aria-live', 'polite');

      const submitBtn = el('button', { className: 'btn btn-primary', style: 'width: 100%;' }, 'Periksa Jawaban');

      function advance() {
        currentIndex++;
        renderQuestion();
      }

      function submit() {
        if (submitted) return; // guard: Enter/click hanya sekali sampai lanjut
        submitted = true;

        const raw = typeof input.value === 'string' ? input.value : '';
        const correct = KanjiQuiz.checkTyped(q, raw);
        userAnswers.push({ question: q, typed: raw.trim(), correct });

        if (correct) KanjiProgress.removeFromReview(q.entryId);
        else KanjiProgress.addToReview(q.entryId);

        input.disabled = true;
        feedback.classList.add(correct ? 'is-correct' : 'is-wrong');

        const kanaList = Array.isArray(q.kana) ? q.kana : [];
        const romajiList = Array.isArray(q.romaji) ? q.romaji : [];
        const kana0 = kanaList[0] || '';
        const romaji0 = romajiList[0] || '';

        if (qJenis === 'kanji-bacaan') {
          if (correct) {
            feedback.append(
              el('div', { className: 'quiz-feedback-title' }, '✓ Benar!'),
              el('div', { className: 'quiz-feedback-answer' }, `Benar: ${romaji0} ( ${kana0} )`)
            );
          } else {
            feedback.append(
              el('div', { className: 'quiz-feedback-title' }, '✗ Salah!'),
              el('div', { className: 'quiz-feedback-answer' }, `Jawaban benar: ${kana0} ( ${romaji0} )`)
            );
            const entry = getEntryById(q.entryId);
            const arti = entry && typeof entry.arti === 'string' ? entry.arti.trim() : '';
            if (arti) {
              feedback.append(el('div', { className: 'quiz-feedback-detail' }, `Arti: ${arti}`));
            }
          }
        } else if (correct) {
          feedback.append(
            el('div', { className: 'quiz-feedback-title' }, '✓ Benar!'),
            el('div', { className: 'quiz-feedback-typed' }, `Jawabanmu: ${raw.trim()}`)
          );
          if (kanaList.length) {
            feedback.append(
              el('div', { className: 'quiz-feedback-detail' }, `Bacaan: ${kanaList.join(' / ')}`)
            );
          }
        } else {
          feedback.append(
            el('div', { className: 'quiz-feedback-title' }, '✗ Salah!'),
            el('div', { className: 'quiz-feedback-answer' }, `Jawaban benar: ${q.correct}`)
          );
          if (kanaList.length) {
            feedback.append(
              el('div', { className: 'quiz-feedback-detail' }, `Bacaan: ${kanaList.join(' / ')}`)
            );
          }
        }

        submitBtn.textContent = currentIndex === questions.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya';
        submitBtn.onclick = advance;
      }

      submitBtn.onclick = submit;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });

      const answerArea = el('div', { className: 'quiz-answer-area' }, input, feedback, submitBtn);

      container.innerHTML = '';
      container.append(header, question, answerArea);
    }

    function renderResult() {
      const total = questions.length;
      const correctCount = userAnswers.filter(a => a.correct).length;
      const score = total ? Math.round((correctCount / total) * 100) : 0;

      KanjiProgress.setQuizBest(scope, score);
      KanjiProgress.setLastBlock(scope);

      const wrongAnswers = userAnswers.filter(a => !a.correct);

      const result = el('div', { className: 'quiz-result' },
        el('h2', {}, 'Hasil Kuis'),
        el('div', { className: 'quiz-score' }, `${score}%`),
        el('div', {}, `${correctCount} dari ${total} benar`),
        score >= 80 ? el('div', {
          className: 'badge badge-success',
          style: 'margin-top: 16px;'
        }, '🎉 Lulus!') : null
      );

      if (wrongAnswers.length > 0) {
        const wrongList = el('div', { className: 'quiz-result-list' },
          el('h3', { style: 'margin-bottom: 16px;' }, 'Jawaban Salah:')
        );

        wrongAnswers.forEach(a => {
          const q = a.question;
          const entry = getEntryById(q.entryId);
          const aJenis = q.jenis || jenis;
          const kanaList = Array.isArray(q.kana) ? q.kana : [];
          const romajiList = Array.isArray(q.romaji) ? q.romaji : [];

          const item = el('div', { className: 'quiz-result-item' },
            entry ? el('div', { className: 'quiz-result-kanji' }, entry.kanji) : null,
            el('div', { className: 'quiz-result-typed' }, `Jawabanmu: ${a.typed || '(kosong)'}`)
          );

          if (aJenis === 'kanji-bacaan') {
            if (kanaList.length || romajiList.length) {
              item.append(
                el('div', { className: 'quiz-result-correct' },
                  `Benar: ${kanaList[0] || ''} ( ${romajiList[0] || ''} )`)
              );
            }
            const arti = entry && typeof entry.arti === 'string' ? entry.arti.trim() : '';
            if (arti) {
              item.append(el('div', { className: 'quiz-result-detail' }, `Arti: ${arti}`));
            }
          } else {
            item.append(
              el('div', { className: 'quiz-result-correct' }, `Benar: ${q.correct}`)
            );
          }

          wrongList.append(item);
        });

        result.append(wrongList);

        result.append(
          el('button', {
            className: 'btn btn-primary',
            style: 'width: 100%; margin-top: 16px;',
            onclick: () => {
              const reviewEntries = wrongAnswers
                .map(a => getEntryById(a.question.entryId))
                .filter(Boolean);
              const reviewQuestions = KanjiQuiz.buildTypedQuestions(reviewEntries, {
                jenis,
                jumlah: reviewEntries.length,
                acak: true
              });
              if (reviewQuestions.length === 0) {
                window.App.render('quiz');
                return;
              }
              questions = reviewQuestions;
              currentIndex = 0;
              userAnswers = [];
              renderQuestion();
            }
          }, '🔄 Ulangi yang Salah')
        );
      }

      result.append(
        el('button', {
          className: 'btn btn-secondary',
          style: 'width: 100%; margin-top: 16px;',
          onclick: () => window.App.render('quiz')
        }, 'Kembali ke Pengaturan')
      );

      container.innerHTML = '';
      container.append(result);
    }

    renderQuestion();
    return container;
  }

  function renderBlockDetail(blockNo) {
    const entries = getEntriesByBlock(blockNo);
    const progress = KanjiProgress.getBlockProgress(blockNo);
    const quizBest = KanjiProgress.getQuizBest(blockNo);

    const container = el('div', { className: 'fade-in' });

    const header = el('div', { className: 'card', style: 'margin-bottom: 24px;' },
      el('h2', { className: 'section-title' }, `Blok ${blockNo}`),
      el('div', { style: 'color: var(--color-text-secondary); margin-bottom: 16px;' },
        `${blockRangeLabel(blockNo)} • ${entries.length} entri`
      ),
      el('div', { className: 'block-stats' },
        el('div', { className: 'stat-item' },
          el('div', { className: 'stat-label' }, 'Hafal'),
          el('div', { className: 'stat-value' }, `${progress.hafal}/${entries.length}`)
        ),
        el('div', { className: 'stat-item' },
          el('div', { className: 'stat-label' }, 'Skor Terbaik'),
          el('div', { className: 'stat-value' }, quizBest !== null ? `${quizBest}%` : '-')
        )
      )
    );

    const steps = el('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
      el('button', {
        className: 'btn btn-primary',
        style: 'width: 100%;',
        onclick: () => {
          const content = renderFlashcard(blockNo, false);
          document.getElementById('main-content').innerHTML = '';
          document.getElementById('main-content').append(content);
        }
      }, '📚 Flashcard'),
      el('button', {
        className: 'btn btn-primary',
        style: 'width: 100%;',
        onclick: () => {
          const content = renderQuiz(blockNo, 'kanji-arti');
          document.getElementById('main-content').innerHTML = '';
          document.getElementById('main-content').append(content);
        }
      }, '📝 Kuis Blok'),
      el('button', {
        className: 'btn btn-secondary',
        style: 'width: 100%;',
        onclick: () => window.App.render('home')
      }, 'Kembali ke Beranda')
    );

    container.append(header, steps, renderFooter());
    return container;
  }

  // --- SHA-256 murni JS (sinkron) — dipakai gerbang kode akses. :sha256-start
  function sha256Hex(str) {
    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [];
    for (var i = 0; i < str.length; i += 1) {
      var c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen % 4294967296;
    var lenBytes = [hi >>> 24, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      lo >>> 24, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255];
    for (var l = 0; l < lenBytes.length; l += 1) bytes.push(lenBytes[l]);
    var w = new Array(64);
    for (var b = 0; b < bytes.length; b += 64) {
      for (var t = 0; t < 16; t += 1) {
        w[t] = (bytes[b + t * 4] << 24) | (bytes[b + t * 4 + 1] << 16) | (bytes[b + t * 4 + 2] << 8) | bytes[b + t * 4 + 3];
      }
      for (var t2 = 16; t2 < 64; t2 += 1) {
        var s0 = rotr(7, w[t2 - 15]) ^ rotr(18, w[t2 - 15]) ^ (w[t2 - 15] >>> 3);
        var s1 = rotr(17, w[t2 - 2]) ^ rotr(19, w[t2 - 2]) ^ (w[t2 - 2] >>> 10);
        w[t2] = (w[t2 - 16] + s0 + w[t2 - 7] + s1) >>> 0;
      }
      var a = H[0], bb = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (var j = 0; j < 64; j += 1) {
        var S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
        var S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        var maj = (a & bb) ^ (a & cc) ^ (bb & cc);
        var t2v = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = cc; cc = bb; bb = a; a = (t1 + t2v) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + bb) >>> 0; H[2] = (H[2] + cc) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var hex = '';
    for (var hi2 = 0; hi2 < 8; hi2 += 1) hex += ('00000000' + (H[hi2] >>> 0).toString(16)).slice(-8);
    return hex;
  }
  // :sha256-end

  // --- Gerbang kode akses -----------------------------------------------
  // Overlay layar penuh yang menahan init aplikasi (lihat js/app.js).
  // Kode dibaca dari konstanta global ACCESS_CODE_HASHES (sidik jari SHA-256)
  // di js/app.js; input dinormalisasi (trim + UPPERCASE) lalu hash-nya
  // dibandingkan dengan tiap hash — tetap tidak peka huruf besar/kecil.
  function renderGate(onSuccess) {
    const year = new Date().getFullYear();
    const hashes = (typeof ACCESS_CODE_HASHES !== 'undefined' && Array.isArray(ACCESS_CODE_HASHES)) ? ACCESS_CODE_HASHES : [];

    // Ikon gembok — SVG inline (template, supaya jadi elemen asli bukan teks).
    const tpl = document.createElement('template');
    tpl.innerHTML =
      '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="11" width="18" height="11" rx="2"></rect>' +
      '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
      '</svg>';
    const icon = tpl.content.firstElementChild;

    const error = el('p', {
      className: 'gate-error',
      id: 'gate-error',
      'aria-live': 'polite'
    });
    error.setAttribute('role', 'status');

    const input = el('input', {
      className: 'gate-input',
      id: 'gate-input',
      type: 'text',
      placeholder: 'Kode akses',
      'aria-label': 'Kode akses',
      'aria-describedby': 'gate-error'
    });
    // setAttribute eksplisit: hasilnya selalu autocomplete="off" spellcheck="false"
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    const submit = el('button', { className: 'btn btn-primary gate-submit', type: 'submit' }, 'Buka Aplikasi');

    const form = el('form', { className: 'gate-form', noValidate: true }, input, error, submit);

    // Baris ikon sosial — murni <a> asli dari SOCIAL_LINKS (sumber kebenaran
    // yang sama dengan header/footer), tanpa wiring JS. Tiga anchor: Instagram,
    // TikTok, GitHub (href-nya dari SOCIAL_LINKS: instagram.com/vnzfrmnn_,
    // tiktok.com/@vnzfrmnn, github.com/vnzfrmnn).
    // Ditempatkan DI LUAR form, antara tombol "Buka Aplikasi" dan copyright.
    const socials = el('div', { className: 'gate-socials', 'aria-label': 'Sosial media Vanzy' },
      SOCIAL_LINKS.map(item =>
        el('a', {
          className: 'gate-social-link',
          href: item.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          'aria-label': `${item.label} Vanzy`,
          title: item.label
        }, socialIcon(item.label))
      )
    );

    const card = el('div', { className: 'gate-card' },
      el('div', { className: 'gate-icon' }, icon),
      el('h1', { className: 'gate-title' }, 'Belajar Kanji'),
      el('p', { className: 'gate-sub' }, 'Masukkan kode akses untuk melanjutkan'),
      form,
      socials,
      el('div', { className: 'gate-copy' }, `© ${year} Vanzy — Dibuat oleh Vanzy`)
    );

    const overlay = el('div', { className: 'gate-overlay', id: 'gate-overlay' }, card);

    let shakeTimer = null;
    function shake() {
      card.classList.remove('gate-shake');
      void card.offsetWidth; // reflow agar animasi bisa dipicu berulang
      card.classList.add('gate-shake');
      clearTimeout(shakeTimer);
      shakeTimer = setTimeout(() => card.classList.remove('gate-shake'), 320);
    }

    function showError() {
      error.textContent = 'Kode akses salah';
      input.setAttribute('aria-invalid', 'true');
      shake();
      input.value = '';
      input.focus({ preventScroll: true });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim().toUpperCase();
      const matched = value.length > 0 && hashes.some(h => String(h).trim().toLowerCase() === sha256Hex(value));

      if (matched) {
        error.textContent = '';
        input.removeAttribute('aria-invalid');
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        showError();
      }
    });

    // Fokuskan input saat gerbang muncul (preventScroll: jangan lompat halaman).
    requestAnimationFrame(() => input.focus({ preventScroll: true }));

    return overlay;
  }

  return {
    el,
    setData,
    getData,
    getEntryById,
    getEntriesByBlock,
    renderHome,
    renderList,
    renderFlashcard,
    renderFlashcardSetup,
    renderQuiz,
    renderQuizSetup,
    renderBlockDetail,
    renderFooter,
    renderHeaderSocials,
    renderBackgroundFloaters,
    renderGate,
    sha256Hex,
    showKanjiDetail,
    speakText,
    setCurrentView: (view) => { currentView = view; }
  };
})();
