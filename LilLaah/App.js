// Dev: to change how often the widget is re-calculated during development,
// set DEV_WIDGET_FREQ_SECONDS (seconds). To schedule a specific daily UTC time
// set DEV_DAILY_UTC_TIME = 'HH:MM' and enable DEV_USE_DAILY_UTC_SCHEDULE.
// Set ENABLE_DEV_DEBUG true to force enable dev features.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Appearance, Platform, Pressable, Button, ScrollView, Alert } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { palette } from './screens/styles';
import * as FileSystem from 'expo-file-system';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { calculateSalahTimes } from './services/salah_calculate';
import Prayer from './screens/prayer/page';
import Duas from './screens/duas/page';
import Quran from './screens/quran/page';
import Settings from './screens/settings/page';

const Tab = createBottomTabNavigator();

const ENABLE_DEV_DEBUG = false //true for widget debug;
const DEV_TAP_THRESHOLD = 7;
const DEV_TAP_WINDOW_MS = 5000;
const DEV_WIDGET_FREQ_SECONDS = ENABLE_DEV_DEBUG ? 300 : null;
const DEV_USE_DAILY_UTC_SCHEDULE = ENABLE_DEV_DEBUG ? true : false;
const DEV_DAILY_UTC_TIME = '10:35';

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function julianDayFromDate(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + (date.getUTCHours() / 24) + (date.getUTCMinutes() / 1440) + (date.getUTCSeconds() / 86400);
  let A = Math.floor((14 - month) / 12);
  let Y = year + 4800 - A;
  let M = month + 12 * A - 3;
  let JDN = day + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
  let JD = JDN - 0.5 + (date.getUTCHours() / 24) + (date.getUTCMinutes() / 1440) + (date.getUTCSeconds() / 86400);
  return JD;
}

function sunTimesForDate(date, lat, lon) {
  const latRad = toRad(lat);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const midnightUTC = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const jd = julianDayFromDate(midnightUTC);
  const n = jd - 2451545.0;
  const Jstar = 2451545.0 + n - (lon / 360);
  const M = (357.5291 + 0.98560028 * (Jstar - 2451545.0)) % 360;
  const C = 1.9148 * Math.sin(toRad(M)) + 0.0200 * Math.sin(toRad(2 * M)) + 0.0003 * Math.sin(toRad(3 * M));
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lambdaRad = toRad(lambda);
  const obliquity = toRad(23.4397);
  const sinDecl = Math.sin(lambdaRad) * Math.sin(obliquity);
  const decl = Math.asin(sinDecl);
  const h0 = toRad(-0.83);
  const cosH = (Math.sin(h0) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
  if (cosH > 1) return { sunrise: null, sunset: null };
  if (cosH < -1) return { sunrise: null, sunset: null };
  const H = Math.acos(cosH);
  const e = 0.016708634;
  const y = Math.tan(obliquity / 2) * Math.tan(obliquity / 2);
  const L0 = toRad((280.4665 + 36000.7698 * ((jd - 2451545) / 36525)) % 360);
  const Mrad = toRad(M);
  const eqTime = 4 * toDeg(
    y * Math.sin(2 * L0)
    - 2 * e * Math.sin(Mrad)
    + 4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0)
    - 0.5 * y * y * Math.sin(4 * L0)
    - 1.25 * e * e * Math.sin(2 * Mrad)
  );
  const solarNoonMinutes = (720 - 4 * lon - eqTime);
  const sunriseMinutesUTC = solarNoonMinutes - (toDeg(H) * 4);
  const sunsetMinutesUTC = solarNoonMinutes + (toDeg(H) * 4);
  const sunriseUTCms = midnightUTC.getTime() + Math.round(sunriseMinutesUTC * 60 * 1000);
  const sunsetUTCms = midnightUTC.getTime() + Math.round(sunsetMinutesUTC * 60 * 1000);
  const sunriseLocal = new Date(sunriseUTCms);
  const sunsetLocal = new Date(sunsetUTCms);
  return { sunrise: sunriseLocal, sunset: sunsetLocal };
}

async function getDeviceLocation(timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    if (!navigator || !navigator.geolocation) {
      return reject(new Error('Geolocation unavailable'));
    }
    const success = (pos) => {
      const coords = pos.coords || {};
      resolve({ latitude: coords.latitude, longitude: coords.longitude });
    };
    const error = (err) => reject(err);
    try {
      navigator.geolocation.getCurrentPosition(success, error, { maximumAge: 1000 * 60 * 5, timeout: timeoutMs, enableHighAccuracy: true });
    } catch (e) {
      reject(e);
    }
  });
}

const FILE_NAME = 'salah-widget-data.json';
const FILE_PATH = FileSystem.documentDirectory + FILE_NAME;
const TASK_NAME = 'SalahBackgroundTask';

async function writePayloadToFile(payload) {
  const json = JSON.stringify(payload);
  await FileSystem.writeAsStringAsync(FILE_PATH, json, { encoding: FileSystem.EncodingType.UTF8 });
}

TaskManager.defineTask(TASK_NAME, async () => {
  console.log(`[${TASK_NAME}] background task running`);
  try {
    const payload = await calculateSalahTimes();
    await writePayloadToFile(payload);
    console.log(`[${TASK_NAME}] wrote payload to ${FILE_PATH}`);
    return BackgroundFetch.Result.NewData;
  } catch (err) {
    console.error(`[${TASK_NAME}] failed`, err);
    return BackgroundFetch.Result.Failed;
  }
});

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [darkModeMethod, setDarkModeMethod] = useState('dark');
  const [savedJson, setSavedJson] = useState(null);
  const [devVisible, setDevVisible] = useState(false);
  const appearanceListenerRef = useRef(null);
  const timeModeTimerRef = useRef(null);
  const timeModeCheckIntervalRef = useRef(null);
  const devTapCountRef = useRef(0);
  const devTapTimerRef = useRef(null);
  const navigationRef = useRef(null);
  const widgetScheduleTimerRef = useRef(null);
  const widgetDailyIntervalRef = useRef(null);
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: palette(isDark).SAFE_BG,
      card: palette(isDark).CARD_BG,
      text: palette(isDark).PRIMARY,
      border: palette(isDark).BORDER || (isDark ? 'rgba(255,255,255,0.06)' : '#EEF3FB'),
    },
  };

  const applySystemPreference = () => {
    const sys = Appearance.getColorScheme();
    setIsDark(sys === 'dark');
  };

  const scheduleCheckAt = (whenDate) => {
    if (!whenDate || !(whenDate instanceof Date)) return;
    const now = Date.now();
    const ms = whenDate.getTime() - now + 1000;
    if (ms <= 0) {
      runTimeModeCheck();
      return;
    }
    if (timeModeTimerRef.current) {
      clearTimeout(timeModeTimerRef.current);
      timeModeTimerRef.current = null;
    }
    timeModeTimerRef.current = setTimeout(() => { runTimeModeCheck(); }, ms);
  };

  const runTimeModeCheck = async () => {
    try {
      let lat = null, lon = null;
      try {
        const pos = await getDeviceLocation(7000);
        lat = Number(pos.latitude);
        lon = Number(pos.longitude);
      } catch (e) {
        lat = null; lon = null;
      }

      const now = new Date();
      let sunrise, sunset;

      if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
        const times = sunTimesForDate(now, lat, lon);
        sunrise = times.sunrise;
        sunset = times.sunset;
      }

      if (!sunrise || !sunset) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        sunrise = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0, 0);
        sunset = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0);
      }

      const isNowDark = now >= sunset || now < sunrise;
      setIsDark(Boolean(isNowDark));

      let nextEventDate = null;
      if (now < sunrise) nextEventDate = sunrise;
      else if (now >= sunrise && now < sunset) nextEventDate = sunset;
      else {
        if (typeof lat === 'number' && typeof lon === 'number') {
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const timesTomorrow = sunTimesForDate(tomorrow, lat, lon);
          nextEventDate = timesTomorrow.sunrise || new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 6, 0, 0);
        } else {
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          nextEventDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 6, 0, 0);
        }
      }

      scheduleCheckAt(nextEventDate);

    } catch (e) {
      console.warn('runTimeModeCheck error', e);
      const hour = (new Date()).getHours();
      setIsDark(hour < 6 || hour >= 18);
      if (timeModeTimerRef.current) clearTimeout(timeModeTimerRef.current);
      timeModeTimerRef.current = setTimeout(runTimeModeCheck, 5 * 60 * 1000);
    }
  };

  useEffect(() => {
    if (appearanceListenerRef.current) {
      try { appearanceListenerRef.current.remove(); } catch (e) { }
      appearanceListenerRef.current = null;
    }
    if (timeModeTimerRef.current) { clearTimeout(timeModeTimerRef.current); timeModeTimerRef.current = null; }
    if (timeModeCheckIntervalRef.current) { clearInterval(timeModeCheckIntervalRef.current); timeModeCheckIntervalRef.current = null; }

    if (darkModeMethod === 'system') {
      applySystemPreference();
      try {
        const handler = ({ colorScheme }) => setIsDark(colorScheme === 'dark');
        if (Appearance && typeof Appearance.addChangeListener === 'function') appearanceListenerRef.current = Appearance.addChangeListener(handler);
        else if (Appearance && typeof Appearance.addListener === 'function') appearanceListenerRef.current = Appearance.addListener('change', handler);
      } catch (e) {
        applySystemPreference();
      }
    } else if (darkModeMethod === 'light') setIsDark(false);
    else if (darkModeMethod === 'dark') setIsDark(true);
    else if (darkModeMethod === 'time') {
      runTimeModeCheck();
      timeModeCheckIntervalRef.current = setInterval(() => { runTimeModeCheck(); }, 5 * 60 * 1000);
    }

    return () => {
      if (appearanceListenerRef.current) {
        try { appearanceListenerRef.current.remove(); } catch (e) { }
        appearanceListenerRef.current = null;
      }
      if (timeModeTimerRef.current) { clearTimeout(timeModeTimerRef.current); timeModeTimerRef.current = null; }
      if (timeModeCheckIntervalRef.current) { clearInterval(timeModeCheckIntervalRef.current); timeModeCheckIntervalRef.current = null; }
    };
  }, [darkModeMethod]);

  useEffect(() => {
    return () => {
      if (devTapTimerRef.current) {
        clearTimeout(devTapTimerRef.current);
        devTapTimerRef.current = null;
      }
    };
  }, []);

  const handleDevTap = () => {
    if (!ENABLE_DEV_DEBUG) return;
    devTapCountRef.current += 1;
    if (devTapTimerRef.current) clearTimeout(devTapTimerRef.current);
    devTapTimerRef.current = setTimeout(() => {
      devTapCountRef.current = 0;
      devTapTimerRef.current = null;
    }, DEV_TAP_WINDOW_MS);
    if (devTapCountRef.current >= DEV_TAP_THRESHOLD) {
      devTapCountRef.current = 0;
      if (devTapTimerRef.current) {
        clearTimeout(devTapTimerRef.current);
        devTapTimerRef.current = null;
      }
      setDevVisible(true);
    }
  };

  const handleDevLongPress = () => {
    if (!ENABLE_DEV_DEBUG) return;
    setDevVisible(true);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tasks = await TaskManager.getRegisteredTasksAsync();
        const already = tasks.some((t) => t.taskName === TASK_NAME);
        if (!already) {
          await BackgroundFetch.registerTaskAsync(TASK_NAME, {
            minimumInterval: DEV_WIDGET_FREQ_SECONDS ?? 24 * 60 * 60,
            stopOnTerminate: false,
            startOnBoot: true
          });
          console.log('[App] background task registered');
        } else {
          console.log('[App] background task already registered');
        }
      } catch (e) {
        console.warn('[App] background registration failed', e);
      }

      try {
        const info = await FileSystem.getInfoAsync(FILE_PATH);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(FILE_PATH);
          if (mounted) setSavedJson(content);
        } else {
          if (mounted) setSavedJson(null);
        }
      } catch (e) {
        console.warn('[App] read initial file error', e);
      }

      try {
        const payload = await calculateSalahTimes();
        await writePayloadToFile(payload);
        if (mounted) setSavedJson(JSON.stringify(payload, null, 2));
      } catch (e) {
        console.warn('[App] initial widget calc failed', e);
      }

      if (DEV_USE_DAILY_UTC_SCHEDULE) {
        const parts = DEV_DAILY_UTC_TIME.split(':');
        if (parts.length >= 2) {
          const hh = parseInt(parts[0], 10);
          const mm = parseInt(parts[1], 10);
          if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
            const now = new Date();
            let nextUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mm, 0);
            if (nextUtcMs <= Date.now()) nextUtcMs += 24 * 60 * 60 * 1000;
            if (widgetScheduleTimerRef.current) {
              clearTimeout(widgetScheduleTimerRef.current);
              widgetScheduleTimerRef.current = null;
            }
            widgetScheduleTimerRef.current = setTimeout(async () => {
              try {
                const p = await calculateSalahTimes();
                await writePayloadToFile(p);
                if (mounted) setSavedJson(JSON.stringify(p, null, 2));
              } catch (e) {
                console.warn('[App] scheduled UTC widget calc failed', e);
              }
              widgetDailyIntervalRef.current = setInterval(async () => {
                try {
                  const p2 = await calculateSalahTimes();
                  await writePayloadToFile(p2);
                  if (mounted) setSavedJson(JSON.stringify(p2, null, 2));
                } catch (e2) {}
              }, 24 * 60 * 60 * 1000);
            }, nextUtcMs - Date.now() + 50);
          }
        }
      }

      if (ENABLE_DEV_DEBUG && DEV_WIDGET_FREQ_SECONDS && !DEV_USE_DAILY_UTC_SCHEDULE) {
        if (widgetScheduleTimerRef.current) {
          clearTimeout(widgetScheduleTimerRef.current);
          widgetScheduleTimerRef.current = null;
        }
        widgetScheduleTimerRef.current = setTimeout(async () => {
          try {
            const p = await calculateSalahTimes();
            await writePayloadToFile(p);
            if (mounted) setSavedJson(JSON.stringify(p, null, 2));
          } catch (e) {
            console.warn('[App] dev interval widget calc failed', e);
          }
          widgetDailyIntervalRef.current = setInterval(async () => {
            try {
              const p2 = await calculateSalahTimes();
              await writePayloadToFile(p2);
              if (mounted) setSavedJson(JSON.stringify(p2, null, 2));
            } catch (e2) {}
          }, DEV_WIDGET_FREQ_SECONDS * 1000);
        }, DEV_WIDGET_FREQ_SECONDS * 1000);
      }

    })();

    return () => {
      mounted = false;
      if (widgetScheduleTimerRef.current) {
        clearTimeout(widgetScheduleTimerRef.current);
        widgetScheduleTimerRef.current = null;
      }
      if (widgetDailyIntervalRef.current) {
        clearInterval(widgetDailyIntervalRef.current);
        widgetDailyIntervalRef.current = null;
      }
    };
  }, []);

  const triggerNow = async () => {
    try {
      const payload = await calculateSalahTimes();
      await writePayloadToFile(payload);
      setSavedJson(JSON.stringify(payload, null, 2));
      Alert.alert('Saved', 'salah-widget-data.json written');
    } catch (e) {
      console.error('Trigger now failed', e);
      Alert.alert('Error', 'Could not calculate or save payload');
    }
  };

  const showSavedFile = async () => {
    try {
      const info = await FileSystem.getInfoAsync(FILE_PATH);
      if (!info.exists) {
        Alert.alert('No file', 'salah-widget-data.json does not exist yet');
        setSavedJson(null);
        return;
      }
      const content = await FileSystem.readAsStringAsync(FILE_PATH);
      setSavedJson(content);
    } catch (e) {
      console.error('Read file failed', e);
      Alert.alert('Error', 'Could not read file');
    }
  };

  const deleteSavedFile = async () => {
    try {
      await FileSystem.deleteAsync(FILE_PATH, { idempotent: true });
      setSavedJson(null);
      Alert.alert('Deleted', 'salah-widget-data.json removed');
    } catch (e) {
      console.warn('Delete failed', e);
      Alert.alert('Error', 'Could not delete file');
    }
  };

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette(isDark).SAFE_BG} />

      {ENABLE_DEV_DEBUG && (
        <Pressable style={styles.devHotspot} onPress={handleDevTap} onLongPress={handleDevLongPress} delayLongPress={900} />
      )}

      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let baseName;
              switch (route.name) {
                case 'Prayer': baseName = 'time'; break;
                case 'Quran': baseName = 'book'; break;
                case 'Media': baseName = 'play-circle'; break;
                case 'Duas': baseName = 'heart'; break;
                case 'Settings': baseName = 'settings'; break;
                default: baseName = 'ellipse';
              }
              const iconName = focused ? baseName : `${baseName}-outline`;
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: palette(isDark).HERO_BG,
            tabBarInactiveTintColor: isDark ? palette(isDark).MUTED : 'gray',
            tabBarStyle: { backgroundColor: palette(isDark).TAB_BAR },
          })}
        >
          <Tab.Screen name="Prayer">{() => <Prayer systemIsDark={isDark} />}</Tab.Screen>
          <Tab.Screen name="Quran">{() => <Quran systemIsDark={isDark} />}</Tab.Screen>
          <Tab.Screen name="Duas">{() => <Duas systemIsDark={isDark} />}</Tab.Screen>
          <Tab.Screen name="Settings">
            {() => <Settings systemIsDark={isDark} darkModeMethod={darkModeMethod} setDarkModeMethod={(m) => setDarkModeMethod(m)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {ENABLE_DEV_DEBUG && devVisible && (
        <View style={[styles.devOverlay, { backgroundColor: palette(isDark).CARD_BG }]}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>widget debug</Text>
            <View style={{ width: '60%', marginBottom: 12 }}>
              <Button title="Close" onPress={() => setDevVisible(false)} />
            </View>
            <Button title="Trigger calculateSalahTimes() now (write file)" onPress={triggerNow} />
            <View style={{ height: 12 }} />
            <Button title="Show saved salah-widget-data.json" onPress={showSavedFile} />
            <View style={{ height: 12 }} />
            <Button title="Delete saved file" color="red" onPress={deleteSavedFile} />
            <View style={{ height: 18 }} />
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Saved file contents:</Text>
            <View style={{ borderWidth: 1, borderRadius: 6, padding: 8, backgroundColor: '#fff' }}>
              <Text selectable>{savedJson || "No file yet. Press 'Trigger' to create one."}</Text>
            </View>
            <View style={{ height: 18 }} />
            <Text style={{ fontSize: 12, color: '#666' }}>NOTE: Background fetch timing is OS-controlled. Use "Trigger now" during development.</Text>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  devHotspot: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 4,
    left: 8,
    width: 44,
    height: 44,
    zIndex: 9999,
  },
  devOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  devTitle: { fontSize: 22, marginBottom: 12 },
  devNote: { marginBottom: 20, textAlign: 'center' },
});
