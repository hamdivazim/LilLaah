import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE = 'https://lillaahduaapi.hamdtel.co.uk';
const STORAGE_KEY = 'dua_api_base_v1';

let cachedBase = null;

export async function getDuaApiBase() {
  if (cachedBase !== null) return cachedBase || '';
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedBase = raw;
      return cachedBase || '';
    }
  } catch (e) {
  }
  cachedBase = DEFAULT_API_BASE;
  return cachedBase;
}

export async function setDuaApiBase(base) {
  try {
    const final = (base && String(base).trim()) || '';
    cachedBase = final || DEFAULT_API_BASE;
    if (!final) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, final);
    }
    return cachedBase;
  } catch (e) {
    cachedBase = base || DEFAULT_API_BASE;
    return cachedBase;
  }
}

export async function fetchJson(path) {
  try {
    const base = await getDuaApiBase();
    const p = path.startsWith('/') ? path : `/${path}`;
    const url = `${base}${p}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function getCategories() {
  return fetchJson('/categories/');
}

export async function getCategoryItems(slug) {
  return fetchJson(`/categories/${encodeURIComponent(slug)}/`);
}

export async function getDuaDetail(slug, id) {
  return fetchJson(`/categories/${encodeURIComponent(slug)}/${encodeURIComponent(String(id))}`);
}
