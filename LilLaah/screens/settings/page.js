import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  Linking,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import { getSalahSettings, saveSalahSettings } from '../../services/salah_calculate';
import { getQuranSettings, saveQuranSettings, getRecitersList } from '../../services/quran_service';
import { setDuaApiBase, getDuaApiBase } from '../../services/dua_service';
import { getStyles } from '../styles';

const DUA_SETTINGS_KEY = 'dua_settings_v1';
const UPDATE_CACHE_KEY = 'lillaah_update_check_v1';
const GITHUB_LILLaAH_RELEASES_API = 'https://api.github.com/repos/hamdivazim/LilLaah/releases/latest';
const DEFAULT_DUA_GITHUB = 'https://github.com/fitrahive/dua-dhikr';

let APP_VERSION = '0.0.0';
try {
  const pkg = require('../../package.json');
  if (pkg && pkg.version) APP_VERSION = String(pkg.version);
} catch (e) {
  APP_VERSION = '0.0.0';
}

function normaliseVersion(v) {
  if (!v) return '0.0.0';
  return String(v).trim().replace(/^v/i, '');
}

function compareSemver(a, b) {
  const na = normaliseVersion(a).split('.').map((s) => parseInt(s, 10) || 0);
  const nb = normaliseVersion(b).split('.').map((s) => parseInt(s, 10) || 0);
  const len = Math.max(na.length, nb.length);
  for (let i = 0; i < len; i += 1) {
    const A = na[i] || 0;
    const B = nb[i] || 0;
    if (A > B) return 1;
    if (A < B) return -1;
  }
  return 0;
}

export default function Settings({ systemIsDark, darkModeMethod, setDarkModeMethod }) {
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const styles = getStyles('settings', systemIsDark);

  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('Moonsighting');
  const [madhab, setMadhab] = useState('hanafi');
  const [adjustments, setAdjustments] = useState({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });

  const [quranLoading, setQuranLoading] = useState(true);
  const [reciter, setReciter] = useState('ar.alafasy');
  const [playTranslation, setPlayTranslation] = useState(false);
  const [offlineAudio, setOfflineAudio] = useState(true);
  const [showTranslationQuran, setShowTranslationQuran] = useState(true);
  const [showTransliterationQuran, setShowTransliterationQuran] = useState(true);
  const [enableWordDefinitions, setEnableWordDefinitions] = useState(false);
  const [recitersList, setRecitersList] = useState([]);

  const [duaLoading, setDuaLoading] = useState(true);
  const [duaApiBase, setDuaApiBaseLocal] = useState('');
  const [duaShowTransliteration, setDuaShowTransliteration] = useState(true);
  const [duaShowTranslation, setDuaShowTranslation] = useState(true);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateCache, setUpdateCache] = useState(null);

  const [exporting, setExporting] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setQuranLoading(true);
      setDuaLoading(true);
      try {
        const s = await getSalahSettings();
        setMethod(s.method ?? 'Moonsighting');
        setMadhab(s.madhab ?? 'hanafi');
        setAdjustments({ ...(s.adjustments || {}), fajr: s.adjustments?.fajr ?? adjustments.fajr });

        const q = await getQuranSettings();
        setReciter(q.reciter ?? 'ar.alafasy');
        setPlayTranslation(Boolean(q.playTranslation));
        setOfflineAudio(Boolean(q.useOfflineAudioWhenAvailable));
        setShowTranslationQuran(q.showTranslation !== false);
        setShowTransliterationQuran(q.showTransliteration !== false);
        setEnableWordDefinitions(q.enableWordDefinitions !== false);

        try {
          const rl = await getRecitersList();
          setRecitersList(Array.isArray(rl) ? rl : []);
        } catch (e) {}

        try {
          const raw = await AsyncStorage.getItem(DUA_SETTINGS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setDuaShowTransliteration(parsed.showTransliteration !== false);
            setDuaShowTranslation(parsed.showTranslation !== false);
            if (parsed.apiBase) {
              setDuaApiBaseLocal(parsed.apiBase);
              await setDuaApiBase(parsed.apiBase);
            } else {
              const current = await getDuaApiBase();
              if (current) setDuaApiBaseLocal(current);
            }
          } else {
            const current = await getDuaApiBase();
            if (current) setDuaApiBaseLocal(current);
          }
        } catch (e) {}

        try {
          const rawCache = await AsyncStorage.getItem(UPDATE_CACHE_KEY);
          if (rawCache) setUpdateCache(JSON.parse(rawCache));
        } catch (e) {}
      } catch (e) {
        console.warn('Settings load failed', e);
      } finally {
        setLoading(false);
        setQuranLoading(false);
        setDuaLoading(false);
      }
    })();
  }, []);

  const onChangeAdjustment = (key, text) => {
    const parsed = parseInt(text, 10);
    setAdjustments((s) => ({ ...s, [key]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  const persistDuaSettings = async (opts = {}) => {
    try {
      const payload = {
        showTransliteration: duaShowTransliteration,
        showTranslation: duaShowTranslation,
        apiBase: duaApiBase?.trim() || null,
      };
      await AsyncStorage.setItem(DUA_SETTINGS_KEY, JSON.stringify(payload));
      if (opts.applyApi) {
        await setDuaApiBase(payload.apiBase || '');
      }
    } catch (e) {
      console.warn('Failed to save dua settings', e);
      throw e;
    }
  };

  const onSave = async (alsoRecalculate = false) => {
    try {
      await saveSalahSettings({ method, madhab, adjustments });
      await saveQuranSettings({
        reciter,
        playTranslation,
        useOfflineAudioWhenAvailable: offlineAudio,
        showTranslation: showTranslationQuran,
        showTransliteration: showTransliterationQuran,
        enableWordDefinitions,
      });
      await persistDuaSettings({ applyApi: true });

      Alert.alert('Saved', 'Settings have been saved.');

      if (alsoRecalculate) {
        const { calculateSalahTimes } = require('../../services/salah_calculate');
        await calculateSalahTimes(() => {}, { method, madhab, adjustments });
        Alert.alert('Recalculated', 'Prayer times recalculated with new settings.');
      }
    } catch (e) {
      console.warn('save failed', e);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const onReset = async () => {
    try {
      setMethod('Moonsighting');
      setMadhab('hanafi');
      setAdjustments({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
      await saveSalahSettings({ method: 'Moonsighting', madhab: 'hanafi', adjustments: {} });

      setReciter('ar.alafasy');
      setPlayTranslation(false);
      setOfflineAudio(true);
      setShowTranslationQuran(true);
      setShowTransliterationQuran(true);
      setEnableWordDefinitions(true);
      await saveQuranSettings({
        reciter: 'ar.alafasy',
        playTranslation: false,
        useOfflineAudioWhenAvailable: true,
        showTranslation: true,
        showTransliteration: true,
        enableWordDefinitions: true,
      });

      setDuaShowTransliteration(true);
      setDuaShowTranslation(true);
      setDuaApiBaseLocal('');
      await AsyncStorage.removeItem(DUA_SETTINGS_KEY);
      await setDuaApiBase('');

      Alert.alert('Reset', 'Settings reset to defaults.');
    } catch (e) {
      console.warn('reset failed', e);
      Alert.alert('Error', 'Failed to reset settings.');
    }
  };

  if (loading || quranLoading || duaLoading) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const renderAdjustmentInput = (label, key) => (
    <View style={styles.adjustRow} key={key}>
      <Text style={styles.adjustLabel}>{label}</Text>
      <TextInput
        style={styles.adjustInput}
        keyboardType="numeric"
        value={String(adjustments[key] ?? 0)}
        onChangeText={(t) => onChangeAdjustment(key, t)}
        placeholder="0"
      />
      <Text style={styles.adjustHint}>min</Text>
    </View>
  );

  const checkForUpdates = async (opts = { force: false }) => {
    try {
      setCheckingUpdate(true);

      if (!opts.force && updateCache && updateCache.lastChecked) {
        const last = new Date(updateCache.lastChecked);
        const ageMinutes = (Date.now() - last.getTime()) / 60000;
        if (ageMinutes < 30) {
          const cachedTag = updateCache.tagName || '';
          const cmp = compareSemver(cachedTag, APP_VERSION);
          if (cmp === 1) {
            Alert.alert(
              'Update available',
              `A newer release (${cachedTag}) is available.\n\n${(updateCache.name ? updateCache.name + '\n\n' : '')}${(updateCache.notes || '').slice(0, 1000)}`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open release',
                  onPress: async () => {
                    if (updateCache.htmlUrl) await Linking.openURL(updateCache.htmlUrl);
                  },
                },
              ],
            );
          } else {
            Alert.alert('Up to date', `Current version ${APP_VERSION} is up to date (latest: ${cachedTag || APP_VERSION}).`);
          }
          setCheckingUpdate(false);
          return;
        }
      }

      const res = await fetch(GITHUB_LILLaAH_RELEASES_API, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'LilLaah-App',
        },
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`GitHub API error ${res.status}: ${errText}`);
      }

      const release = await res.json();
      const tagName = normaliseVersion(release.tag_name || release.name || '');
      const releaseName = release.name || tagName || 'Release';
      const releaseNotes = release.body || '';
      const htmlUrl = release.html_url || `https://github.com/hamdivazim/LilLaah/releases`;
      const cmp = compareSemver(tagName, APP_VERSION);

      const cacheObj = {
        lastChecked: new Date().toISOString(),
        tagName,
        name: releaseName,
        notes: releaseNotes,
        htmlUrl,
      };
      try {
        await AsyncStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify(cacheObj));
        setUpdateCache(cacheObj);
      } catch (e) {
        console.warn('Failed to cache update info', e);
      }

      if (cmp === 1) {
        Alert.alert(
          'Update available',
          `${releaseName} (${tagName}) is available.\n\n${releaseNotes ? releaseNotes.slice(0, 1000) : 'No release notes.'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open release',
              onPress: async () => {
                try {
                  await Linking.openURL(htmlUrl);
                } catch (e) {
                  Alert.alert('Error', 'Failed to open release page.');
                }
              },
            },
          ],
        );
      } else {
        Alert.alert('Up to date', `You are on ${APP_VERSION}. No newer releases found.`);
      }
    } catch (e) {
      console.warn('checkForUpdates failed', e);
      Alert.alert('Update check failed', `Could not check for updates. ${e.message || ''}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const exportLocalStorage = async () => {
    try {
      setExporting(true);
      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys);
      const data = {};
      entries.forEach(([k, v]) => {
        data[k] = v;
      });
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'LilLaah',
        version: APP_VERSION,
        data,
      };
      const json = JSON.stringify(payload, null, 2);
      await Clipboard.setStringAsync(json);
      setExporting(false);
      Alert.alert('Exported', 'All local storage copied to clipboard as JSON. Paste it into a file or another device to import.');
    } catch (e) {
      console.warn('export failed', e);
      setExporting(false);
      Alert.alert('Error', 'Failed to export local storage.');
    }
  };

  const openImportModal = async () => {
    setImportText('');
    setImportModalVisible(true);
  };

  const applyImportedPayload = async (payloadObj) => {
    const target = payloadObj && payloadObj.data ? payloadObj.data : payloadObj;
    if (!target || typeof target !== 'object') throw new Error('Invalid payload format');
    const entries = Object.entries(target);

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Import local storage',
        `This will write ${entries.length} keys into local storage. Existing keys may be overwritten. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('User cancelled')) },
          {
            text: 'Proceed',
            onPress: async () => {
              try {
                const sets = entries.map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
                for (let i = 0; i < sets.length; i += 50) {
                  const chunk = sets.slice(i, i + 50);
                  await AsyncStorage.multiSet(chunk);
                }
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          },
        ],
      );
    });
  };

  const importFromText = async () => {
    if (!importText || !importText.trim()) {
      Alert.alert('Empty', 'Paste the exported JSON into the box first.');
      return;
    }
    setImporting(true);
    try {
      let parsed = null;
      try {
        parsed = JSON.parse(importText);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
      await applyImportedPayload(parsed);
      setImportModalVisible(false);
      setImportText('');
      Alert.alert('Imported', 'Local storage imported. You may need to close and reopen the app or visit settings to refresh values.');
    } catch (e) {
      console.warn('import failed', e);
      Alert.alert('Import failed', e.message || 'Could not import data.');
    } finally {
      setImporting(false);
    }
  };

  const clearAllStorage = async () => {
    Alert.alert('Clear all storage', 'This will remove ALL local storage for the app (irreversible). Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            Alert.alert('Cleared', 'All local storage removed. The app may need to restart to apply defaults.');
          } catch (e) {
            Alert.alert('Error', 'Failed to clear storage.');
          }
        },
      },
    ]);
  };

  const openDuaDhikrLink = async () => {
    const url = 'https://github.com/hamdivazim/lillaah-dua-api';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert(`Don't know how to open this URL: ${url}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const appearanceOptions = [
    { key: 'system', label: 'System', hint: 'Follow device theme' },
    { key: 'light', label: 'Light', hint: 'Always light mode' },
    { key: 'dark', label: 'Dark', hint: 'Always dark mode' },
    { key: 'time', label: 'Time', hint: 'Use local sunrise/sunset' },
  ];

  return (
    <>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: topPadding + 20 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Updates</Text>

        <View style={styles.updateContainer}>
          <Text style={styles.sectionTitleSmall}>App updates</Text>
          <Text style={styles.smallNote}>Current version: {APP_VERSION}</Text>
          <View style={{ height: 8 }} />
          <View style={styles.updateRow}>
            <TouchableOpacity
              style={[styles.checkBtn, checkingUpdate && { opacity: 0.7 }]}
              onPress={() => checkForUpdates({ force: true })}
              disabled={checkingUpdate}
            >
              {checkingUpdate ? <ActivityIndicator /> : <Text style={styles.checkBtnText}>Check for updates</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkGhost}
              onPress={async () => {
                const url = 'https://github.com/hamdivazim/LilLaah/releases';
                try {
                  const supported = await Linking.canOpenURL(url);
                  if (supported) await Linking.openURL(url);
                  else Alert.alert("Can't open releases page");
                } catch (e) {
                  Alert.alert('Error', 'Failed to open releases page.');
                }
              }}
            >
              <Text style={styles.checkGhostText}>Open releases</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 8 }} />
          {updateCache ? (
            <Text style={styles.smallNote}>Last checked: {new Date(updateCache.lastChecked).toLocaleString('en-GB')}</Text>
          ) : (
            <Text style={styles.smallNote}>Not checked yet</Text>
          )}
        </View>

        <View style={{ height: 18 }} />

        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.sectionLabel}>Theme mode</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {appearanceOptions.map((opt) => {
            const active = opt.key === (darkModeMethod || 'system');
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.methodButton, active && styles.methodButtonActive, { minWidth: 100 }]}
                onPress={() => {
                  try {
                    if (typeof setDarkModeMethod === 'function') setDarkModeMethod(opt.key);
                  } catch (e) {
                    console.warn('Failed to set dark mode method', e);
                  }
                }}
              >
                <Text style={[styles.methodText, active && styles.methodTextActive]} numberOfLines={1}>
                  {opt.label}
                </Text>
                <Text style={[styles.smallNote, { marginTop: 4, color: active ? undefined : '#9AA7C7' }]}>{opt.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Text style={styles.smallNote}>
          Choose how the app selects dark or light theme. 'Time' uses sunrise/sunset (location required).
        </Text>

        <View style={{ height: 18 }} />

        <Text style={styles.title}>Salah Settings</Text>
        <Text style={styles.sectionLabel}>Calculation Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {['Karachi', 'MWL', 'ISNA', 'Egypt', 'UmmAlQura', 'Tehran', 'Moonsighting', 'Makkah'].map((m) => {
            const active = m === method;
            return (
              <TouchableOpacity key={m} style={[styles.methodButton, active && styles.methodButtonActive]} onPress={() => setMethod(m)}>
                <Text style={[styles.methodText, active && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.rowSpace}>
          <Text style={styles.sectionLabel}>Madhab (Asr)</Text>
          <View style={styles.madhabRow}>
            <Text style={styles.madhabText}>{madhab === 'hanafi' ? 'Hanafi' : 'Shafi'}</Text>
            <Switch
              value={madhab === 'hanafi'}
              onValueChange={(val) => setMadhab(val ? 'hanafi' : 'shafi')}
              thumbColor={madhab === 'hanafi' ? '#2E8B57' : '#fff'}
              trackColor={{ false: '#ccc', true: '#A3D9A5' }}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Per-prayer adjustments</Text>
        <Text style={styles.smallNote}>Apply minute offsets to match your mosque.</Text>
        <View style={{ marginTop: 8 }}>
          {renderAdjustmentInput('Fajr', 'fajr')}
          {renderAdjustmentInput('Sunrise', 'sunrise')}
          {renderAdjustmentInput('Dhuhr', 'dhuhr')}
          {renderAdjustmentInput('Asr', 'asr')}
          {renderAdjustmentInput('Maghrib', 'maghrib')}
          {renderAdjustmentInput('Isha', 'isha')}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(true)}>
            <Text style={styles.saveText}>Save & Recalculate</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveGhost} onPress={() => onSave(false)}>
            <Text style={styles.saveGhostText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 18 }} />
        <Text style={styles.title}>Duas Settings</Text>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>Dua API base URL</Text>
          <Text style={styles.smallNote}>Change the remote API used to fetch duas. Leave blank to use default.</Text>
          <TextInput
            style={styles.apiInput}
            placeholder="https://example-dua-api.example"
            value={duaApiBase}
            onChangeText={setDuaApiBaseLocal}
            autoCapitalize="none"
            keyboardType="url"
            placeholderTextColor="#9AA7C7"
          />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.saveBtn, { marginRight: 8 }]}
              onPress={async () => {
                try {
                  Keyboard.dismiss();
                  await persistDuaSettings({ applyApi: true });
                  Alert.alert('Saved', 'Dua API and settings saved.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to save Dua settings.');
                }
              }}
            >
              <Text style={styles.saveText}>Apply API</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveGhost}
              onPress={async () => {
                setDuaApiBaseLocal('');
                try {
                  await persistDuaSettings({ applyApi: true });
                  Alert.alert('Reset', 'Dua API reset to default.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to reset Dua API.');
                }
              }}
            >
              <Text style={styles.saveGhostText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>Reset to defaults</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          Settings are stored locally. Dua API must be a fork of fitrahive/dua-dhikr. Visit the{' '}
          <Text style={styles.footerNoteLink} onPress={openDuaDhikrLink}>
            Dua API GitHub
          </Text>{' '}
          for more details.
        </Text>

        <View style={{ height: 18 }} />

        <Text style={[styles.title, { marginTop: 6 }]}>Import / Export</Text>
        <View style={styles.importContainer}>
          <Text style={styles.smallNote}>Export your app's local storage as JSON (copied to clipboard). Import by pasting previously exported JSON.</Text>
          <View style={{ height: 8 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={[styles.importBtn, exporting && { opacity: 0.7 }]} onPress={exportLocalStorage} disabled={exporting}>
              {exporting ? <ActivityIndicator color="#fff" /> : <Text style={styles.importBtnText}>Export to clipboard</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.importGhost} onPress={openImportModal}>
              <Text style={styles.importGhostText}>Import JSON</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 8 }} />
          <TouchableOpacity style={[styles.clearBtn]} onPress={clearAllStorage}>
            <Text style={styles.clearText}>Clear all app storage</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />

        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text style={[styles.smallNote, { textAlign: 'center' }]}>
            Made with{' '}
            <Text style={{ color: '#E25555' }}>
              ♥
            </Text>{' '}
            by{' '}
            <Text
              style={styles.footerNoteLink}
              onPress={async () => {
                try {
                  const url = 'https://github.com/hamdivazim';
                  const ok = await Linking.canOpenURL(url);
                  if (ok) await Linking.openURL(url);
                } catch (e) {}
              }}
            >
              hamdivazim
            </Text>
          </Text>
        </View>
      </ScrollView>

      <Modal visible={importModalVisible} animationType="slide" onRequestClose={() => setImportModalVisible(false)} transparent>
        <View style={styles.importModalOverlay}>
          <View style={styles.importModal}>
            <Text style={[styles.title, { fontWeight: '800', marginBottom: 8 }]}>Paste exported JSON</Text>
            <Text style={{ color: '#6B7A99', marginBottom: 8, fontSize: 12 }}>
              Paste the JSON you copied from another device or from Export. This will write keys into local storage.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              style={styles.importTextInput}
              placeholder="Paste export JSON here"
              multiline
              textAlignVertical="top"
              placeholderTextColor={systemIsDark ? '#BBBBBB' : '#555555'}
            />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.importBtn, { flex: 1, marginRight: 8 }]} onPress={importFromText} disabled={importing}>
                {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.importBtnText}>Import</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.importGhost, { width: 100, alignItems: 'center' }]} onPress={() => { setImportModalVisible(false); setImportText(''); }}>
                <Text style={styles.importGhostText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
