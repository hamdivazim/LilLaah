import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput,
  Modal, Alert, Platform, Linking, BackHandler, Pressable, SafeAreaView as RN_SafeAreaView,
  Dimensions, Switch, Keyboard, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as Font from 'expo-font';
import * as Clipboard from 'expo-clipboard';
import debounce from 'lodash.debounce';
import Journal from './journal';
import {
  getSurahList, getSurah, getRecitersList, getBookmarks, saveBookmark, removeBookmark,
  getQuranSettings, saveQuranSettings, getDownloadIndex, downloadSurahJson, downloadSurahAudio,
  deleteSurahDownload, getFavorites, saveFavorite, removeFavorite, getDownloadedAyahPath
} from '../../services/quran_service';
import { getStyles, palette } from '../styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_OVERLAY_HEIGHT = 180;
const BOTTOM_PLAYER_HEIGHT = 92;
const ITEM_APPROX_HEIGHT = 120;

function IconButton({ onPress, icon, label, style, accessibilityLabel, styles, themeVars }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconButton, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel} activeOpacity={0.8}>
      <Ionicons name={icon} size={18} color={themeVars?.ICON_ACTIVE ?? '#2E8B57'} />
      {label ? <Text style={styles.iconButtonText}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

function LoadingCentered({ text = null, styles, themeVars }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={themeVars?.ICON_MUTED ?? '#6B7A99'} />
      {text ? <Text style={{ marginTop: 8, color: themeVars?.ICON_MUTED ?? '#6B7A99' }}>{text}</Text> : null}
    </View>
  );
}

const AyahRow = React.memo(function AyahRow({
  ayah, index, fontsLoaded, isActive, isPlaying, onPlay, onPause, onToggleFavourite, isFavourited,
  onDownloadPress, onLongPress, showTranslation, showTransliteration, enableWordDefinitions, onWordPress, underlineArabicWords, styles, themeVars
}) {
  const arabicWords = enableWordDefinitions ? (ayah.text_ar || '').split(/\s+/).filter(Boolean) : null;
  return (
    <View style={[styles.ayahCard, isActive ? styles.ayahCardActive : null]}>
      <View style={styles.ayahMeta}>
        <View style={styles.ayahBadge}><Text style={styles.ayahBadgeText}>{ayah.numberInSurah}</Text></View>
        <TouchableOpacity onPress={() => (isActive && isPlaying ? onPause(index) : onPlay(index))} style={styles.smallIcon} accessibilityLabel={`Play ayah ${ayah.numberInSurah}`}>
          <Ionicons name={isActive && isPlaying ? 'pause' : 'play'} size={16} color={themeVars?.ICON_ACTIVE ?? '#2E8B57'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToggleFavourite(ayah)} style={styles.smallIcon} accessibilityLabel="Toggle favourite">
          <Ionicons name={isFavourited ? 'heart' : 'heart-outline'} size={16} color={isFavourited ? (themeVars?.ERROR_COLOR ?? '#d9534f') : (themeVars?.ICON_ACTIVE ?? '#2E8B57')} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDownloadPress(ayah)} style={styles.smallIcon} accessibilityLabel="Download ayah audio">
          <Ionicons name="cloud-download-outline" size={16} color={themeVars?.ICON_ACTIVE ?? '#2E8B57'} />
        </TouchableOpacity>
      </View>

      <Pressable style={styles.ayahTextWrap} onPress={() => onPlay(index)} onLongPress={() => onLongPress(ayah, index)}>
        {enableWordDefinitions && Array.isArray(arabicWords) && arabicWords.length > 0 ? (
          <Text style={[styles.ayahArabic, fontsLoaded ? { fontFamily: 'Quran' } : null]} selectable>
            {arabicWords.map((w, wi) => (
              <Text key={`${index}-${wi}`} accessible={true} accessibilityLabel={w}>
                <Text
                  onPress={() => onWordPress && onWordPress(w, wi, ayah, index)}
                  style={[styles.arabicWordPressable, underlineArabicWords ? styles.underlineOn : styles.underlineOff, { color: (themeVars?.TEXT_PRIMARY ?? '#0B2447') }]}
                >
                  {w}
                </Text>{' '}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={[styles.ayahArabic, fontsLoaded ? { fontFamily: 'Quran' } : null]} selectable>{ayah.text_ar}</Text>
        )}

        {showTransliteration && ayah.text_transliteration ? <Text style={[styles.ayahTransliteration, { color: (themeVars?.ICON_MUTED ?? '#6B7A99') }]}>{ayah.text_transliteration}</Text> : null}
        {showTranslation && ayah.text_translation ? <Text style={[styles.ayahTranslation, { color: (themeVars?.TEXT_PRIMARY ?? '#0B2447') }]}>{ayah.text_translation}</Text> : null}
      </Pressable>
    </View>
  );
}, (prev, next) => {
  return (
    prev.ayah === next.ayah &&
    prev.index === next.index &&
    prev.fontsLoaded === next.fontsLoaded &&
    prev.isActive === next.isActive &&
    prev.isPlaying === next.isPlaying &&
    prev.isFavourited === next.isFavourited &&
    prev.showTranslation === next.showTranslation &&
    prev.showTransliteration === next.showTransliteration &&
    prev.enableWordDefinitions === next.enableWordDefinitions &&
    prev.underlineArabicWords === next.underlineArabicWords &&
    prev.themeVars === next.themeVars
  );
});

export default function Quran({ systemIsDark }) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [surahList, setSurahList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [screen, setScreen] = useState('discover');
  const [query, setQuery] = useState('');
  const [searchInside, setSearchInside] = useState(false);
  const [contentSearchResults, setContentSearchResults] = useState([]);
  const [searchingContent, setSearchingContent] = useState(false);
  const [openSurahNumber, setOpenSurahNumber] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [bookmarks, setBookmarks] = useState({});
  const [downloadIndex, setDownloadIndex] = useState({});
  const [favourites, setFavourites] = useState({});
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showFavouritesModal, setShowFavouritesModal] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [enableWordDefinitions, setEnableWordDefinitions] = useState(false);
  const [underlineArabicWords, setUnderlineArabicWords] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const soundRef = useRef(null);
  const audioLoadingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playWithTranslation, setPlayWithTranslation] = useState(false);
  const [useOfflineAudio, setUseOfflineAudio] = useState(true);
  const playQueueRef = useRef({ index: 0, autoplay: true });
  const mountedRef = useRef(true);
  const lastPosUpdateRef = useRef(0);
  const loadedIndexRef = useRef(null);
  const pendingPlayRequestRef = useRef(null);
  const flatListRef = useRef(null);
  const progressBarWidthRef = useRef(0);
  const targetScrollIndexRef = useRef(null);
  const scrollAttemptsRef = useRef(0);
  const MAX_SCROLL_ATTEMPTS = 6;
  const [wordModalVisible, setWordModalVisible] = useState(false);
  const [wordModalContent, setWordModalContent] = useState({ word: '', ayah: null, wordIndex: null, ayahIndex: null, definition: null, loading: false });
  const [juzModalVisible, setJuzModalVisible] = useState(false);

  const styles = getStyles("quran", systemIsDark);

  const themeVars = useMemo(() => {
    const p = palette(systemIsDark);
    return {
      ICON_ACTIVE: systemIsDark ? p.HERO_ACCENT : p.HERO_BG,
      ICON_MUTED: p.MUTED,
      TEXT_PRIMARY: p.PRIMARY,
      ERROR_COLOR: p.ERROR,
      CARD_BG: p.CARD_BG,
      SAFE_BG: p.SAFE_BG,
    };
  }, [systemIsDark]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await Font.loadAsync({ Quran: require('../../assets/fonts/quran.ttf') });
        if (mountedRef.current) setFontsLoaded(true);
      } catch (e) { console.warn('Font load failed', e); if (mountedRef.current) setFontsLoaded(false); }
    })();
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const [list, settings, bm, dl, favs] = await Promise.all([getSurahList(), getQuranSettings(), getBookmarks(), getDownloadIndex(), getFavorites()]);
        if (cancelled) return;
        setSurahList(Array.isArray(list) ? list : []);
        setPlayWithTranslation(Boolean(settings.playTranslation));
        setUseOfflineAudio(Boolean(settings.useOfflineAudioWhenAvailable));
        setShowTranslation(settings.showTranslation !== false);
        setShowTransliteration(settings.showTransliteration !== false);
        setEnableWordDefinitions(settings.enableWordDefinitions !== false);
        setUnderlineArabicWords(settings.underlineArabicWords !== false);
        setBookmarks(bm || {});
        setDownloadIndex(dl || {});
        setFavourites(favs || {});
      } catch (e) {
        console.warn('initial load failed', e);
        if (!cancelled) Alert.alert('Error', 'Could not load Quran data.');
      } finally { if (!cancelled) setLoadingList(false); }
    })();

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true, staysActiveInBackground: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true, playThroughEarpieceAndroid: false,
        });
      } catch (e) { console.warn('Audio.setAudioModeAsync:', e); }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      if (screen === 'reader') {
        (async () => {
          try {
            if (soundRef.current) {
              try { soundRef.current.setOnPlaybackStatusUpdate(null); } catch (e) {}
              try { await soundRef.current.stopAsync(); } catch (e) {}
              try { await soundRef.current.unloadAsync(); } catch (e) {}
              soundRef.current = null;
              loadedIndexRef.current = null;
            }
          } catch (e) {}
          setIsPlaying(false);
          setCurrentAyahIndex(null);
        })();
        setScreen('discover'); setSurahData(null); setOpenSurahNumber(null);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [screen]);

  const unloadCurrentSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        try { soundRef.current.setOnPlaybackStatusUpdate(null); } catch (e) {}
        try { await soundRef.current.unloadAsync(); } catch (e) {}
      }
    } catch (e) {}
    finally {
      soundRef.current = null; loadedIndexRef.current = null; audioLoadingRef.current = false; pendingPlayRequestRef.current = null;
      if (mountedRef.current) { setIsPlaying(false); setPositionMillis(0); setDurationMillis(0); }
    }
  }, []);

  const resolveAudioUri = useCallback(async (surahNum, ayah) => {
    if (!ayah) return null;
    if (useOfflineAudio) {
      try {
        const local = await getDownloadedAyahPath(surahNum, ayah.numberInSurah);
        if (local) return local;
      } catch (e) {}
    }
    return ayah.audio || null;
  }, [useOfflineAudio]);

  const createPlaybackStatusHandler = useCallback((forIndex) => {
    return (s) => {
      if (!mountedRef.current) return;
      try {
        const now = Date.now();
        if (typeof s.positionMillis === 'number' && (!lastPosUpdateRef.current || (now - lastPosUpdateRef.current) > 200)) {
          setPositionMillis(s.positionMillis);
          lastPosUpdateRef.current = now;
        }
        if (typeof s.durationMillis === 'number') setDurationMillis(s.durationMillis);
        if (typeof s.isPlaying === 'boolean') setIsPlaying(s.isPlaying);
        if (s.didJustFinish && !s.isLooping) {
          const autoplay = playQueueRef.current.autoplay;
          const ay = surahData?.ayahs?.[forIndex];
          if (playWithTranslation && ay?.text_translation) {
            try {
              Speech.speak(ay.text_translation, { rate: 0.95, onDone: () => { if (autoplay) tryGotoNext(forIndex); }, onError: () => { if (autoplay) tryGotoNext(forIndex); } });
            } catch (e) { if (autoplay) tryGotoNext(forIndex); }
          } else {
            if (autoplay) tryGotoNext(forIndex);
          }
        }
      } catch (e) {}
    };
  }, [playWithTranslation, surahData]);

  const playAyahAtIndex = useCallback(async (indexToPlay, { autoplayNext = true } = {}) => {
    if (!surahData || !surahData.ayahs || typeof indexToPlay !== 'number') return;
    if (indexToPlay < 0 || indexToPlay >= surahData.ayahs.length) return;
    playQueueRef.current.index = indexToPlay; playQueueRef.current.autoplay = autoplayNext;
    if (audioLoadingRef.current) { pendingPlayRequestRef.current = { index: indexToPlay, autoplayNext }; return; }
    audioLoadingRef.current = true;
    try {
      if (soundRef.current && loadedIndexRef.current === indexToPlay) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) { await soundRef.current.pauseAsync(); if (mountedRef.current) setIsPlaying(false); }
            else { await soundRef.current.playAsync(); if (mountedRef.current) setIsPlaying(true); }
            audioLoadingRef.current = false; return;
          }
        } catch (e) {}
      }
      await unloadCurrentSound();
      const ayah = surahData.ayahs[indexToPlay];
      const uri = await resolveAudioUri(openSurahNumber, ayah);
      if (!uri) { Alert.alert('Audio', 'No audio available for this verse.'); audioLoadingRef.current = false; return; }
      const handler = createPlaybackStatusHandler(indexToPlay);
      const createResult = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, staysActiveInBackground: true });
      const sound = createResult.sound;
      if (!sound) throw new Error('Failed to create sound');
      try { sound.setOnPlaybackStatusUpdate(handler); } catch (e) {}
      soundRef.current = sound; loadedIndexRef.current = indexToPlay;
      const status = createResult.status || {};
      if (mountedRef.current) { setCurrentAyahIndex(indexToPlay); setIsPlaying(status.isPlaying ?? true); setDurationMillis(status.durationMillis ?? 0); setPositionMillis(status.positionMillis ?? 0); }
    } catch (e) {
      console.warn('playAyahAtIndex error', e);
      if (mountedRef.current) { setIsPlaying(false); setCurrentAyahIndex(null); setPositionMillis(0); setDurationMillis(0); }
    } finally {
      audioLoadingRef.current = false;
      if (pendingPlayRequestRef.current) {
        const p = pendingPlayRequestRef.current; pendingPlayRequestRef.current = null;
        setTimeout(() => { playAyahAtIndex(p.index, { autoplayNext: p.autoplayNext }).catch(() => {}); }, 50);
      }
    }
  }, [surahData, openSurahNumber, resolveAudioUri, unloadCurrentSound, createPlaybackStatusHandler]);

  const tryGotoNext = useCallback(async (currentIndex) => {
    const next = currentIndex + 1;
    if (!surahData || next >= (surahData.ayahs?.length || 0)) {
      await unloadCurrentSound();
      if (mountedRef.current) { setCurrentAyahIndex(null); setIsPlaying(false); setPositionMillis(0); setDurationMillis(0); }
      return;
    }
    await playAyahAtIndex(next, { autoplayNext: true });
  }, [surahData, playAyahAtIndex, unloadCurrentSound]);

  const togglePlayPause = useCallback(async () => {
    if (audioLoadingRef.current) return;
    if (!soundRef.current) {
      const start = typeof playQueueRef.current.index === 'number' ? playQueueRef.current.index : 0;
      if (surahData?.ayahs?.length) await playAyahAtIndex(start, { autoplayNext: true });
      return;
    }
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) { await soundRef.current.pauseAsync(); if (mountedRef.current) setIsPlaying(false); }
        else { await soundRef.current.playAsync(); if (mountedRef.current) setIsPlaying(true); }
      } else {
        const idx = playQueueRef.current.index ?? 0;
        await playAyahAtIndex(idx, { autoplayNext: true });
      }
    } catch (e) { console.warn('togglePlayPause error', e); }
  }, [playAyahAtIndex, surahData]);

  async function seekTo(positionMs) {
    try {
      if (!soundRef.current) return;
      await soundRef.current.setPositionAsync(Math.max(0, Math.min(positionMs, durationMillis || 0)));
      const s = await soundRef.current.getStatusAsync();
      if (mountedRef.current) setPositionMillis(s.positionMillis || 0);
    } catch (e) { console.warn('seekTo failed', e); }
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      (async () => { try { await unloadCurrentSound(); } catch (e) {} })();
    };
  }, []);

  const attemptScroll = useCallback((index) => {
    scrollAttemptsRef.current = scrollAttemptsRef.current || 0;
    if (!flatListRef.current || typeof index !== 'number') return;
    try {
      flatListRef.current.scrollToIndex({ index, viewPosition: 0.2, animated: true });
      scrollAttemptsRef.current = 0;
      setTimeout(() => { try { flatListRef.current.scrollToIndex({ index, viewPosition: 0.2, animated: true }); } catch (e) {} }, 120);
    } catch (err) {
      scrollAttemptsRef.current = (scrollAttemptsRef.current || 0) + 1;
      if (scrollAttemptsRef.current <= MAX_SCROLL_ATTEMPTS) {
        const delay = 80 * scrollAttemptsRef.current;
        setTimeout(() => { attemptScroll(index); }, delay);
        return;
      }
      try {
        const paddingTop = HEADER_OVERLAY_HEIGHT;
        const offset = Math.max(0, (index * ITEM_APPROX_HEIGHT) - Math.round(paddingTop * 0.3));
        flatListRef.current.scrollToOffset({ offset, animated: true });
      } catch (e) { console.warn('scroll fallback failed', e); }
      finally { scrollAttemptsRef.current = 0; }
    }
  }, []);

  useEffect(() => {
    if (!surahData) return;
    const idx = targetScrollIndexRef.current;
    if (typeof idx === 'number' && flatListRef.current) {
      setTimeout(() => attemptScroll(idx), 90);
      targetScrollIndexRef.current = null;
    }
  }, [surahData, attemptScroll]);

  const openSurah = useCallback(async (surahNumber, scrollToAyah = null) => {
    if (!surahNumber) return;
    await unloadCurrentSound();
    setOpenSurahNumber(surahNumber); setScreen('reader'); setLoadingSurah(true); setSurahData(null);
    try {
      const settings = await getQuranSettings();
      const reciter = settings?.reciter ?? 'ar.alafasy';
      const data = await getSurah(surahNumber, [reciter, 'en.sahih', 'en.transliteration']);
      if (!mountedRef.current) return;
      setSurahData(data);
      if (typeof scrollToAyah === 'number' && data?.ayahs?.length) {
        const idx = Math.max(0, scrollToAyah - 1);
        playQueueRef.current.index = idx; setCurrentAyahIndex(idx);
        targetScrollIndexRef.current = idx; scrollAttemptsRef.current = 0;
      } else { playQueueRef.current.index = 0; setCurrentAyahIndex(null); targetScrollIndexRef.current = null; }
    } catch (e) {
      console.warn('openSurah failed', e);
      Alert.alert('Surah', 'Failed to load surah.');
      setScreen('discover'); setOpenSurahNumber(null);
    } finally { if (mountedRef.current) setLoadingSurah(false); }
  }, [unloadCurrentSound]);

  const metadataFiltered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return surahList;
    return (surahList || []).filter(s => {
      return (String(s.number).includes(q) || (s.name && s.name.toLowerCase().includes(q)) || (s.englishName && s.englishName.toLowerCase().includes(q)) || (s.englishNameTranslation && s.englishNameTranslation.toLowerCase().includes(q)));
    });
  }, [surahList, query]);

  const contentSearchRunnerRef = useRef({ running: false, cancel: false });
  const runContentSearchRef = useRef(null);

  useEffect(() => {
    runContentSearchRef.current = debounce(async (text) => {
      if (!text || text.trim().length < 2) { if (mountedRef.current) setContentSearchResults([]); return; }
      if (!surahList || !surahList.length) return;
      contentSearchRunnerRef.current.running = true; contentSearchRunnerRef.current.cancel = false; if (mountedRef.current) setSearchingContent(true);
      const needle = text.trim().toLowerCase();
      const out = [];
      for (let i = 0; i < surahList.length; i++) {
        if (contentSearchRunnerRef.current.cancel) break;
        try {
          const s = await getSurah(surahList[i].number, ['en.sahih', 'ar.alafasy', 'en.transliteration']);
          if (!s || !s.ayahs) continue;
          for (const ay of s.ayahs) {
            if (contentSearchRunnerRef.current.cancel) break;
            const hay = `${ay.text_ar || ''} ${ay.text_translation || ''} ${ay.text_transliteration || ''}`.toLowerCase();
            if (hay.includes(needle)) {
              out.push({ surah: s.meta.number, ayah: ay.numberInSurah, name: s.meta.englishName, snippet: (ay.text_translation || ay.text_ar || '').slice(0, 140) });
              if (out.length >= 60) break;
            }
          }
          if (out.length >= 60) break;
        } catch (e) {}
      }
      if (!contentSearchRunnerRef.current.cancel && mountedRef.current) setContentSearchResults(out);
      contentSearchRunnerRef.current.running = false; if (mountedRef.current) setSearchingContent(false);
    }, 500);
    return () => { if (runContentSearchRef.current && runContentSearchRef.current.cancel) runContentSearchRef.current.cancel(); };
  }, [surahList]);

  useEffect(() => { return () => { contentSearchRunnerRef.current.cancel = true; if (runContentSearchRef.current && runContentSearchRef.current.cancel) runContentSearchRef.current.cancel(); }; }, []);

  const refreshBookmarks = useCallback(async () => { try { const bm = await getBookmarks(); if (mountedRef.current) setBookmarks(bm || {}); } catch (e) {} }, []);
  const refreshDownloadIndex = useCallback(async () => { try { const di = await getDownloadIndex(); if (mountedRef.current) setDownloadIndex(di || {}); } catch (e) {} }, []);
  const refreshFavourites = useCallback(async () => { try { const f = await getFavorites(); if (mountedRef.current) setFavourites(f || {}); } catch (e) {} }, []);

  async function toggleBookmarkForSurah(surahNumber) {
    try {
      const bm = await getBookmarks();
      if (bm && bm[String(surahNumber)]) await removeBookmark(surahNumber);
      else await saveBookmark(surahNumber, 1, '');
      await refreshBookmarks();
    } catch (e) { console.warn('toggleBookmark failed', e); }
  }

  async function toggleFavouriteAyah(ayah) {
    if (!ayah || !openSurahNumber) return;
    const key = `${openSurahNumber}:${ayah.numberInSurah}`;
    try {
      if (favourites && favourites[key]) await removeFavorite(openSurahNumber, ayah.numberInSurah);
      else await saveFavorite({ surah: openSurahNumber, ayah: ayah.numberInSurah, text_ar: ayah.text_ar || '', text_translation: ayah.text_translation || '', createdAt: new Date().toISOString() });
      await refreshFavourites();
    } catch (e) { console.warn('toggleFavouriteAyah error', e); }
  }

  async function startDownloadSurah(surahNumber, { audio = true } = {}) {
    if (!surahNumber) return;
    if (!surahData || surahData.meta.number !== surahNumber) { Alert.alert('Download', 'Open the surah first to download with the chosen reciter.'); return; }
    try {
      await downloadSurahJson(surahNumber, surahData);
      if (audio) { await downloadSurahAudio(surahNumber, surahData.ayahs, () => {}); Alert.alert('Downloaded', 'Surah JSON and audio downloaded.'); }
      else Alert.alert('Downloaded', 'Surah JSON downloaded (audio skipped).');
      await refreshDownloadIndex();
    } catch (e) { console.warn('startDownloadSurah failed', e); Alert.alert('Error', 'Failed to download surah.'); }
  }

  async function handleDeleteDownloadedSurah(surahNumber) {
    try {
      const ok = await deleteSurahDownload(surahNumber);
      if (ok) { Alert.alert('Deleted', `Surah ${surahNumber} download removed.`); await refreshDownloadIndex(); }
      else Alert.alert('Delete', 'Nothing to delete for this surah.');
    } catch (e) { console.warn('deleteSurah', e); Alert.alert('Error', 'Could not remove download.'); }
  }

  const fetchWordDefinition = useCallback(async (word) => {
    if (!word) return null;
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const defs = [];
      if (Array.isArray(data)) {
        data.forEach(entry => {
          (entry.meanings || []).forEach(m => {
            (m.definitions || []).forEach(d => defs.push(d.definition));
          });
        });
      }
      return defs.length ? defs.slice(0,3).join('\n\n') : null;
    } catch (e) { return null; }
  }, []);

  const onWordPressHandler = useCallback(async (word, wordIndex, ayahObj, ayahIndex) => {
    setWordModalContent({ word, ayah: ayahObj, wordIndex, ayahIndex, definition: null, loading: true });
    setWordModalVisible(true);
    let def = null;
    try { def = await fetchWordDefinition(word); } catch (e) { def = null; }
    if (!def) { def = null; }
    setWordModalContent(prev => ({ ...prev, definition: def, loading: false }));
  }, [fetchWordDefinition]);

  function Header() {
    return (
      <View style={styles.header}>
        <View style={{ flex: 1 }}><Text style={styles.title}>Qur'an</Text></View>
        <View style={styles.headerRight}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton icon="heart-outline" onPress={() => setShowFavouritesModal(true)} accessibilityLabel="Open favourites" styles={styles} themeVars={themeVars} />
            <IconButton icon="volume-high-outline" onPress={() => setShowReciterModal(true)} style={{ marginLeft: 8 }} accessibilityLabel="Reciter" styles={styles} themeVars={themeVars} />
            <IconButton
              icon={screen === 'downloads' ? 'close' : 'cloud-download-outline'}
              onPress={() => { if (screen === 'downloads') setScreen('discover'); else { refreshDownloadIndex(); setScreen('downloads'); } }}
              style={{ marginLeft: 8 }} accessibilityLabel="Downloads" styles={styles} themeVars={themeVars}
            />
            <IconButton icon="bookmarks" onPress={() => { refreshBookmarks(); setShowBookmarksModal(true); }} style={{ marginLeft: 8 }} accessibilityLabel="Bookmarks" styles={styles} themeVars={themeVars} />
            <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={[styles.iconButton, { marginLeft: 8, paddingHorizontal: 10 }]}><Ionicons name="settings-outline" size={18} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function SearchRow() {
    return (
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={themeVars.ICON_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchInside ? 'Search verses (press Enter to search)' : 'Search surahs by name or number'}
          placeholderTextColor={themeVars.ICON_MUTED}
          value={query}
          onChangeText={(t) => { setQuery(t); if (searchInside) setContentSearchResults([]); }}
          onSubmitEditing={() => {
            if (searchInside) {
              if (runContentSearchRef.current && runContentSearchRef.current.cancel) runContentSearchRef.current.cancel();
              runContentSearchRef.current && runContentSearchRef.current(query);
            }
            Keyboard.dismiss();
          }}
          returnKeyType="search"
          blurOnSubmit={false}
        />
        <Pressable onPress={() => { setSearchInside(!searchInside); setContentSearchResults([]); }} style={styles.togglePill}>
          <Text style={[styles.toggleText, searchInside ? styles.toggleActive : null]}>Verses</Text>
        </Pressable>
      </View>
    );
  }

  function SurahCard({ item }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => openSurah(item.number)} activeOpacity={0.85}>
        <View style={styles.cardLeft}><View style={styles.indexBubble}><Text style={styles.indexText}>{item.number}</Text></View></View>
        <View style={styles.cardBody}><Text style={styles.surahArabic} numberOfLines={1}>{item.name}</Text><Text style={styles.surahEnglish}>{item.englishName} • {item.englishNameTranslation}</Text></View>
        <View style={styles.cardRight}><Text style={styles.ayahCount}>{item.numberOfAyahs}</Text>
          <TouchableOpacity onPress={() => toggleBookmarkForSurah(item.number)} style={{ marginTop: 8 }}>
            <Ionicons name={bookmarks[String(item.number)] ? 'star' : 'star-outline'} size={18} color={bookmarks[String(item.number)] ? '#FFD166' : themeVars.ICON_ACTIVE} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function ReaderHeader() {
    return (
      <View style={styles.readerHeader}>
        <View style={styles.readerTop}>
          <TouchableOpacity onPress={async () => { await unloadCurrentSound(); setScreen('discover'); setSurahData(null); setOpenSurahNumber(null); }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.readerTitle}>{surahData?.meta?.englishName ?? ''}</Text>
            <Text style={styles.readerSubtitle}>{surahData ? `${surahData.meta.number} • ${surahData.meta.revelationType}` : ''}</Text>
          </View>

          <TouchableOpacity onPress={() => { const url = surahData ? `https://quran.com/${surahData.meta.number}` : 'https://quran.com'; Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link')); }}>
            <Ionicons name="open-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={[styles.bigArabic, fontsLoaded ? { fontFamily: 'Quran' } : null]} numberOfLines={1}>{surahData?.meta?.name ?? ''}</Text>
        </View>

        <View style={styles.readerControls}>
          <TouchableOpacity onPress={() => { const newVal = !playWithTranslation; setPlayWithTranslation(newVal); saveQuranSettings({ playTranslation: newVal }).catch(() => {}); }} style={[styles.controlPill, playWithTranslation ? styles.controlPillActive : null]}>
            <Ionicons name="volume-medium" size={16} color={playWithTranslation ? themeVars.ICON_ACTIVE : '#fff'} />
            <Text style={[styles.controlText, playWithTranslation ? styles.controlTextActive : null]}>Translation</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlPill} onPress={() => setShowReciterModal(true)}>
            <Ionicons name="volume-high-outline" size={16} color="#fff" />
            <Text style={styles.controlText}>Reciter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlPill} onPress={() => {
            Alert.alert('Download', 'Choose download option', [
              { text: 'JSON + audio', onPress: () => startDownloadSurah(openSurahNumber, { audio: true }) },
              { text: 'JSON only', onPress: () => startDownloadSurah(openSurahNumber, { audio: false }) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}>
            <Ionicons name="cloud-download" size={16} color="#fff" />
            <Text style={styles.controlText}>Download</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlPill]} onPress={() => setJuzModalVisible(true)}>
            <Ionicons name="albums-outline" size={16} color="#fff" />
            <Text style={styles.controlText}>Juz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const surahJuzList = useMemo(() => {
    if (!surahData?.ayahs) return [];
    const s = [];
    for (let i = 0; i < surahData.ayahs.length; i++) {
      const j = surahData.ayahs[i].juz;
      if (j != null && !s.includes(j)) s.push(j);
    }
    return s.sort((a, b) => a - b).map((j) => {
      const idx = surahData.ayahs.findIndex(a => a.juz === j);
      return { juz: j, index: idx === -1 ? 0 : idx };
    });
  }, [surahData]);

  function scrollToAyahIndex(idx) { if (!flatListRef.current || typeof idx !== 'number') return; try { attemptScroll(idx); } catch (e) {} }

  function Reader() {
    if (loadingSurah) return <LoadingCentered text="Loading surah…" styles={styles} themeVars={themeVars} />;
    if (!surahData) return <LoadingCentered text="No surah loaded." styles={styles} themeVars={themeVars} />;

    return (
      <View style={{ flex: 1 }}>
        <ReaderHeader />
        <FlatList
          ref={flatListRef}
          data={surahData.ayahs}
          keyExtractor={(a) => String(a.numberInSurah)}
          renderItem={({ item, index }) => (
            <AyahRow
              ayah={item}
              index={index}
              fontsLoaded={fontsLoaded}
              isActive={currentAyahIndex === index}
              isPlaying={isPlaying}
              onPlay={(idx) => { playQueueRef.current.index = idx; playQueueRef.current.autoplay = true; playAyahAtIndex(idx, { autoplayNext: true }); }}
              onPause={async () => { if (soundRef.current) { try { await soundRef.current.pauseAsync(); if (mountedRef.current) setIsPlaying(false); } catch (e) {} } }}
              onToggleFavourite={(a) => toggleFavouriteAyah(a)}
              isFavourited={Boolean(favourites && favourites[`${openSurahNumber}:${item.numberInSurah}`])}
              onDownloadPress={async (a) => { Alert.alert('Download', 'To download this ayah open the Download control in the header (downloads are per-surah).'); }}
              onLongPress={(a, idx) => {
                Alert.alert(`Ayah ${a.numberInSurah}`, undefined, [
                  { text: 'Copy Arabic', onPress: async () => { await Clipboard.setStringAsync(a.text_ar || ''); Alert.alert('Copied'); } },
                  { text: 'Play', onPress: () => playAyahAtIndex(idx, { autoplayNext: false }) },
                  { text: 'Open on quran.com', onPress: () => Linking.openURL(`https://quran.com/${openSurahNumber}/${a.numberInSurah}`).catch(() => Alert.alert('Error')) },
                  { text: 'Save favourite', onPress: () => toggleFavouriteAyah(a) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              enableWordDefinitions={enableWordDefinitions}
              onWordPress={onWordPressHandler}
              underlineArabicWords={underlineArabicWords}
              styles={styles}
              themeVars={themeVars}
            />
          )}
          contentContainerStyle={{ paddingTop: HEADER_OVERLAY_HEIGHT, paddingBottom: BOTTOM_PLAYER_HEIGHT + 24 }}
          ListFooterComponent={<View style={{ height: BOTTOM_PLAYER_HEIGHT + 12 }} />}
          initialNumToRender={8}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          onLayout={() => {
            const idx = playQueueRef.current.index;
            if (typeof idx === 'number' && flatListRef.current) {
              setTimeout(() => { try { attemptScroll(idx); } catch (e) {} }, 250);
            }
          }}
          getItemLayout={(data, index) => ({ length: ITEM_APPROX_HEIGHT, offset: ITEM_APPROX_HEIGHT * index, index })}
        />

        <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
          <View pointerEvents="auto" style={[styles.bottomPlayer]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerTitle}>{surahData?.meta?.englishName ?? 'No surah'}</Text>
              <Text style={styles.playerSubtitle}>{isPlaying ? `Playing ayah ${currentAyahIndex != null ? currentAyahIndex + 1 : '-'}` : 'Paused'}</Text>
              <Pressable
                onLayout={(ev) => progressBarWidthRef.current = ev.nativeEvent.layout.width || 0}
                onPress={(e) => {
                  try {
                    if (!durationMillis) return;
                    const x = e.nativeEvent.locationX || 0;
                    const width = progressBarWidthRef.current || (SCREEN_WIDTH - 64);
                    const ratio = Math.max(0, Math.min(1, x / width));
                    seekTo(Math.round(ratio * durationMillis));
                  } catch (err) { console.warn('progress press', err); }
                }}
                style={{ marginTop: 8, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden', width: '100%' }}
              >
                <View style={{ width: durationMillis ? `${Math.max(0, Math.min(100, (positionMillis / durationMillis) * 100))}%` : '0%', height: 6, backgroundColor: 'rgba(255,255,255,0.95)' }} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
              <TouchableOpacity onPress={() => { const prev = Math.max((playQueueRef.current.index ?? 0) - 1, 0); playAyahAtIndex(prev, { autoplayNext: true }); }} style={styles.playerControl}><Ionicons name="play-skip-back" size={18} color="#fff" /></TouchableOpacity>

              <TouchableOpacity onPress={() => togglePlayPause()} style={[styles.playerControl, { marginHorizontal: 12 }]}><Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" /></TouchableOpacity>

              <TouchableOpacity onPress={() => { const next = (playQueueRef.current.index ?? 0) + 1; if (surahData && next < (surahData.ayahs?.length || 0)) { playAyahAtIndex(next, { autoplayNext: true }); } }} style={styles.playerControl}><Ionicons name="play-skip-forward" size={18} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>

        <Modal visible={juzModalVisible} animationType="slide" onRequestClose={() => setJuzModalVisible(false)}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setJuzModalVisible(false)}><Ionicons name="close" size={22} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.modalTitle}>Juz in this Surah</Text></View>
              <View style={{ width: 36 }} />
            </View>

            <FlatList
              data={surahJuzList}
              keyExtractor={(i) => String(i.juz)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.reciterRow} onPress={() => { setJuzModalVisible(false); scrollToAyahIndex(item.index); }}>
                  <View>
                    <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Juz {item.juz}</Text>
                    <Text style={{ color: themeVars.ICON_MUTED, fontSize: 12 }}>{`Starts at ayah ${surahData?.ayahs?.[item.index]?.numberInSurah ?? '—'}`}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themeVars.ICON_MUTED} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </SafeAreaView>
        </Modal>

        <Modal visible={wordModalVisible} animationType="fade" transparent onRequestClose={() => setWordModalVisible(false)}>
          <View style={styles.wordModalOverlay}>
            <View style={styles.wordModal}>
              <Text style={{ fontWeight: '900', fontSize: 20, marginBottom: 6, color: themeVars.TEXT_PRIMARY }}>{wordModalContent.word}</Text>
              <Text style={{ color: themeVars.ICON_MUTED, marginBottom: 10 }}>{`Ayah ${wordModalContent.ayah?.numberInSurah ?? ''} — Surah ${openSurahNumber ?? ''}`}</Text>
              <View style={{ minHeight: 48, marginBottom: 10 }}>
                {wordModalContent.loading ? <Text style={{ color: themeVars.ICON_MUTED }}>Loading definition…</Text> : (
                  wordModalContent.definition ? <Text style={{ color: themeVars.TEXT_PRIMARY }}>{wordModalContent.definition}</Text> : <Text style={{ color: themeVars.ICON_MUTED }}>No definition found. Try lookup online.</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <TouchableOpacity style={[styles.smallGhost, { backgroundColor: themeVars.CARD_BG }]} onPress={async () => { await Clipboard.setStringAsync(wordModalContent.word || ''); Alert.alert('Copied'); }}><Text style={styles.smallGhostText}>Copy</Text></TouchableOpacity>

                <TouchableOpacity style={[styles.smallGhost, { backgroundColor: themeVars.CARD_BG }]} onPress={() => { const url = `https://www.google.com/search?q=${encodeURIComponent(wordModalContent.word || '')}`; Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open lookup')); }}><Text style={[styles.smallGhostText]}>Lookup online</Text></TouchableOpacity>

                <TouchableOpacity style={[styles.smallGhost, { backgroundColor: themeVars.CARD_BG }]} onPress={() => { setWordModalVisible(false); }}><Text style={[styles.smallGhostText, { color: themeVars.ERROR_COLOR }]}>Close</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <View style={styles.blobTop} pointerEvents="none" />
        <View style={styles.blobBottom} pointerEvents="none" />
        <RN_SafeAreaView style={{ flex: 1 }}>
          {screen === 'reader' ? (<View style={{ flex: 1 }}>{Reader()}</View>) : (
            <>
              <Header />
              <View style={{ paddingHorizontal: 16, marginTop: 12 }}><SearchRow /></View>
              <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 12 }}>
                {screen === 'discover' && (
                  <View style={{ flex: 1 }}>
                    {loadingList ? <LoadingCentered text="Loading surah list…" styles={styles} themeVars={themeVars} /> : (
                      <FlatList
                        data={searchInside ? contentSearchResults : metadataFiltered}
                        keyExtractor={(i) => String(i.number ?? `${i.surah}_${i.ayah}`)}
                        renderItem={({ item }) => (
                          item.surah ? (
                            <TouchableOpacity style={styles.searchResult} onPress={() => openSurah(item.surah, item.ayah)} activeOpacity={0.85}>
                              <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>{item.name} • Ayah {item.ayah}</Text>
                              <Text style={{ color: themeVars.ICON_MUTED, marginTop: 6 }}>{item.snippet}</Text>
                            </TouchableOpacity>
                          ) : (<SurahCard item={item} />)
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 0 }}
                      />
                    )}
                  </View>
                )}

                {screen === 'downloads' && (
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Downloads</Text>
                      <TouchableOpacity onPress={refreshDownloadIndex} style={styles.smallGhost}><Text style={styles.smallGhostText}>Refresh</Text></TouchableOpacity>
                    </View>

                    {Object.keys(downloadIndex || {}).length === 0 ? (
                      <View style={styles.center}><Text style={{ color: themeVars.ICON_MUTED }}>No downloads yet. Open a surah and tap Download.</Text></View>
                    ) : (
                      <FlatList
                        data={Object.entries(downloadIndex || {})}
                        keyExtractor={([k]) => k}
                        renderItem={({ item: [surahNum, entry] }) => (
                          <View style={styles.card}>
                            <View style={styles.cardBody}>
                              <Text style={{ fontWeight: '900', color: themeVars.TEXT_PRIMARY }}>Surah {surahNum}</Text>
                              <Text style={{ color: themeVars.ICON_MUTED, marginTop: 6 }}>{entry.json ? 'JSON available' : 'JSON missing'}</Text>
                              <Text style={{ color: themeVars.ICON_MUTED, marginTop: 4 }}>{entry.audio ? `${Object.keys(entry.audio).length} ayahs` : 'No audio'}</Text>
                            </View>
                            <View style={styles.rowActions}>
                              <TouchableOpacity onPress={() => { setScreen('reader'); openSurah(Number(surahNum)); }} style={styles.smallGhost}><Text style={styles.smallGhostText}>Open</Text></TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteDownloadedSurah(Number(surahNum))} style={[styles.smallGhost, { marginTop: 8 }]}><Text style={[styles.smallGhostText, { color: themeVars.ERROR_COLOR }]}>Delete</Text></TouchableOpacity>
                            </View>
                          </View>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        contentContainerStyle={{ paddingBottom: 0 }}
                      />
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          <Modal visible={showReciterModal} animationType="slide" onRequestClose={() => setShowReciterModal(false)}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowReciterModal(false)}><Ionicons name="close" size={22} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.modalTitle}>Reciters</Text></View>
                <View style={{ width: 36 }} />
              </View>

              <FlatList
                data={getRecitersList()}
                keyExtractor={(r) => r.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.reciterRow} onPress={async () => { await saveQuranSettings({ reciter: item.id }); setShowReciterModal(false); if (openSurahNumber) openSurah(openSurahNumber); }}>
                    <View>
                      <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>{item.name}</Text>
                      <Text style={{ color: themeVars.ICON_MUTED, fontSize: 12 }}>{item.id}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={themeVars.ICON_MUTED} />
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </Modal>

          <Modal visible={showBookmarksModal} animationType="slide" onRequestClose={() => setShowBookmarksModal(false)}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowBookmarksModal(false)}><Ionicons name="close" size={22} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.modalTitle}>Bookmarks</Text></View>
                <View style={{ width: 36 }} />
              </View>

              <FlatList
                data={Object.entries(bookmarks || {})}
                keyExtractor={([k]) => k}
                renderItem={({ item: [surahNum, entry] }) => (
                  <View style={styles.bookmarkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>{`Surah ${surahNum} • Ayah ${entry.ayahIndex}`}</Text>
                      <Text style={{ color: themeVars.ICON_MUTED }}>{entry.note ?? ''}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity onPress={() => { setShowBookmarksModal(false); openSurah(Number(surahNum), entry.ayahIndex); }} style={styles.smallGhost}><Text style={styles.smallGhostText}>Open</Text></TouchableOpacity>
                      <TouchableOpacity onPress={async () => { await removeBookmark(Number(surahNum)); await refreshBookmarks(); }} style={[styles.smallGhost, { marginTop: 8 }]}><Text style={[styles.smallGhostText, { color: themeVars.ERROR_COLOR }]}>Remove</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 0 }}
              />
            </SafeAreaView>
          </Modal>

          <Modal visible={showFavouritesModal} animationType="slide" onRequestClose={() => setShowFavouritesModal(false)}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowFavouritesModal(false)}><Ionicons name="close" size={22} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.modalTitle}>Favourites</Text></View>
                <View style={{ width: 36 }} />
              </View>

              <FlatList
                data={Object.entries(favourites || {}).map(([k, v]) => ({ key: k, ...v }))}
                keyExtractor={(i) => i.key}
                renderItem={({ item }) => (
                  <View style={styles.bookmarkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>{`Surah ${item.surah} • Ayah ${item.ayah}`}</Text>
                      <Text style={{ color: themeVars.ICON_MUTED, marginTop: 6 }}>{item.text_translation ?? ''}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity onPress={() => { setShowFavouritesModal(false); openSurah(item.surah, item.ayah); }} style={styles.smallGhost}><Text style={styles.smallGhostText}>Open</Text></TouchableOpacity>
                      <TouchableOpacity onPress={async () => { await removeFavorite(item.surah, item.ayah); await refreshFavourites(); }} style={[styles.smallGhost, { marginTop: 8 }]}><Text style={[styles.smallGhostText, { color: themeVars.ERROR_COLOR }]}>Remove</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 0 }}
              />
            </SafeAreaView>
          </Modal>

          <Modal visible={showSettingsModal} animationType="slide" onRequestClose={() => setShowSettingsModal(false)}>
            <SafeAreaView style={styles.modalSafe}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}><Ionicons name="close" size={22} color={themeVars.ICON_ACTIVE} /></TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}><Text style={styles.modalTitle}>Reader Settings</Text></View>
                <View style={{ width: 36 }} />
              </View>

              <View style={{ padding: 16 }}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Show English translation</Text>
                    <Text style={{ color: themeVars.ICON_MUTED, marginTop: 4 }}>Toggle whether the English translation is visible beneath each ayah.</Text>
                  </View>
                  <Switch value={showTranslation} onValueChange={(v) => { setShowTranslation(v); saveQuranSettings({ showTranslation: v }).catch(() => {}); }} />
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Show transliteration</Text>
                    <Text style={{ color: themeVars.ICON_MUTED, marginTop: 4 }}>Toggle whether the Latin transliteration is visible beneath Arabic.</Text>
                  </View>
                  <Switch value={showTransliteration} onValueChange={(v) => { setShowTransliteration(v); saveQuranSettings({ showTransliteration: v }).catch(() => {}); }} />
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Enable word definitions</Text>
                    <Text style={{ color: themeVars.ICON_MUTED, marginTop: 4 }}>When enabled, tapping an Arabic word opens a quick definition modal (online lookup).</Text>
                  </View>
                  <Switch value={enableWordDefinitions} onValueChange={(v) => { setEnableWordDefinitions(v); saveQuranSettings({ enableWordDefinitions: v }).catch(() => {}); }} />
                </View>

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: '800', color: themeVars.TEXT_PRIMARY }}>Underline Arabic words</Text>
                    <Text style={{ color: themeVars.ICON_MUTED, marginTop: 4 }}>Show/hide underline for tappable Arabic words.</Text>
                  </View>
                  <Switch value={underlineArabicWords} onValueChange={async (v) => {
                    setUnderlineArabicWords(v);
                    try { await saveQuranSettings({ underlineArabicWords: v }); } catch (e) {}
                  }} />
                </View>

                <View style={{ marginTop: 18 }}>
                  <TouchableOpacity style={[styles.updateButton]} onPress={() => setShowSettingsModal(false)}>
                    <Text style={[styles.updateButtonText]}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        </RN_SafeAreaView>
      </SafeAreaView>

      <FloatingButton screen={screen} styles={styles} />
    </>
  );
}

function FloatingButton({ screen, styles }) {
  const [visible, setVisible] = useState(false);
  if (screen === "reader") return null;
  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => {Alert.alert('Coming soon!', "Journalling feature will be in future updates Insha'Allah!")}}>
        <Text style={styles.fabIcon}><Ionicons name='create-outline' size={28} color="#fff" /></Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Journal />
            <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
