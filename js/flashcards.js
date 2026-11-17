/* Antrean flashcard - headless, semua fungsi murni (tanpa mutasi input). */
(function (global) {
  'use strict';

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function buildQueue(entries, options) {
    options = options || {};
    if (!Array.isArray(entries)) return [];

    var list = entries.filter(function (entry) {
      return entry && entry.id != null;
    });
    if (options.acak !== false) shuffle(list);

    return list.map(function (entry) {
      return {
        id: String(entry.id),
        entry: entry,
        reps: 0
      };
    });
  }

  function mark(queue, index, result) {
    if (!Array.isArray(queue)) {
      throw new Error('Queue harus berupa array');
    }
    if (result !== 'hafal' && result !== 'belum') {
      throw new Error('Hasil tidak valid: ' + result);
    }
    if (!isFinite(index) || Math.floor(index) !== index || index < 0 || index >= queue.length) {
      throw new Error('Index kartu tidak valid: ' + index);
    }

    var next = queue.slice();
    var card = next[index];
    next.splice(index, 1);

    if (result === 'belum') {
      next.push({
        id: card.id,
        entry: card.entry,
        reps: (Number(card.reps) || 0) + 1
      });
    }
    return next;
  }

  function indexOf(queue, index) {
    var len = queue.length;
    var i = index == null ? 0 : Math.floor(Number(index));
    if (!isFinite(i)) i = 0;
    return ((i % len) + len) % len;
  }

  function nextIndex(queue, index) {
    if (!Array.isArray(queue)) {
      throw new Error('Queue harus berupa array');
    }
    if (queue.length === 0) {
      throw new Error('queue kosong');
    }
    return (indexOf(queue, index) + 1) % queue.length;
  }

  function prevIndex(queue, index) {
    if (!Array.isArray(queue)) {
      throw new Error('Queue harus berupa array');
    }
    if (queue.length === 0) {
      throw new Error('queue kosong');
    }
    var len = queue.length;
    return (indexOf(queue, index) - 1 + len) % len;
  }

  function current(queue, index) {
    if (!Array.isArray(queue) || queue.length === 0) return null;
    var i = index == null ? 0 : Math.floor(Number(index));
    if (!isFinite(i) || i < 0 || i >= queue.length) return null;
    return queue[i] == null ? null : queue[i];
  }

  global.KanjiFlashcards = {
    buildQueue: buildQueue,
    mark: mark,
    nextIndex: nextIndex,
    prevIndex: prevIndex,
    current: current
  };
})(typeof window !== 'undefined' ? window : globalThis);
