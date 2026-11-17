/* Pembuat soal kuis pilihan ganda - headless, tanpa DOM. */
(function (global) {
  'use strict';

  var JENIS_VALID = ['kanji-arti', 'kanji-bacaan', 'arti-kanji'];

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function optionValue(entry, jenis) {
    if (!entry) return null;
    if (jenis === 'kanji-bacaan') {
      if (!Array.isArray(entry.bacaan)) return null;
      var kana = entry.bacaan[0];
      return typeof kana === 'string' && kana.trim() !== '' ? kana : null;
    }
    if (jenis === 'arti-kanji') {
      return typeof entry.kanji === 'string' && entry.kanji.trim() !== '' ? entry.kanji : null;
    }
    return typeof entry.arti === 'string' && entry.arti.trim() !== '' ? entry.arti : null;
  }

  function promptValue(entry, jenis) {
    var value = jenis === 'arti-kanji' ? entry.arti : entry.kanji;
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }

  function promptSubFor(entry, jenis) {
    if (jenis !== 'kanji-arti') return null;
    if (!Array.isArray(entry.bacaan)) return null;
    var kana = entry.bacaan[0];
    return typeof kana === 'string' && kana !== '' ? kana : null;
  }

  function pickDistractors(correctEntry, pool, count, seenValues, valueOf) {
    var limit = Math.floor(Number(count));
    if (!isFinite(limit) || limit <= 0 || !Array.isArray(pool)) return [];

    var resolver = typeof valueOf === 'function'
      ? valueOf
      : function (entry) { return entry ? entry.arti : null; };

    var seen = new Set();
    if (seenValues instanceof Set) {
      seenValues.forEach(function (value) { seen.add(value); });
    } else if (Array.isArray(seenValues)) {
      seenValues.forEach(function (value) { seen.add(value); });
    } else if (seenValues != null) {
      seen.add(seenValues);
    }

    var correctValue = resolver(correctEntry);
    if (correctValue != null) seen.add(correctValue);

    var candidates = pool.filter(function (entry) {
      return entry && entry !== correctEntry;
    });
    shuffle(candidates);

    var result = [];
    for (var i = 0; i < candidates.length && result.length < limit; i += 1) {
      var value = resolver(candidates[i]);
      if (typeof value !== 'string' || value === '' || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result;
  }

  function buildQuestions(entries, options) {
    options = options || {};
    var jenis = options.jenis == null ? 'kanji-arti' : options.jenis;
    if (JENIS_VALID.indexOf(jenis) === -1) {
      throw new Error('Jenis soal tidak dikenal: ' + jenis);
    }
    if (!Array.isArray(entries)) return [];

    var wanted = options.jumlah == null ? 10 : Math.floor(Number(options.jumlah));
    if (!isFinite(wanted) || wanted <= 0) return [];

    var resolveOption = function (entry) { return optionValue(entry, jenis); };

    var eligible = entries.filter(function (entry) {
      var option = optionValue(entry, jenis);
      var prompt = promptValue(entry, jenis);
      return option !== null && prompt !== null;
    });
    if (eligible.length < 2) return [];

    // Pool harus punya minimal dua nilai berbeda agar opsi tidak identik.
    var distinct = new Set();
    for (var d = 0; d < eligible.length; d += 1) {
      distinct.add(optionValue(eligible[d], jenis));
      if (distinct.size >= 2) break;
    }
    if (distinct.size < 2) return [];

    var subjects = eligible.slice();
    if (options.acak !== false) shuffle(subjects);

    var count = Math.min(wanted, subjects.length);
    var questions = [];

    for (var i = 0; i < count; i += 1) {
      var entry = subjects[i];
      var correct = optionValue(entry, jenis);
      var distractors = pickDistractors(entry, eligible, 3, [correct], resolveOption);
      if (!distractors.length) continue;

      var choices = [correct].concat(distractors);
      shuffle(choices);

      questions.push({
        entryId: String(entry.id),
        jenis: jenis,
        prompt: promptValue(entry, jenis),
        promptSub: promptSubFor(entry, jenis),
        options: choices,
        answerIndex: choices.indexOf(correct),
        correct: correct
      });
    }

    return questions;
  }

  // --- Kuis ketik (fase 2A-UI) -----------------------------------------

  var KANA_BASIC = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n', 'ゔ': 'vu',
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa'
  };

  var KANA_COMBO = {
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo', 'ふゅ': 'fyu',
    'うぃ': 'wi', 'うぇ': 'we', 'うぉ': 'wo',
    'てぃ': 'ti', 'でぃ': 'di', 'とぅ': 'tu', 'どぅ': 'du',
    'しぇ': 'she', 'じぇ': 'je', 'ちぇ': 'che',
    'ゔぁ': 'va', 'ゔぃ': 'vi', 'ゔぇ': 've', 'ゔぉ': 'vo'
  };

  var KANA_RE = /[\u3040-\u30ff\u31f0-\u31ff]/;

  function toHiragana(text) {
    var out = '';
    for (var i = 0; i < text.length; i += 1) {
      var code = text.charCodeAt(i);
      out += (code >= 0x30a1 && code <= 0x30f6)
        ? String.fromCharCode(code - 0x60)
        : text.charAt(i);
    }
    return out;
  }

  function syllableAt(text, pos) {
    if (pos >= text.length) return null;
    var two = text.substr(pos, 2);
    if (two.length === 2 && KANA_COMBO[two]) {
      return { value: KANA_COMBO[two], length: 2 };
    }
    var one = text.charAt(pos);
    if (KANA_BASIC[one]) return { value: KANA_BASIC[one], length: 1 };
    return null;
  }

  // Hepburn sederhana: っ = konsonan berganda, ん = 'n', yoon digabung.
  function kanaToRomaji(kana) {
    if (kana == null) return '';
    var text = toHiragana(String(kana).replace(/\s+/g, ''));
    if (text === '') return '';

    var out = '';
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);

      if (ch === 'っ') {
        var next = syllableAt(text, i + 1);
        if (!next) continue;
        var prefix = next.value.charAt(0);
        if (next.value.indexOf('ch') === 0) prefix = 't';
        if ('aiueo'.indexOf(prefix) !== -1) prefix = '';
        out += prefix + next.value;
        i += next.length;
        continue;
      }

      if (ch === 'ー') {
        for (var v = out.length - 1; v >= 0; v -= 1) {
          if ('aiueo'.indexOf(out.charAt(v)) !== -1) {
            out += out.charAt(v);
            break;
          }
        }
        continue;
      }

      var syl = syllableAt(text, i);
      if (!syl) return '';
      out += syl.value;
      i += syl.length - 1;
    }
    return out;
  }

  function normalizeRomaji(value) {
    if (value == null) return '';
    var s = String(value);
    if (s.normalize) {
      try { s = s.normalize('NFC'); } catch (e) { /* abaikan */ }
    }
    s = s.toLowerCase();
    s = s.replace(/[\s\-'’]/g, '');
    s = s.replace(/ā/g, 'aa').replace(/ī/g, 'ii').replace(/ū/g, 'uu')
      .replace(/ē/g, 'ee').replace(/ō/g, 'ou');
    s = s.replace(/oo/g, 'ou');
    return s;
  }

  function normalizeArti(value) {
    if (value == null) return '';
    var s = String(value);
    if (s.normalize) {
      try { s = s.normalize('NFC'); } catch (e) { /* abaikan */ }
    }
    s = s.toLowerCase();
    s = s.replace(/\([^)]*\)/g, ' ');
    s = s.replace(/\[[^\]]*\]/g, ' ');
    s = s.replace(/\{[^}]*\}/g, ' ');
    s = s.replace(/-{2,}/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    s = s.replace(/[.!?]+$/g, '');
    s = s.replace(/[,;.\/]+$/g, '');
    return s.trim();
  }

  function normalizeKana(value) {
    if (value == null) return '';
    var s = String(value);
    if (s.normalize) {
      try { s = s.normalize('NFC'); } catch (e) { /* abaikan */ }
    }
    return s.replace(/\s+/g, '');
  }

  function artiVariants(value) {
    if (typeof value !== 'string') return [];
    var parts = value.split(/[,;\/・]/);
    var out = [];
    for (var i = 0; i < parts.length; i += 1) {
      var normalized = normalizeArti(parts[i]);
      if (normalized !== '' && out.indexOf(normalized) === -1) out.push(normalized);
    }
    return out;
  }

  function bacaanList(entry) {
    if (!entry || !Array.isArray(entry.bacaan)) return [];
    var out = [];
    for (var i = 0; i < entry.bacaan.length; i += 1) {
      var value = entry.bacaan[i];
      if (typeof value !== 'string') continue;
      var kana = value.trim();
      if (kana !== '' && out.indexOf(kana) === -1) out.push(kana);
    }
    return out;
  }

  function romajiList(kanaList) {
    var out = [];
    for (var i = 0; i < kanaList.length; i += 1) {
      var romaji = normalizeRomaji(kanaToRomaji(kanaList[i]));
      if (romaji !== '' && out.indexOf(romaji) === -1) out.push(romaji);
    }
    return out;
  }

  function typedQuestionFor(entry, jenis) {
    if (!entry) return null;

    var kanji = typeof entry.kanji === 'string' ? entry.kanji.trim() : '';
    var arti = typeof entry.arti === 'string' ? entry.arti.trim() : '';
    var kana = bacaanList(entry);
    var romaji = romajiList(kana);

    if (jenis === 'kanji-arti') {
      if (kanji === '' || arti === '') return null;
      var accepted = artiVariants(arti);
      if (!accepted.length) return null;
      // Teks arti lengkap juga diterima agar feedback "correct" bisa diketik ulang.
      var fullArti = normalizeArti(arti);
      if (fullArti !== '' && accepted.indexOf(fullArti) === -1) accepted.push(fullArti);
      return {
        entryId: String(entry.id),
        jenis: jenis,
        prompt: kanji,
        // Bacaan disembunyikan di soal ketik agar tidak membocorkan jawaban;
        // hanya tampil di feedback (q.kana).
        promptSub: null,
        kana: kana,
        romaji: romaji,
        accepted: accepted,
        correct: arti
      };
    }

    if (kana.length === 0) return null;

    if (jenis === 'kanji-bacaan') {
      if (kanji === '') return null;
      return {
        entryId: String(entry.id),
        jenis: jenis,
        prompt: kanji,
        promptSub: null,
        kana: kana,
        romaji: romaji,
        accepted: kana.concat(romaji),
        correct: kana[0]
      };
    }

    // arti-kanji versi ketik dimainkan sebagai "arti -> bacaan".
    if (arti === '') return null;
    return {
      entryId: String(entry.id),
      jenis: jenis,
      prompt: arti,
      promptSub: null,
      kana: kana,
      romaji: romaji,
      accepted: kana.concat(romaji),
      correct: kana[0]
    };
  }

  function buildTypedQuestions(entries, options) {
    options = options || {};
    var jenis = options.jenis == null ? 'kanji-arti' : options.jenis;
    if (JENIS_VALID.indexOf(jenis) === -1) {
      throw new Error('Jenis soal tidak dikenal: ' + jenis);
    }
    if (!Array.isArray(entries)) return [];

    var wanted = options.jumlah == null ? 10 : Math.floor(Number(options.jumlah));
    if (!isFinite(wanted) || wanted <= 0) return [];

    var pool = [];
    for (var i = 0; i < entries.length; i += 1) {
      var question = typedQuestionFor(entries[i], jenis);
      if (question) pool.push(question);
    }
    if (!pool.length) return [];
    if (options.acak !== false) shuffle(pool);
    return pool.slice(0, Math.min(wanted, pool.length));
  }

  function checkTyped(q, raw) {
    if (!q || typeof q !== 'object' || typeof raw !== 'string') return false;
    var text = raw.trim();
    if (text === '') return false;

    if (KANA_RE.test(text)) {
      var typed = normalizeKana(text);
      var kanaList = Array.isArray(q.kana) ? q.kana : [];
      for (var i = 0; i < kanaList.length; i += 1) {
        if (typeof kanaList[i] === 'string' && normalizeKana(kanaList[i]) === typed) {
          return true;
        }
      }
      return false;
    }

    var accepted = Array.isArray(q.accepted) ? q.accepted : [];
    var value = q.jenis === 'kanji-arti' ? normalizeArti(text) : normalizeRomaji(text);
    if (value === '') return false;
    for (var j = 0; j < accepted.length; j += 1) {
      if (typeof accepted[j] === 'string' && accepted[j] === value) return true;
    }
    return false;
  }

  global.KanjiQuiz = {
    buildQuestions: buildQuestions,
    pickDistractors: pickDistractors,
    buildTypedQuestions: buildTypedQuestions,
    normalizeArti: normalizeArti,
    kanaToRomaji: kanaToRomaji,
    normalizeRomaji: normalizeRomaji,
    checkTyped: checkTyped
  };
})(typeof window !== 'undefined' ? window : globalThis);
