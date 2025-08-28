import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
} from 'adhan';

const STORAGE_KEY = 'salah_settings_v1';

const DEFAULT_SETTINGS = {
  method: 'Moonsighting',
  madhab: 'hanafi',
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

export async function getSalahSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      method: parsed.method ?? DEFAULT_SETTINGS.method,
      madhab: parsed.madhab ?? DEFAULT_SETTINGS.madhab,
      adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(parsed.adjustments || {}) },
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSalahSettings(settings = {}) {
  const toSave = {
    method: settings.method ?? DEFAULT_SETTINGS.method,
    madhab: settings.madhab ?? DEFAULT_SETTINGS.madhab,
    adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(settings.adjustments || {}) },
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  return toSave;
}

export async function calculateSalahTimes(setDataFunc = null, options = {}) {
  const defaultLocation = { lat: 51.5074, lon: -0.1278, label: 'London (fallback)' };

  const stored = await getSalahSettings();
  const method = options.method ?? stored.method ?? DEFAULT_SETTINGS.method;
  const madhab = options.madhab ?? stored.madhab ?? DEFAULT_SETTINGS.madhab;
  const adjustments = options.adjustments ?? stored.adjustments ?? DEFAULT_SETTINGS.adjustments;
  const tryAllMethods = options.tryAllMethods ?? false;

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { ...defaultLocation, source: 'fallback_no_permission' };
      }
      const loc = await Location.getCurrentPositionAsync({ maximumAge: 1000 * 60 * 5 });
      return {
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        label: 'Device location',
        source: 'device',
      };
    } catch (e) {
      return { ...defaultLocation, source: 'fallback_error' };
    }
  };

  const buildMethods = () => {
    const out = {};
    try { out.MWL = CalculationMethod.MuslimWorldLeague(); } catch {}
    try { out.ISNA = CalculationMethod.ISNA(); } catch {}
    try { out.Egypt = CalculationMethod.Egypt(); } catch {}
    try { out.Karachi = CalculationMethod.Karachi(); } catch {}
    try { out.UmmAlQura = CalculationMethod.UmmAlQura(); } catch {}
    try { out.Tehran = CalculationMethod.Tehran(); } catch {}
    try { out.Moonsighting = CalculationMethod.MoonsightingCommittee(); } catch {}
    try { out.Makkah = CalculationMethod.Makkah(); } catch {}
    return out;
  };

  const methods = buildMethods();

  const fmt = (d) =>
    d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const applyAdjust = (date, minutes) => {
    if (!date) return date;
    if (!minutes) return date;
    return new Date(date.getTime() + minutes * 60000);
  };

  try {
    const location = await getLocation();
    const coords = new Coordinates(location.lat, location.lon);
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const calcWithParams = (params) => {
      params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

      const prayerTimesToday = new PrayerTimes(coords, date, params);

      const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      let prayerTimesTomorrow;
      try {
        prayerTimesTomorrow = new PrayerTimes(coords, tomorrow, params);
      } catch (e) {
        prayerTimesTomorrow = null;
      }

      const raw = {
        fajr: prayerTimesToday.fajr,
        sunrise: prayerTimesToday.sunrise,
        dhuhr: prayerTimesToday.dhuhr,
        asr: prayerTimesToday.asr,
        maghrib: prayerTimesToday.maghrib,
        isha: prayerTimesToday.isha,
        nextSunrise: prayerTimesTomorrow?.sunrise ?? null,
      };

      let midnight = null;
      if (raw.maghrib && raw.nextSunrise) {
        const nightLen = raw.nextSunrise.getTime() - raw.maghrib.getTime();
        midnight = new Date(raw.maghrib.getTime() + Math.floor(nightLen / 2));
      }

      let qiyam = null;
      if (raw.maghrib && raw.nextSunrise) {
        const nightLen = raw.nextSunrise.getTime() - raw.maghrib.getTime();
        qiyam = new Date(raw.maghrib.getTime() + Math.floor((2 * nightLen) / 3));
      }

      const adjusted = {
        fajr: applyAdjust(raw.fajr, adjustments.fajr ?? 0),
        sunrise: applyAdjust(raw.sunrise, adjustments.sunrise ?? 0),
        dhuhr: applyAdjust(raw.dhuhr, adjustments.dhuhr ?? 0),
        asr: applyAdjust(raw.asr, adjustments.asr ?? 0),
        maghrib: applyAdjust(raw.maghrib, adjustments.maghrib ?? 0),
        isha: applyAdjust(raw.isha, adjustments.isha ?? 0),
        midnight: applyAdjust(midnight, adjustments.midnight ?? 0),
        qiyam: applyAdjust(qiyam, adjustments.qiyam ?? 0),
      };

      adjusted.jummah = adjusted.dhuhr;
      raw.jummah = raw.dhuhr;

      return {
        raw,
        times: {
          fajr: fmt(adjusted.fajr),
          sunrise: fmt(adjusted.sunrise),
          dhuhr: fmt(adjusted.dhuhr),
          asr: fmt(adjusted.asr),
          maghrib: fmt(adjusted.maghrib),
          isha: fmt(adjusted.isha),
          midnight: fmt(adjusted.midnight),
          qiyam: fmt(adjusted.qiyam),
          jummah: fmt(adjusted.jummah),
        },
      };
    };

    let payload = {
      location,
      calculatedAt: now.toISOString(),
      methodRequested: method,
      madhab,
      requestedAdjustments: adjustments,
      results: {},
    };

    if (tryAllMethods) {
      for (const [key, factoryResult] of Object.entries(methods)) {
        try {
          const params = factoryResult;
          const res = calcWithParams(params);
          payload.results[key] = res;
        } catch (e) {
        }
      }
    } else {
      const chosenFactory = methods[method] || methods.Moonsighting || Object.values(methods)[0];
      if (!chosenFactory) {
        throw new Error('No calculation methods available from adhan package.');
      }
      const params = chosenFactory;
      const res = calcWithParams(params);
      payload.results[method] = res;
    }

    if (typeof setDataFunc === 'function') {
      setDataFunc(payload);
    }
    return payload;
  } catch (err) {
    const fallback = {
      error: true,
      message: 'Failed to calculate prayer times',
      details: err?.message ?? String(err),
    };
    if (typeof setDataFunc === 'function') {
      setDataFunc(fallback);
    }
    return fallback;
  }
}
