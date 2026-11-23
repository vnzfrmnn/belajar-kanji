/* Progres belajar kanji - headless, localStorage dengan fallback in-memory. */
(function (global) {
  'use strict';

  var PREFIX = 'kanji.v1.';
  // Nilai cadangan; ditimpa setData() dengan hitungan nyata dari JSON.
  var BLOCK_TOTALS = [0, 50, 51, 50, 50, 50, 50, 115, 120]; // blok 7 = area 300-400, blok 8 = 401-500
  var TOTAL_ENTRIES = 536;
  var KEYS = ['status', 'quizBest', 'review', 'lastBlock'];

  var memory = {};
  var blockById = {}; // diisi dari data (id -> blok) agar entri nyasar tetap tepat blok

  function getStorage() {
    try {
      if (typeof window !== 'undefined' && window && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) { /* akses localStorage bisa diblokir */ }
    try {
      if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
        return globalThis.localStorage;
      }
    } catch (e) { /* abaikan */ }
    return null;
  }

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function read(name, fallback) {
    if (Object.prototype.hasOwnProperty.call(memory, name)) {
      return clone(memory[name]);
    }
    var store = getStorage();
    if (store) {
      try {
        var raw = store.getItem(PREFIX + name);
        if (raw !== null) return JSON.parse(raw);
      } catch (e) { /* data rusak / akses gagal */ }
    }
    return clone(fallback);
  }

  function write(name, value) {
    memory[name] = clone(value);
    var store = getStorage();
    if (store) {
      try {
        store.setItem(PREFIX + name, JSON.stringify(value));
      } catch (e) { /* penuh / diblokir: tetap pakai memory */ }
    }
  }

  function remove(name) {
    delete memory[name];
    var store = getStorage();
    if (store) {
      try { store.removeItem(PREFIX + name); } catch (e) { /* abaikan */ }
    }
  }

  // Blok diturunkan dari data (id -> blok) agar entri nyasar selalu tepat blok.
  // Fallback dipakai saat setData() belum dipanggil (mis. uji unit).
  function blockOfId(id) {
    var key = String(id);
    if (Object.prototype.hasOwnProperty.call(blockById, key)) return blockById[key];
    var match = /^(\d+)/.exec(key);
    if (!match) return 0;
    var no = parseInt(match[1], 10);
    if (no < 1 || no > 900) return 0;
    if (no <= 300) return Math.ceil(no / 50); // blok 1-6 (74b -> 2)
    if (no <= 400) return 7;                  // 301-400 = satu blok
    if (no <= 500) return 8;                  // 401-500 = blok 8
    if (no >= 700) return 7;                  // entri nyasar area 300-400
    return 0;
  }

  // Sinkronkan total & peta blok dengan data JSON yang benar-benar dimuat.
  function setData(data) {
    var totals = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var byId = {};
    var total = 0;
    var list = Array.isArray(data) ? data : [];
    list.forEach(function (entry) {
      if (!entry) return;
      var block = Number(entry.blok);
      if (!(block >= 1 && block <= 8)) return;
      byId[String(entry.id)] = block;
      totals[block] += 1;
      total += 1;
    });
    blockById = byId;
    BLOCK_TOTALS = totals;
    TOTAL_ENTRIES = total;
  }

  function normalizeScope(scope, allowZero) {
    var n = Number(scope);
    if (!isFinite(n) || Math.floor(n) !== n) {
      throw new Error('Scope tidak valid: ' + scope);
    }
    if (allowZero && n === 0) return 0;
    if (n >= 1 && n <= 8) return n;
    throw new Error('Scope tidak valid: ' + scope);
  }

  function getStatusMap() {
    var map = read('status', {});
    if (!map || typeof map !== 'object' || Array.isArray(map)) map = {};
    return map;
  }

  function getStatus(id) {
    return getStatusMap()[String(id)];
  }

  function setStatus(id, status) {
    if (status !== 'hafal' && status !== 'belum') {
      throw new Error('Status tidak valid: ' + status);
    }
    var map = getStatusMap();
    map[String(id)] = status;
    write('status', map);
  }

  function isHafal(id) {
    return getStatus(id) === 'hafal';
  }

  function getScopeProgress(scope) {
    var n = normalizeScope(scope, true);
    var map = getStatusMap();
    var total = n === 0 ? TOTAL_ENTRIES : BLOCK_TOTALS[n];
    var hafal = 0;

    Object.keys(map).forEach(function (id) {
      if (map[id] !== 'hafal') return;
      var block = blockOfId(id);
      if (block === 0) return;
      if (n === 0 || block === n) hafal += 1;
    });

    if (hafal > total) hafal = total;
    return {
      total: total,
      hafal: hafal,
      belum: total - hafal,
      persen: total === 0 ? 0 : Math.round((hafal / total) * 100)
    };
  }

  function getBlockProgress(blockNo) {
    var n = Number(blockNo);
    if (!isFinite(n) || Math.floor(n) !== n || n < 1 || n > 8) {
      throw new Error('Blok tidak valid: ' + blockNo);
    }
    return getScopeProgress(n);
  }

  function getQuizBest(scope) {
    var n = normalizeScope(scope, true);
    var best = read('quizBest', {});
    if (!best || typeof best !== 'object' || Array.isArray(best)) return null;
    var value = best[String(n)];
    return typeof value === 'number' && isFinite(value) ? value : null;
  }

  function setQuizBest(scope, score) {
    var n = normalizeScope(scope, true);
    var value = Number(score);
    if (!isFinite(value)) return;
    if (value < 0) value = 0;
    if (value > 100) value = 100;

    var best = read('quizBest', {});
    if (!best || typeof best !== 'object' || Array.isArray(best)) best = {};
    var key = String(n);
    var previous = best[key];
    if (typeof previous !== 'number' || !isFinite(previous) || value > previous) {
      best[key] = value;
      write('quizBest', best);
    }
  }

  function reviewKey(id) {
    return typeof id + ':' + id;
  }

  function readReview() {
    var list = read('review', []);
    if (!Array.isArray(list)) return [];
    return list.filter(function (id) {
      if (typeof id === 'string') return id !== '';
      // id angka (di luar kontrak) tetap disimpan agar tidak hilang.
      return typeof id === 'number' && isFinite(id);
    });
  }

  function getReviewList(scope) {
    var n = normalizeScope(scope, true);
    var list = readReview();
    if (n === 0) return list.slice();
    // Hanya id string yang bisa dipetakan ke blok; id angka tetap di scope 0.
    return list.filter(function (id) {
      return typeof id === 'string' && blockOfId(id) === n;
    });
  }

  function addToReview(ids) {
    var incoming = Array.isArray(ids) ? ids : (ids == null ? [] : [ids]);
    var current = readReview();
    var seen = {};
    current.forEach(function (id) { seen[reviewKey(id)] = true; });

    incoming.forEach(function (rawId) {
      var id;
      if (typeof rawId === 'number') {
        if (!isFinite(rawId)) return;
        id = rawId;
      } else {
        id = String(rawId);
        if (id === '') return;
      }
      var key = reviewKey(id);
      if (seen[key]) return;
      seen[key] = true;
      current.push(id);
    });
    write('review', current);
  }

  function removeFromReview(ids) {
    var incoming = Array.isArray(ids) ? ids : (ids == null ? [] : [ids]);
    var drop = {};
    incoming.forEach(function (rawId) { drop[String(rawId)] = true; });

    var current = readReview().filter(function (id) { return !drop[String(id)]; });
    write('review', current);
  }

  function clearReview(scope) {
    var n = normalizeScope(scope, true);
    if (n === 0) {
      remove('review');
      return;
    }
    var current = readReview().filter(function (id) {
      return !(typeof id === 'string' && blockOfId(id) === n);
    });
    write('review', current);
  }

  function getLastBlock() {
    var value = read('lastBlock', null);
    if (typeof value !== 'number' || !isFinite(value)) return null;
    if (value === 0) return 0;
    if (Math.floor(value) === value && value >= 1 && value <= 8) return value;
    return null;
  }

  function setLastBlock(blockNo) {
    var n = Number(blockNo);
    if (!isFinite(n) || Math.floor(n) !== n || n < 0 || n > 8) {
      throw new Error('Blok terakhir tidak valid: ' + blockNo);
    }
    write('lastBlock', n);
  }

  function resetProgress() {
    var store = getStorage();
    if (store) {
      KEYS.forEach(function (name) {
        try { store.removeItem(PREFIX + name); } catch (e) { /* abaikan */ }
      });
      try {
        var keys = [];
        for (var i = 0; i < store.length; i += 1) {
          var key = store.key(i);
          if (key && key.indexOf(PREFIX) === 0) keys.push(key);
        }
        keys.forEach(function (key) {
          try { store.removeItem(key); } catch (e) { /* abaikan */ }
        });
      } catch (e) { /* abaikan */ }
    }
    memory = {};
  }

  global.KanjiProgress = {
    setData: setData,
    getStatus: getStatus,
    setStatus: setStatus,
    isHafal: isHafal,
    getStatusMap: getStatusMap,
    getScopeProgress: getScopeProgress,
    getBlockProgress: getBlockProgress,
    getQuizBest: getQuizBest,
    setQuizBest: setQuizBest,
    getReviewList: getReviewList,
    addToReview: addToReview,
    removeFromReview: removeFromReview,
    clearReview: clearReview,
    getLastBlock: getLastBlock,
    setLastBlock: setLastBlock,
    resetProgress: resetProgress
  };
})(typeof window !== 'undefined' ? window : globalThis);
