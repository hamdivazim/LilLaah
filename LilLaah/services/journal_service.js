import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'journal_entries_v1';

export async function getJournalEntries() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('getJournalEntries failed', e);
    return [];
  }
}

export async function setJournalEntries(entries) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries || []));
  } catch (e) {
    console.warn('setJournalEntries failed', e);
    throw e;
  }
}

export async function addJournalEntry(entry) {
  if (!entry || !entry.id) throw new Error('Invalid entry');
  const list = await getJournalEntries();
  list.push(entry);
  await setJournalEntries(list);
  return entry;
}

export async function removeJournalEntry(id) {
  const list = await getJournalEntries();
  const filtered = list.filter((i) => i.id !== id);
  await setJournalEntries(filtered);
  return filtered;
}

export async function clearJournalEntries() {
  await setJournalEntries([]);
}


//coming soon