import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Share,
  Platform,
  SafeAreaView,
  TextInput,
  StatusBar,
  Keyboard,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';

import { calculateSalahTimes } from '../../services/salah_calculate';
import { getStyles } from '../styles';

const HERO_BG = '#2E8B57';
const MUTED = '#6B7A99';

const KAABA_COORDS = { lat: 21.422487, lon: 39.826206 };

const DEFAULT_ROWS_ORDER = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'dhuhr', label: 'Zuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'qiyam', label: 'Qiyam (last third)' },
];

function formatRemaining(ms) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const s = total % 60;
  const m = Math.floor((total / 60) % 60);
  const h = Math.floor(total / 3600);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatHijri(date) {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const f = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return f.format(date);
    }
  } catch (e) {
  }
  return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function bearingTo(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function angleDifference(a, b) {
  let diff = (a - b + 540) % 360 - 180;
  return diff;
}

export default function Prayer({ systemIsDark }) {
  const styles = getStyles('prayer', systemIsDark);
  const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [manualDateText, setManualDateText] = useState('');
  const [dateError, setDateError] = useState('');

  const [qiblaModalVisible, setQiblaModalVisible] = useState(false);

  const [headingDegrees, setHeadingDegrees] = useState(0);
  const [headingSource, setHeadingSource] = useState('none'); // location/tilt-comp/magnetometer/none
  const [headingAccuracy, setHeadingAccuracy] = useState(null);
  const magSubRef = useRef(null);
  const accSubRef = useRef(null);
  const locHeadingSubRef = useRef(null);
  const [magAvailable, setMagAvailable] = useState(true);
  const magRef = useRef({ x: 0, y: 0, z: 0 });
  const accRef = useRef({ x: 0, y: 0, z: 0 });
  const lastRawHeadingRef = useRef(0);

  const animatedHeading = useRef(new Animated.Value(0)).current;
  const cumulativeHeadingRef = useRef(0);

  const alignPulse = useRef(new Animated.Value(0)).current;

  const midnightTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const pulse = useRef(new Animated.Value(1)).current;

  const doUpdate = useCallback(
    async (opts = {}) => {
      setRefreshing(true);
      try {
        const dateToSend = opts.date ?? selectedDate;
        const payload = await calculateSalahTimes(
          (payload) => setData(payload),
          { date: dateToSend, method: opts.method, madhab: opts.madhab, adjustments: opts.adjustments }
        );
        setLastUpdate(new Date());
        scheduleMidnightUpdate();
        return payload;
      } catch (e) {
        setLastUpdate(new Date());
        return null;
      } finally {
        setRefreshing(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    doUpdate({ date: selectedDate });

    return () => {
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      unsubscribeAllHeadingSources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const msUntilNextMidnight = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime() - now.getTime() + 1000;
  };

  const scheduleMidnightUpdate = () => {
    if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    const ms = msUntilNextMidnight();
    midnightTimerRef.current = setTimeout(() => {
      doUpdate();
    }, ms);
  };

  const isFriday = useMemo(() => selectedDate.getDay() === 5, [selectedDate]);

  const rowsOrder = useMemo(() => {
    const base = [...DEFAULT_ROWS_ORDER];
    if (isFriday) {
      const idx = base.findIndex((r) => r.key === 'dhuhr' || r.key === 'dhuhr');
      const insertAt = idx >= 0 ? idx + 1 : 2;
      base.splice(insertAt, 0, { key: 'jummah', label: 'Jummah' });
    }
    const desiredOrderKeys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight', 'qiyam'];
    const result = desiredOrderKeys.map((k) => {
      if (k === 'dhuhr' && isFriday) return { key: 'dhuhr', label: 'Zuhr' };
      return base.find((b) => b.key === k) || { key: k, label: k };
    });
    if (isFriday) {
      const idx = result.findIndex((r) => r.key === 'dhuhr');
      result.splice(idx + 1, 0, { key: 'jummah', label: 'Jummah' });
    }
    return result;
  }, [isFriday]);

  const activeMethod = data?.methodRequested;
  const activeTimes = data?.results?.[activeMethod]?.times ?? data?.times ?? {};
  const rawTimes = data?.results?.[activeMethod]?.raw ?? data?.raw ?? {};

  const derivedRows = useMemo(() => (
    rowsOrder.map((r) => {
      const rawDate = rawTimes?.[r.key] ?? null;
      const displayTime = activeTimes?.[r.key] ?? '—';
      return { key: r.key, label: r.label, rawDate, displayTime };
    })
  ), [rowsOrder, rawTimes, activeTimes]);

  const nextPrayerKey = useMemo(() => {
    const now = Date.now();
    for (const row of derivedRows) {
      if (row.rawDate && row.rawDate.getTime() > now) return row.key;
    }
    let earliest = null;
    for (const row of derivedRows) {
      if (!row.rawDate) continue;
      if (!earliest || row.rawDate.getTime() < earliest.rawDate.getTime()) earliest = row;
    }
    return earliest?.key ?? null;
  }, [derivedRows]);

  const prevPrayerDate = useMemo(() => {
    const now = Date.now();
    let prev = null;
    for (const row of derivedRows) {
      if (row.rawDate && row.rawDate.getTime() < now) {
        if (!prev || row.rawDate.getTime() > prev.getTime()) prev = row.rawDate;
      }
    }
    return prev;
  }, [derivedRows]);

  const nextPrayerDate = useMemo(() => {
    const nextRow = derivedRows.find((r) => r.key === nextPrayerKey);
    return nextRow?.rawDate ?? null;
  }, [derivedRows, nextPrayerKey]);

  const [remainingMs, setRemainingMs] = useState(
    nextPrayerDate ? Math.max(0, nextPrayerDate.getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (nextPrayerDate) {
      setRemainingMs(Math.max(0, nextPrayerDate.getTime() - Date.now()));

      countdownIntervalRef.current = setInterval(() => {
        setRemainingMs(Math.max(0, nextPrayerDate.getTime() - Date.now()));
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      setRemainingMs(0);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      pulse.setValue(1);
    };
  }, [nextPrayerDate, pulse]);

  const progressPercent = useMemo(() => {
    if (!prevPrayerDate || !nextPrayerDate) return 0;
    const total = nextPrayerDate.getTime() - prevPrayerDate.getTime();
    if (total <= 0) return 0;
    const done = Date.now() - prevPrayerDate.getTime();
    return Math.max(0, Math.min(1, done / total));
  }, [prevPrayerDate, nextPrayerDate, remainingMs]);

  const onShare = async () => {
    try {
      const lines = derivedRows.map((r) => `${r.label.padEnd(12)} ${r.displayTime}`);
      const title = `Prayer times (${selectedDate.toLocaleDateString()})`;
      const text = [title, '', ...lines].join('\n');
      await Share.share({ title, message: text });
    } catch (e) {
    }
  };

  const renderRow = (row) => {
    const isNext = row.key === nextPrayerKey;
    const isJummah = row.key === 'jummah';
    return (
      <Animated.View
        key={row.key}
        style={[
          styles.row,
          isNext && styles.rowActive,
          isJummah && styles.jummahRow,
          isNext && { transform: [{ scale: pulse.current ? pulse : pulse }] },
        ]}
      >
        <View style={styles.left}>
          <Text style={[styles.prayerLabel, isNext && styles.prayerLabelActive]}>{row.label}</Text>
        </View>
        <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>{row.displayTime}</Text>
      </Animated.View>
    );
  };

  const headerSubtitle = data?.methodRequested ? `${data.methodRequested} • ${data?.madhab ?? ''}` : '';
  const gregorianStr = selectedDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const hijriStr = formatHijri(selectedDate);

  const locationSource = data?.location?.source;
  const showLocationHint = locationSource && locationSource.toString().includes('fallback');

  const applyOffset = (n) => {
    const newDate = addDays(new Date(), n);
    setSelectedDate(newDate);
    setManualDateText('');
    Keyboard.dismiss();
    doUpdate({ date: newDate });
  };

  const applyManualDate = () => {
    setDateError('');
    const txt = manualDateText.trim();
    if (!txt) {
      setDateError('Enter date as YYYY-MM-DD');
      return;
    }
    const parts = txt.split('-');
    if (parts.length !== 3) {
      setDateError('Invalid format');
      return;
    }
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!y || !m || !d) {
      setDateError('Invalid numbers');
      return;
    }
    const candidate = new Date(y, m - 1, d);
    if (isNaN(candidate.getTime())) {
      setDateError('Invalid date');
      return;
    }
    setSelectedDate(candidate);
    setManualDateText('');
    Keyboard.dismiss();
    doUpdate({ date: candidate });
  };

  const userLat = data?.location?.lat ?? 51.5074;
  const userLon = data?.location?.lon ?? -0.1278;

  const qiblaBearing = useMemo(() => {
    if (userLat == null || userLon == null) return null;
    return bearingTo(userLat, userLon, KAABA_COORDS.lat, KAABA_COORDS.lon);
  }, [userLat, userLon]);

  const qiblaDistance = useMemo(() => {
    if (userLat == null || userLon == null) return null;
    const metres = haversineDistance(userLat, userLon, KAABA_COORDS.lat, KAABA_COORDS.lon);
    if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
    return `${Math.round(metres)} m`;
  }, [userLat, userLon]);

  const unsubscribeAllHeadingSources = () => {
    if (magSubRef.current) {
      try { magSubRef.current.remove(); } catch (e) { /* ignore */ }
      magSubRef.current = null;
    }
    if (accSubRef.current) {
      try { accSubRef.current.remove(); } catch (e) { /* ignore */ }
      accSubRef.current = null;
    }
    if (locHeadingSubRef.current) {
      try { locHeadingSubRef.current.remove(); } catch (e) { /* ignore */ }
      locHeadingSubRef.current = null;
    }
  };

  const setHeadingSmoothed = (rawDeg, source, accuracy = null) => {
    if (rawDeg == null || isNaN(rawDeg)) return;
    const norm = ((rawDeg % 360) + 360) % 360;
    const last = lastRawHeadingRef.current ?? norm;
    const diff = angleDifference(norm, last);
    const alpha = 0.15;
    const newRawEstimate = (last + diff * (1 - alpha) + 360) % 360;
    lastRawHeadingRef.current = newRawEstimate;

    setHeadingDegrees(newRawEstimate);
    setHeadingSource(source);
    setHeadingAccuracy(accuracy ?? null);

    const signedDelta = diff;
    cumulativeHeadingRef.current += signedDelta;

    Animated.spring(animatedHeading, {
      toValue: cumulativeHeadingRef.current,
      useNativeDriver: true,
      friction: 20,
      tension: 120,
    }).start();
  };

  const tryStartLocationHeading = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return false;
      if (!Location.watchHeadingAsync) return false;
      locHeadingSubRef.current = await Location.watchHeadingAsync((headingObj) => {
        const deg = headingObj.trueHeading ?? headingObj.magHeading ?? headingObj.heading ?? null;
        if (deg == null || isNaN(deg)) return;
        const acc = headingObj.accuracy ?? headingObj.headingAccuracy ?? null;
        setHeadingSmoothed((deg + 360) % 360, 'location', acc);
        setMagAvailable(true);
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  const computeTiltCompensatedHeading = (mag, acc) => {
    const ax = acc.x ?? 0;
    const ay = acc.y ?? 0;
    const az = acc.z ?? 0;
    const mx = mag.x ?? 0;
    const my = mag.y ?? 0;
    const mz = mag.z ?? 0;

    const accNorm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (accNorm === 0) return NaN;

    const roll = Math.atan2(ay, az);
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));

    const cosRoll = Math.cos(roll);
    const sinRoll = Math.sin(roll);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    const Xh = mx * cosPitch + mz * sinPitch;
    const Yh = mx * sinRoll * sinPitch + my * cosRoll - mz * sinRoll * cosPitch;

    let heading = Math.atan2(Yh, Xh) * (180 / Math.PI);
    if (isNaN(heading)) return NaN;
    if (heading < 0) heading += 360;
    return heading;
  };

  const subscribeSensorsTiltCompensated = async () => {
    try {
      const magAvail = await Magnetometer.isAvailableAsync().catch(() => false);
      if (!magAvail) {
        setMagAvailable(false);
        return;
      }
      Magnetometer.setUpdateInterval(150);
      Accelerometer.setUpdateInterval(150);

      magSubRef.current = Magnetometer.addListener((m) => {
        magRef.current = m;
        const h = computeTiltCompensatedHeading(magRef.current, accRef.current);
        if (!isNaN(h)) setHeadingSmoothed(h, 'tilt-comp');
      });

      accSubRef.current = Accelerometer.addListener((a) => {
        accRef.current = a;
        const h = computeTiltCompensatedHeading(magRef.current, accRef.current);
        if (!isNaN(h)) setHeadingSmoothed(h, 'tilt-comp');
      });

      setMagAvailable(true);
    } catch (e) {
      setMagAvailable(false);
    }
  };

  const subscribeRawMagnetometerOnly = async () => {
    try {
      const magAvail = await Magnetometer.isAvailableAsync().catch(() => false);
      if (!magAvail) {
        setMagAvailable(false);
        return;
      }
      Magnetometer.setUpdateInterval(200);
      magSubRef.current = Magnetometer.addListener((m) => {
        const { x = 0, y = 0 } = m;
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        setHeadingSmoothed(angle, 'magnetometer');
      });
      setMagAvailable(true);
    } catch (e) {
      setMagAvailable(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (qiblaModalVisible) {
      (async () => {
        lastRawHeadingRef.current = lastRawHeadingRef.current ?? 0;
        cumulativeHeadingRef.current = cumulativeHeadingRef.current ?? 0;

        unsubscribeAllHeadingSources();

        const ok = await tryStartLocationHeading();
        if (ok && !cancelled) return;

        await subscribeSensorsTiltCompensated();

        if (!magAvailable) await subscribeRawMagnetometerOnly();
      })();

      Animated.loop(
        Animated.sequence([
          Animated.timing(alignPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(alignPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      unsubscribeAllHeadingSources();
      setHeadingSource('none');
      setHeadingAccuracy(null);
      Animated.timing(animatedHeading, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qiblaModalVisible]);

  function isAligned() {
    if (qiblaBearing == null || headingDegrees == null) return false;
    const delta = Math.abs(angleDifference(headingDegrees, qiblaBearing));
    return delta <= 5;
  }

  useEffect(() => {
    if (!qiblaModalVisible) return;
    if (Math.abs(angleDifference(headingDegrees ?? 0, qiblaBearing ?? 0)) <= 5) {
      Animated.sequence([
        Animated.timing(alignPulse, { toValue: 1.2, duration: 220, useNativeDriver: true }),
        Animated.timing(alignPulse, { toValue: 1.0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAligned(), qiblaBearing, headingDegrees]);

  const openMaps = async () => {
    const lat = KAABA_COORDS.lat;
    const lon = KAABA_COORDS.lon;
    const label = encodeURIComponent('Kaaba, Masjid al-Haram');
    try {
      if (Platform.OS === 'ios') {
        const url = `maps://maps.apple.com/?daddr=${lat},${lon}&q=${label}`;
        await Linking.openURL(url);
      } else {
        const geoUrl = `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
        const canOpenGeo = await Linking.canOpenURL(geoUrl);
        if (canOpenGeo) {
          await Linking.openURL(geoUrl);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
          await Linking.openURL(webUrl);
        }
      }
    } catch (e) {
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      Linking.openURL(webUrl);
    } finally {
      unsubscribeAllHeadingSources();
    }
  };

  const ringRotate = animatedHeading.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: safeTop }]}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => doUpdate({ date: selectedDate })} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Prayer Times</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.gregorian}>{gregorianStr}</Text>
              <Text style={styles.hijri}>{hijriStr ? ` • ${hijriStr}` : ''}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.iconButton, { marginRight: 8 }]} onPress={() => setQiblaModalVisible(true)}>
              <Ionicons name="compass" size={18} color="#37885a" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconButton, { marginLeft: 4 }]} onPress={onShare}>
              <Text style={styles.iconButtonText}>
                <Ionicons name="share" size={16} color="#37885a" />
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dateSelector}>
          <View style={styles.quickRow}>
            {[-3, -2, -1, 0, 1, 2, 3].map((n) => (
              <TouchableOpacity key={n} style={[styles.quickButton, n === 0 && styles.quickButtonToday]} onPress={() => applyOffset(n)}>
                <Text style={[styles.quickText, n === 0 && styles.quickTextToday]}>{n === 0 ? 'Today' : `${n > 0 ? '+' : ''}${n}`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={systemIsDark ? '#BBBBBB' : '#555555'}
              value={manualDateText}
              onChangeText={(t) => setManualDateText(t)}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={applyManualDate}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCard}>
            {nextPrayerKey ? (
              <>
                <Text style={styles.heroSmall}>Next prayer</Text>
                <View style={styles.heroRow}>
                  <Text style={styles.heroLabel}>{derivedRows.find((r) => r.key === nextPrayerKey)?.label ?? ''}</Text>
                  <Text style={styles.heroTime}>{activeTimes?.[nextPrayerKey] ?? '—'}</Text>
                </View>

                <View style={styles.countdownRow}>
                  <Text style={styles.countdownText}>{formatRemaining(remainingMs)}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.round(progressPercent * 100)}%` }]} />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.loadingHero}>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.loadingText, { color: '#fff' }]}>No prayer data</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          {data ? (
            <>
              {derivedRows.map(renderRow)}
              <View style={styles.divider} />
              <View style={styles.footerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallMuted}>
                    {data?.location?.label ?? 'Location: device / fallback'}
                    {data?.location?.accuracy ? ` • ±${Math.round(data.location.accuracy)}m` : ''}
                  </Text>
                  {showLocationHint && <Text style={styles.permissionHint}>Location not granted — using fallback.</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.smallMuted}>
                    {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </Text>
                  <Text style={styles.smallMuted}>{selectedDate.toLocaleDateString()}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>Loading prayer times…</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.updateButton} onPress={() => doUpdate({ date: selectedDate })}>
            {refreshing ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Update Now</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.meta}>{lastUpdate ? `Last updated: ${lastUpdate.toLocaleString()}` : 'Not updated yet'}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={qiblaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { unsubscribeAllHeadingSources(); setQiblaModalVisible(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Qibla Direction</Text>
              <TouchableOpacity onPress={() => { unsubscribeAllHeadingSources(); setQiblaModalVisible(false); }} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSub}>Bearing</Text>
              <Text style={styles.modalBearing}>{qiblaBearing != null ? `${Math.round(qiblaBearing)}° from north` : '—'}</Text>
              <Text style={styles.smallMuted}>Distance: {qiblaDistance ?? '—'}</Text>

              <View style={styles.modalCompassWrap}>
                <View style={styles.modalCompassOuter}>
                  <Animated.View style={[styles.compassRing, { transform: [{ rotate: Animated.multiply(animatedHeading, -1).interpolate({ inputRange: [-360, 0, 360], outputRange: ['-360deg', '0deg', '360deg'] }) }] }]}>
                    <View style={[styles.tick, styles.tickN]}><Text style={styles.tickLabel}>N</Text></View>
                    <View style={[styles.tick, styles.tickE]}><Text style={styles.tickLabel}>E</Text></View>
                    <View style={[styles.tick, styles.tickS]}><Text style={styles.tickLabel}>S</Text></View>
                    <View style={[styles.tick, styles.tickW]}><Text style={styles.tickLabel}>W</Text></View>

                    {qiblaBearing != null && (
                      <View style={[styles.rimMarkerContainer, { transform: [{ rotate: `${qiblaBearing}deg` }, { translateY: -94 }] }]} pointerEvents="none">
                        <View style={[styles.rimMarkerInner, styles.kaabaMarker]}>
                          <View style={styles.kaabaIcon} />
                        </View>
                      </View>
                    )}

                    <View style={styles.compassCenterBg} />
                  </Animated.View>

                  <View style={styles.fixedArrow}>
                    <Ionicons name="arrow-up" size={48} color={HERO_BG} />
                    <View style={styles.modalArrowStem} />
                  </View>

                  <Animated.View style={[styles.alignWrap, isAligned() ? styles.alignOn : styles.alignOff, isAligned() && { transform: [{ scale: alignPulse }] }]}>
                    <View style={styles.alignDot}>
                      <Ionicons name={isAligned() ? 'checkmark' : 'ellipse'} size={14} color={isAligned() ? '#fff' : MUTED} />
                    </View>
                  </Animated.View>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {headingSource === 'location' ? (
                  <Text style={styles.modalHint}>Using device heading (platform-provided true heading).</Text>
                ) : headingSource === 'tilt-comp' ? (
                  <Text style={styles.modalHint}>Using tilt-compensated sensors (magnetometer + accelerometer).</Text>
                ) : headingSource === 'magnetometer' ? (
                  <Text style={styles.modalHint}>Using raw magnetometer (flat assumption).</Text>
                ) : (
                  <Text style={styles.modalHint}>
                    Device compass not available. Face {qiblaBearing ? `${Math.round(qiblaBearing)}° from north` : 'the Qibla'}.
                  </Text>
                )}

                {headingAccuracy != null && (
                  <Text style={[styles.smallMuted, { marginTop: 6 }]}>Heading accuracy: {Number(headingAccuracy).toFixed(1)}°</Text>
                )}

                <Text style={[styles.smallMuted, { marginTop: 6 }]}>Heading: {Math.round(headingDegrees)}°</Text>

                {!magAvailable && <Text style={[styles.permissionHint, { marginTop: 6 }]}>Magnetometer not available or not permitted on this device. Try another device or use the map button.</Text>}

                <Text style={[styles.smallMuted, { marginTop: 4 }]}>{isAligned() ? 'Device is facing the Qibla' : 'Rotate device until the Kaaba marker aligns with the arrow'}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => { unsubscribeAllHeadingSources(); openMaps(); }}>
                  <Ionicons name="map" size={16} color="#fff" />
                  <Text style={styles.modalBtnText}> Open in Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalBtn, styles.modalCloseBtn]} onPress={() => { unsubscribeAllHeadingSources(); setQiblaModalVisible(false); }}>
                  <Text style={styles.modalBtnText}> Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
