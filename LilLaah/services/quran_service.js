import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const API_BASE = 'https://api.alquran.cloud/v1';

const BOOKMARKS_KEY = 'quran_bookmarks_v1';
const QURAN_SETTINGS_KEY = 'quran_settings_v1';
const DOWNLOAD_INDEX_KEY = 'quran_downloads_v1';
const FAVORITES_KEY = 'quran_favorites_v1';

const DOWNLOAD_ROOT = `${FileSystem.documentDirectory}quran/`;

export function getRecitersList() {
  return [
    { id: 'ar.alafasy', name: 'Alafasy (verse-by-verse)' },
    { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)' },
    { id: 'ar.husary', name: 'Husary' },
    { id: 'ar.minshawi', name: 'Minshawi' },
  ];
}

export async function getSurahList() {
  const res = await fetch(`${API_BASE}/surah`);
  const json = await res.json();
  if (json?.code === 200 && Array.isArray(json.data)) {
    return json.data;
  }
  throw new Error('Failed to fetch surah list');
}

export async function getSurah(surahNumber, editions = ['ar.alafasy', 'en.sahih', 'en.transliteration']) {
  const promises = editions.map(ed => fetch(`${API_BASE}/surah/${surahNumber}/${ed}`).then(r => r.json()).catch(e => ({ code: 500, error: e })));
  const results = await Promise.all(promises);

  const primary = results.find(r => r?.code === 200 && r.data) || results[0];
  if (!primary || primary.code !== 200 || !primary.data) throw new Error('Failed to fetch surah data');

  const arabic = results.find(r => r?.data?.edition?.language === 'ar' || (r?.data?.ayahs && r.data.ayahs.some(a => a.audio)));
  const translation = results.find(r => r?.data?.edition?.language === 'en' && r?.data?.ayahs && r.data.ayahs[0] && /[A-Za-z]/.test(r.data.ayahs[0].text));
  const transliteration = results.find(r => r?.data?.edition?.identifier && String(r.data.edition.identifier).toLowerCase().includes('transliteration'));

  const metaSource = primary.data;
  const meta = {
    number: metaSource.number,
    name: metaSource.name,
    englishName: metaSource.englishName,
    englishNameTranslation: metaSource.englishNameTranslation,
    numberOfAyahs: metaSource.numberOfAyahs,
    revelationType: metaSource.revelationType,
  };

  const maxAyahs = (primary.data && primary.data.ayahs && primary.data.ayahs.length) || 0;
  const ayahs = [];

  for (let i = 0; i < maxAyahs; i++) {
    const a_ar = (arabic && arabic.data && arabic.data.ayahs && arabic.data.ayahs[i]) || null;
    const a_tr = (translation && translation.data && translation.data.ayahs && translation.data.ayahs[i]) || null;
    const a_tl = (transliteration && transliteration.data && transliteration.data.ayahs && transliteration.data.ayahs[i]) || null;

    ayahs.push({
      number: a_ar?.number ?? a_tr?.number ?? null,
      numberInSurah: a_ar?.numberInSurah ?? a_tr?.numberInSurah ?? (i + 1),
      text_ar: a_ar?.text ?? '',
      audio: a_ar?.audio ?? null,
      text_translation: a_tr?.text ?? null,
      text_transliteration: a_tl?.text ?? null,
      juz: a_ar?.juz ?? a_tr?.juz ?? null,
      page: a_ar?.page ?? a_tr?.page ?? null,
    });
  }

  return {
    meta,
    ayahs,
    editionInfo: {
      ar: arabic?.data?.edition ?? null,
      translation: translation?.data?.edition ?? null,
      transliteration: transliteration?.data?.edition ?? null,
    },
  };
}

export async function getBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export async function saveBookmark(surahNumber, ayahIndex, note = '') {
  const current = await getBookmarks();
  current[String(surahNumber)] = { ayahIndex, note, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current));
  return current;
}

export async function removeBookmark(surahNumber) {
  const current = await getBookmarks();
  delete current[String(surahNumber)];
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(current));
  return current;
}

const DEFAULT_FAVOURITES = {
  '2:255': { surah: 2, ayah: 255, text_ar: '', text_translation: 'Ayatul Kursi', createdAt: '2020-01-01T00:00:00Z' },
};

export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_FAVOURITES));
      return DEFAULT_FAVOURITES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_FAVOURITES;
  }
}

export async function saveFavorite(payload) {
  try {
    const currentRaw = await AsyncStorage.getItem(FAVORITES_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    const key = `${payload.surah}:${payload.ayah}`;
    current[key] = payload;
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    throw e;
  }
}

export async function removeFavorite(surahNumber, ayahNumber) {
  try {
    const currentRaw = await AsyncStorage.getItem(FAVORITES_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    const key = `${surahNumber}:${ayahNumber}`;
    delete current[key];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    throw e;
  }
}

const DEFAULT_QURAN_SETTINGS = {
  reciter: 'ar.alafasy',
  playTranslation: false,
  useOfflineAudioWhenAvailable: true,
};

export async function getQuranSettings() {
  try {
    const raw = await AsyncStorage.getItem(QURAN_SETTINGS_KEY);
    if (!raw) return DEFAULT_QURAN_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_QURAN_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_QURAN_SETTINGS;
  }
}

export async function saveQuranSettings(settings = {}) {
  const toSave = { ...(await getQuranSettings()), ...settings };
  await AsyncStorage.setItem(QURAN_SETTINGS_KEY, JSON.stringify(toSave));
  return toSave;
}

async function ensureDirExists(dir) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function getDownloadIndex() {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOAD_INDEX_KEY);
    if (raw) return JSON.parse(raw);
    const info = await FileSystem.getInfoAsync(`${DOWNLOAD_ROOT}index.json`);
    if (info.exists) {
      const content = await FileSystem.readAsStringAsync(`${DOWNLOAD_ROOT}index.json`);
      return JSON.parse(content);
    }
    return {};
  } catch (e) {
    return {};
  }
}

export async function downloadSurahJson(surahNumber, surahPayload) {
  await ensureDirExists(DOWNLOAD_ROOT);
  const path = `${DOWNLOAD_ROOT}surah_${surahNumber}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(surahPayload), { encoding: FileSystem.EncodingType.UTF8 });
  const index = (await getDownloadIndex()) || {};
  index[String(surahNumber)] = index[String(surahNumber)] || {};
  index[String(surahNumber)].json = path;
  await AsyncStorage.setItem(DOWNLOAD_INDEX_KEY, JSON.stringify(index));
  await FileSystem.writeAsStringAsync(`${DOWNLOAD_ROOT}index.json`, JSON.stringify(index));
  return path;
}

export async function downloadSurahAudio(surahNumber, ayahs, onProgress = () => {}) {
  await ensureDirExists(DOWNLOAD_ROOT);
  const surahDir = `${DOWNLOAD_ROOT}audio_surah_${surahNumber}/`;
  await ensureDirExists(surahDir);

  const total = ayahs.length;
  const results = {};

  for (let i = 0; i < ayahs.length; i++) {
    const a = ayahs[i];
    if (!a.audio) {
      onProgress(i + 1, total);
      continue;
    }
    const ext = a.audio.split('?')[0].split('.').pop();
    const filename = `ayah_${a.numberInSurah}.${ext || 'mp3'}`;
    const filepath = `${surahDir}${filename}`;

    try {
      const info = await FileSystem.getInfoAsync(filepath);
      if (!info.exists) {
        const dl = await FileSystem.downloadAsync(a.audio, filepath);
        results[String(a.numberInSurah)] = dl.uri;
      } else {
        results[String(a.numberInSurah)] = filepath;
      }
    } catch (e) {
      results[String(a.numberInSurah)] = null;
    } finally {
      onProgress(i + 1, total);
    }
  }

  const index = (await getDownloadIndex()) || {};
  index[String(surahNumber)] = index[String(surahNumber)] || {};
  index[String(surahNumber)].audio = results;
  await AsyncStorage.setItem(DOWNLOAD_INDEX_KEY, JSON.stringify(index));
  await FileSystem.writeAsStringAsync(`${DOWNLOAD_ROOT}index.json`, JSON.stringify(index));
  return results;
}

export async function deleteSurahDownload(surahNumber) {
  const idx = await getDownloadIndex();
  const entry = idx[String(surahNumber)];
  if (!entry) return false;

  try {
    if (entry.json) {
      await FileSystem.deleteAsync(entry.json, { idempotent: true });
    }
    if (entry.audio) {
      for (const p of Object.values(entry.audio)) {
        if (!p) continue;
        try { await FileSystem.deleteAsync(p, { idempotent: true }); } catch (e) {}
      }
      const dir = `${DOWNLOAD_ROOT}audio_surah_${surahNumber}`;
      try { await FileSystem.deleteAsync(dir, { idempotent: true }); } catch (e) {}
    }
  } catch (e) {}

  delete idx[String(surahNumber)];
  await AsyncStorage.setItem(DOWNLOAD_INDEX_KEY, JSON.stringify(idx));
  await FileSystem.writeAsStringAsync(`${DOWNLOAD_ROOT}index.json`, JSON.stringify(idx));
  return true;
}

export async function getDownloadedAyahPath(surahNumber, ayahNumberInSurah) {
  const idx = await getDownloadIndex();
  const s = idx[String(surahNumber)];
  if (s && s.audio && s.audio[String(ayahNumberInSurah)]) return s.audio[String(ayahNumberInSurah)];
  return null;
}
