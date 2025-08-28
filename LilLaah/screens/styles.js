import { StyleSheet } from 'react-native';

const L = {
  SAFE_BG: '#F6F8FB',
  CARD_BG: '#FFFFFF',
  PRIMARY: '#0B2447',
  MUTED: '#6B7A99',
  HERO_BG: '#2E8B57',
  HERO_ACCENT: '#DFF6ED',
  BORDER: '#EEF3FB',
  SOFT: '#F1F5F9',
  ERROR: '#D04444',
  TAB_BAR: '#FFFFFF',
};

const D = {
  SAFE_BG: '#071024',
  CARD_BG: '#0D1A2A',
  PRIMARY: '#E6F0FF',
  MUTED: '#98A3B3',
  HERO_BG: '#0E6B4F',
  HERO_ACCENT: '#DFF6ED',
  BORDER: 'rgba(255,255,255,0.06)',
  SOFT: 'rgba(255,255,255,0.03)',
  ERROR: '#FF6B6B',
  TRANSLUCENT_OVERLAY: 'rgba(6,10,20,0.6)',
  BLURB_TOP: 'rgba(34,85,164,0.06)',
  BLURB_BOTTOM: 'rgba(2,156,115,0.04)',
  TAB_BAR: '#0a1625ff',
};

const prayerLightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: L.SAFE_BG },
  container: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, alignItems: 'stretch' },

  blobTop: {
    position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80,
    backgroundColor: 'rgba(34,85,164,0.08)', transform: [{ rotate: '25deg' }],
  },
  blobBottom: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90,
    backgroundColor: 'rgba(2,156,115,0.06)', transform: [{ rotate: '-20deg' }],
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  title: { fontSize: 28, fontWeight: '900', color: L.PRIMARY },
  subtitle: { color: L.MUTED, marginTop: 4, fontSize: 13 },

  dateRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  gregorian: { color: L.MUTED, fontSize: 12, marginRight: 6 },
  hijri: { color: L.MUTED, fontSize: 12 },

  iconButton: {
    backgroundColor: L.CARD_BG, padding: 8, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconButtonText: { fontSize: 16, color: L.HERO_BG, fontWeight: '700' },

  dateSelector: { marginTop: 6, marginBottom: 12 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  quickButton: {
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#EEF3FB', minWidth: 40, alignItems: 'center',
  },
  quickButtonToday: { backgroundColor: L.HERO_BG },
  quickText: { color: L.PRIMARY, fontWeight: '700' },
  quickTextToday: { color: '#fff' },

  manualRow: { flexDirection: 'row', alignItems: 'center' },
  manualInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#E9F0FF', color: L.PRIMARY,
  },
  applyBtn: { marginLeft: 10, backgroundColor: L.HERO_BG, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: '800' },
  dateError: { color: L.ERROR, marginTop: 6 },

  heroWrap: { marginTop: 8, marginBottom: 14 },
  heroCard: {
    backgroundColor: L.HERO_BG, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8,
  },
  heroSmall: { color: L.HERO_ACCENT, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  heroLabel: { color: L.HERO_ACCENT, fontSize: 20, fontWeight: '900' },
  heroTime: { color: L.HERO_ACCENT, fontSize: 36, fontWeight: '900' },

  countdownRow: { marginTop: 16 },
  countdownText: { color: L.HERO_ACCENT, fontSize: 18, fontWeight: '900', marginBottom: 8 },

  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 8 },

  card: {
    backgroundColor: L.CARD_BG, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4, marginTop: 8, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  rowActive: { backgroundColor: '#F0FAFF' },
  jummahRow: { borderLeftWidth: 4, borderLeftColor: '#FFD166', backgroundColor: '#FFF9F0' },

  left: { flexDirection: 'row', alignItems: 'center' },
  prayerLabel: { fontSize: 15, color: L.PRIMARY, fontWeight: '800' },
  prayerLabelActive: { color: L.HERO_BG },

  prayerTime: { fontSize: 18, fontWeight: '900', color: L.PRIMARY },
  prayerTimeActive: { color: L.HERO_BG },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginTop: 6 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10 },
  smallMuted: { fontSize: 12, color: L.MUTED },
  permissionHint: { marginTop: 4, fontSize: 12, color: '#D04444' },

  loading: { paddingVertical: 28, alignItems: 'center' },
  loadingText: { marginTop: 8, color: L.MUTED },
  loadingHero: { alignItems: 'center' },

  actions: { flexDirection: 'row', marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  updateButton: { width: '60%', backgroundColor: L.HERO_BG, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontWeight: '800' },

  meta: { marginTop: 14, color: L.MUTED, fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,10,20,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: L.CARD_BG, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: L.PRIMARY },
  modalClose: { padding: 6 },
  modalBody: { marginTop: 12 },
  modalSub: { color: L.MUTED, fontSize: 12 },
  modalBearing: { fontSize: 22, fontWeight: '900', color: L.HERO_BG, marginTop: 6 },
  modalCompassWrap: { alignItems: 'center', marginTop: 14 },

  modalCompassOuter: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },

  compassRing: {
    width: 220, height: 220, borderRadius: 110, borderWidth: 10, borderColor: 'rgba(11,36,71,0.06)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 6, position: 'absolute',
  },

  compassCenterBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F6F8FB', position: 'absolute' },

  tick: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tickN: { transform: [{ translateY: -100 }] },
  tickE: { transform: [{ rotate: '90deg' }, { translateY: -100 }] },
  tickS: { transform: [{ rotate: '180deg' }, { translateY: -100 }] },
  tickW: { transform: [{ rotate: '270deg' }, { translateY: -100 }] },
  tickLabel: { color: L.MUTED, fontWeight: '700' },

  fixedArrow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  modalArrowStem: { width: 6, height: 40, backgroundColor: L.HERO_BG, borderRadius: 3, marginTop: -6 },

  modalHint: { color: L.MUTED, marginTop: 6 },
  modalBtn: { backgroundColor: L.HERO_BG, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
  modalCloseBtn: { backgroundColor: '#6B7A99' },

  rimMarkerContainer: {
    position: 'absolute', top: '50%', left: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12,
    alignItems: 'center', justifyContent: 'center',
  },
  rimMarkerInner: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  kaabaMarker: { borderWidth: 1, borderColor: 'rgba(11,36,71,0.06)' },
  kaabaIcon: { width: 12, height: 12, backgroundColor: L.PRIMARY, borderRadius: 2 },

  alignWrap: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    left: '50%', top: '50%', marginLeft: -28, marginTop: -28,
  },
  alignOn: { borderWidth: 3, borderColor: '#00B894', backgroundColor: 'rgba(0,184,148,0.06)' },
  alignOff: { borderWidth: 2, borderColor: 'rgba(107,122,153,0.12)', backgroundColor: 'transparent' },
  alignDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});

const prayerDarkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.SAFE_BG },
  container: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, alignItems: 'stretch' },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: D.BLURB_TOP, transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: D.BLURB_BOTTOM, transform: [{ rotate: '-20deg' }] },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  title: { fontSize: 28, fontWeight: '900', color: D.PRIMARY },
  subtitle: { color: D.MUTED, marginTop: 4, fontSize: 13 },

  dateRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  gregorian: { color: D.MUTED, fontSize: 12, marginRight: 6 },
  hijri: { color: D.MUTED, fontSize: 12 },

  iconButton: {
    backgroundColor: D.CARD_BG, padding: 8, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, elevation: 2,
  },
  iconButtonText: { fontSize: 16, color: D.PRIMARY },

  dateSelector: { marginTop: 6, marginBottom: 12 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  quickButton: {
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: D.CARD_BG,
    borderWidth: 1, borderColor: D.BORDER, minWidth: 40, alignItems: 'center',
  },
  quickButtonToday: { backgroundColor: D.HERO_BG },
  quickText: { color: D.PRIMARY, fontWeight: '700' },
  quickTextToday: { color: '#fff' },

  manualRow: { flexDirection: 'row', alignItems: 'center' },
  manualInput: {
    flex: 1, backgroundColor: D.CARD_BG, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', color: D.PRIMARY,
  },
  applyBtn: { marginLeft: 10, backgroundColor: D.HERO_BG, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  applyText: { color: '#fff', fontWeight: '800' },
  dateError: { color: D.ERROR, marginTop: 6 },

  heroWrap: { marginTop: 8, marginBottom: 14 },
  heroCard: {
    backgroundColor: D.HERO_BG, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18,
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 18, elevation: 8,
  },
  heroSmall: { color: D.HERO_ACCENT, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  heroLabel: { color: D.HERO_ACCENT, fontSize: 20, fontWeight: '900' },
  heroTime: { color: D.HERO_ACCENT, fontSize: 36, fontWeight: '900' },

  countdownRow: { marginTop: 16 },
  countdownText: { color: D.HERO_ACCENT, fontSize: 18, fontWeight: '900', marginBottom: 8 },

  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 8 },

  card: {
    backgroundColor: D.CARD_BG, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, marginTop: 8, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowActive: { backgroundColor: 'rgba(14,107,79,0.06)' },
  jummahRow: { borderLeftWidth: 4, borderLeftColor: '#FFD166', backgroundColor: 'rgba(255,209,102,0.06)' },

  left: { flexDirection: 'row', alignItems: 'center' },
  prayerLabel: { fontSize: 15, color: D.PRIMARY, fontWeight: '800' },
  prayerLabelActive: { color: '#fff' },

  prayerTime: { fontSize: 18, fontWeight: '900', color: D.PRIMARY },
  prayerTimeActive: { color: '#fff' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginTop: 6 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10 },
  smallMuted: { fontSize: 12, color: D.MUTED },
  permissionHint: { marginTop: 4, fontSize: 12, color: D.ERROR },

  loading: { paddingVertical: 28, alignItems: 'center' },
  loadingText: { marginTop: 8, color: D.MUTED },
  loadingHero: { alignItems: 'center' },

  actions: { flexDirection: 'row', marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  updateButton: { width: '60%', backgroundColor: D.HERO_BG, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  updateButtonText: { color: '#fff', fontWeight: '800' },

  meta: { marginTop: 14, color: D.MUTED, fontSize: 12, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: D.TRANSLUCENT_OVERLAY, justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: D.CARD_BG, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 18, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: D.PRIMARY },
  modalClose: { padding: 6 },
  modalBody: { marginTop: 12 },
  modalSub: { color: D.MUTED, fontSize: 12 },
  modalBearing: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 6 },
  modalCompassWrap: { alignItems: 'center', marginTop: 14 },

  modalCompassOuter: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },

  compassRing: {
    width: 220, height: 220, borderRadius: 110, borderWidth: 10, borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: D.CARD_BG,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 6, position: 'absolute',
  },

  compassCenterBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: D.SAFE_BG, position: 'absolute' },

  tick: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  tickN: { transform: [{ translateY: -100 }] },
  tickE: { transform: [{ rotate: '90deg' }, { translateY: -100 }] },
  tickS: { transform: [{ rotate: '180deg' }, { translateY: -100 }] },
  tickW: { transform: [{ rotate: '270deg' }, { translateY: -100 }] },
  tickLabel: { color: D.MUTED, fontWeight: '700' },

  fixedArrow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  modalArrowStem: { width: 6, height: 40, backgroundColor: '#fff', borderRadius: 3, marginTop: -6 },

  modalHint: { color: D.MUTED, marginTop: 6 },
  modalBtn: { backgroundColor: D.HERO_BG, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
  modalCloseBtn: { backgroundColor: '#6B7A99' },

  rimMarkerContainer: {
    position: 'absolute', top: '50%', left: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12,
    alignItems: 'center', justifyContent: 'center',
  },
  rimMarkerInner: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: D.CARD_BG, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  kaabaMarker: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  kaabaIcon: { width: 12, height: 12, backgroundColor: D.PRIMARY, borderRadius: 2 },

  alignWrap: { position: 'absolute', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', left: '50%', top: '50%', marginLeft: -28, marginTop: -28 },
  alignOn: { borderWidth: 3, borderColor: '#00B894', backgroundColor: 'rgba(0,184,148,0.06)' },
  alignOff: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'transparent' },
  alignDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: D.CARD_BG },
});

const quranLightStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: L.PRIMARY },
  header: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row' },
  iconButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  iconButtonText: { marginLeft: 6, color: L.HERO_BG, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#EEF3FB' },
  searchInput: { flex: 1, marginLeft: 8, color: L.PRIMARY },
  togglePill: { marginLeft: 8, backgroundColor: '#F2F6FA', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  toggleText: { fontWeight: '700', color: L.PRIMARY }, toggleActive: { color: L.HERO_BG },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEF3FB' },
  cardLeft: { width: 44, alignItems: 'center', justifyContent: 'center' },
  indexBubble: { backgroundColor: '#F2F7F3', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontWeight: '800', color: L.PRIMARY },
  cardBody: { flex: 1, paddingLeft: 12 },
  cardRight: { width: 56, alignItems: 'center' },
  surahArabic: { fontWeight: '900', color: L.PRIMARY }, surahEnglish: { color: L.MUTED, marginTop: 4 }, ayahCount: { fontWeight: '800', color: L.PRIMARY },
  ayahCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EEF3FB' },
  ayahCardActive: { borderColor: '#2E8B57', shadowColor: '#2E8B57', shadowOpacity: 0.08 },
  ayahMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ayahBadge: { backgroundColor: '#EEF3FB', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  ayahBadgeText: { fontWeight: '800', color: L.PRIMARY },
  smallIcon: { marginHorizontal: 6, padding: 6 },
  ayahTextWrap: {},
  ayahArabic: { fontSize: 20, textAlign: 'right', lineHeight: 34, color: '#253A56' },
  ayahTransliteration: { marginTop: 4, color: L.MUTED },
  ayahTranslation: { marginTop: 6, color: '#253a56' },
  arabicWordPressable: {},
  underlineOn: { textDecorationLine: 'underline' },
  underlineOff: { textDecorationLine: 'none' },
  bottomPlayer: { backgroundColor: '#37885a', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', elevation: 6 },
  playerTitle: { fontWeight: '800', color: '#fff' }, playerSubtitle: { color: '#fff', marginTop: 2 },
  playerControl: { backgroundColor: 'rgba(255,255,255,0.12)', padding: 8, borderRadius: 8 },
  readerHeader: { backgroundColor: '#37885a', padding: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  readerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readerTitle: { color: '#fff', fontWeight: '800' }, readerSubtitle: { color: '#fff', opacity: 0.9 },
  bigArabic: { fontSize: 34, color: '#fff', fontWeight: '900' },
  readerControls: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  controlPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: 8 },
  controlPillActive: { backgroundColor: '#fff' }, controlText: { color: '#fff', marginLeft: 8 }, controlTextActive: { color: '#37885a' },

  modalSafe: { flex: 1, backgroundColor: '#F7F9FC' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  modalTitle: { fontWeight: '800', fontSize: 16, color: L.PRIMARY },
  reciterRow: { padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#EEF3FB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  wordModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  wordModal: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'flex-start' },
  smallGhost: { padding: 8, borderRadius: 8, backgroundColor: '#F2F6FA' }, smallGhostText: { color: L.HERO_BG, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  closeButton: { marginTop: 12, alignSelf: 'flex-end' }, closeButtonText: { color: L.HERO_BG, fontWeight: '700' },

  fab: { position: 'absolute', right: 18, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: L.HERO_BG, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabIcon: { color: '#fff' },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: 'rgba(34,85,164,0.08)', transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: 'rgba(2,156,115,0.06)', transform: [{ rotate: '-20deg' }] },

  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  updateButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' }, updateButtonText: { color: '#fff', fontWeight: '800' },

  searchResult: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEF3FB' },

  bookmarkRow: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEF3FB', flexDirection: 'row', alignItems: 'center' },
  rowActions: { alignItems: 'flex-end', marginLeft: 12 },

  smallGhostText: { color: L.HERO_BG, fontWeight: '700' }
});

const quranDarkStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.SAFE_BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: D.PRIMARY },
  header: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row' },
  iconButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  iconButtonText: { marginLeft: 6, color: D.HERO_ACCENT, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: D.CARD_BG, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: D.BORDER,
  },
  searchInput: { flex: 1, marginLeft: 8, color: D.PRIMARY },
  togglePill: { marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.02)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  toggleText: { fontWeight: '700', color: D.PRIMARY },
  toggleActive: { color: D.HERO_ACCENT },

  card: { backgroundColor: D.CARD_BG, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: D.BORDER },
  cardLeft: { width: 44, alignItems: 'center', justifyContent: 'center' },
  indexBubble: { backgroundColor: 'rgba(255,255,255,0.02)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontWeight: '800', color: D.PRIMARY },
  cardBody: { flex: 1, paddingLeft: 12 },
  cardRight: { width: 56, alignItems: 'center' },
  surahArabic: { fontWeight: '900', color: D.PRIMARY },
  surahEnglish: { color: D.MUTED, marginTop: 4 },
  ayahCount: { fontWeight: '800', color: D.PRIMARY },
  ayahCard: { backgroundColor: D.CARD_BG, padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: D.BORDER },
  ayahCardActive: { borderColor: D.HERO_BG, shadowColor: D.HERO_BG, shadowOpacity: 0.08 },
  ayahMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ayahBadge: { backgroundColor: 'rgba(255,255,255,0.02)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  ayahBadgeText: { fontWeight: '800', color: D.PRIMARY },
  smallIcon: { marginHorizontal: 6, padding: 6 },
  ayahTextWrap: {},
  ayahArabic: { fontSize: 20, textAlign: 'right', lineHeight: 34, color: D.PRIMARY },
  ayahTransliteration: { marginTop: 4, color: D.MUTED },
  ayahTranslation: { marginTop: 6, color: D.PRIMARY },
  arabicWordPressable: {},
  underlineOn: { textDecorationLine: 'underline' },
  underlineOff: { textDecorationLine: 'none' },
  bottomPlayer: { backgroundColor: D.HERO_BG, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', elevation: 6 },
  playerTitle: { fontWeight: '800', color: '#fff' }, playerSubtitle: { color: '#fff', marginTop: 2 },
  playerControl: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 8 },
  readerHeader: { backgroundColor: D.HERO_BG, padding: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  readerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readerTitle: { color: '#fff', fontWeight: '800' }, readerSubtitle: { color: '#fff', opacity: 0.9 },
  bigArabic: { fontSize: 34, color: '#fff', fontWeight: '900' },
  readerControls: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  controlPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', marginRight: 8 },
  controlPillActive: { backgroundColor: '#fff' }, controlText: { color: '#fff', marginLeft: 8 }, controlTextActive: { color: D.HERO_BG },

  modalSafe: { flex: 1, backgroundColor: D.SAFE_BG },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  modalTitle: { fontWeight: '800', fontSize: 16, color: D.PRIMARY },
  reciterRow: { padding: 12, backgroundColor: D.CARD_BG, borderRadius: 8, borderWidth: 1, borderColor: D.BORDER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  wordModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  wordModal: { width: '86%', backgroundColor: D.CARD_BG, borderRadius: 12, padding: 16, alignItems: 'flex-start' },
  smallGhost: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)' }, smallGhostText: { color: D.HERO_ACCENT, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', backgroundColor: D.CARD_BG, padding: 16, borderRadius: 12 },
  closeButton: { marginTop: 12, alignSelf: 'flex-end' }, closeButtonText: { color: D.HERO_ACCENT, fontWeight: '700' },

  fab: { position: 'absolute', right: 18, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: D.HERO_BG, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabIcon: { color: '#fff' },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: D.BLURB_TOP, transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: D.BLURB_BOTTOM, transform: [{ rotate: '-20deg' }] },

  settingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  updateButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: D.HERO_BG, color: D.HERO_BG },
  updateButtonText: { color: '#fff', fontWeight: '800' },

  searchResult: { backgroundColor: D.CARD_BG, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: D.BORDER },

  bookmarkRow: { backgroundColor: D.CARD_BG, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: D.BORDER, flexDirection: 'row', alignItems: 'center' },
  rowActions: { alignItems: 'flex-end', marginLeft: 12 },

  smallGhostText: { color: D.HERO_ACCENT, fontWeight: '700' }
});

const duasLightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F9FF' },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F9FF' },

  header: { paddingHorizontal: 18, paddingBottom: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '900', color: L.PRIMARY },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  headerIcon: { padding: 8, marginLeft: 8 },

  catWrap: { height: 72, justifyContent: 'center', backgroundColor: 'transparent' },
  catBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#fff',
    marginHorizontal: 6, borderWidth: 0.5, borderColor: '#EEF2FF', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1,
  },
  catBtnActive: { backgroundColor: '#2E8B57' },
  catText: { fontWeight: '700', color: L.PRIMARY },
  catTextActive: { color: '#fff' },
  catCount: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginVertical: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#EEF2FF',
    shadowColor: '#000', shadowOpacity: 0.03, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: L.PRIMARY },

  listWrap: { flex: 1, paddingHorizontal: 12 },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 14,
    marginVertical: 8, borderWidth: 1, borderColor: '#F0F6FF', shadowColor: '#000', shadowOpacity: 0.04, elevation: 2,
  },
  itemLeft: { marginRight: 12 },
  token: { width: 46, height: 46, borderRadius: 46, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center' },
  tokenText: { fontWeight: '900', color: L.HERO_BG },

  itemTitle: { fontWeight: '800', fontSize: 15, color: L.PRIMARY },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { padding: 8 },

  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#6B7280' },

  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F5F7' },
  modalClose: { padding: 8 },
  modalTitle: { fontWeight: '900', fontSize: 18, color: L.PRIMARY },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  detailScroll: { padding: 18 },
  detailTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailArabic: { fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', flex: 1, color: L.PRIMARY, lineHeight: 42 },
  detailLatin: { marginTop: 12, fontWeight: '700', color: '#374151', fontSize: 15 },
  detailTranslation: { marginTop: 12, color: '#374151', fontSize: 15 },
  section: { marginTop: 14, backgroundColor: '#FBFDFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EEF6FF' },
  sectionTitle: { fontWeight: '800', marginBottom: 6, color: L.PRIMARY },
  sectionText: { color: '#374151' },
  detailActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2FF', minWidth: 90, justifyContent: 'center' },
  actionText: { marginLeft: 8, fontWeight: '700', color: L.PRIMARY },
  smallRow: { flexDirection: 'row', alignItems: 'center' },
  iconAction: { padding: 8 },

  primaryBtn: { backgroundColor: '#2E8B57', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  manageModalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '90%' },
  overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11,16,30,0.35)' },
  input: { borderWidth: 1, borderColor: '#EEF2FF', padding: 10, borderRadius: 8, marginTop: 8, color: L.PRIMARY },

  listCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: '#F0F6FF' },
  listTitle: { fontWeight: '800', color: L.PRIMARY },
  listCount: { color: '#6B7280', fontSize: 12 },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listViewTitle: { fontWeight: '900', fontSize: 16 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#F0F6FF' },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: 'rgba(34,85,164,0.08)', transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: 'rgba(2,156,115,0.06)', transform: [{ rotate: '-20deg' }] },
});

const duasDarkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.SAFE_BG },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: D.SAFE_BG },

  header: { paddingHorizontal: 18, paddingBottom: 10, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '900', color: D.PRIMARY },
  subtitle: { color: D.MUTED, fontSize: 12, marginTop: 2 },
  headerIcon: { padding: 8, marginLeft: 8 },

  catWrap: { height: 72, justifyContent: 'center', backgroundColor: D.TRANSPARENT || 'transparent' },
  catBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: D.CARD_BG,
    marginHorizontal: 6, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.03)', shadowColor: '#000', shadowOpacity: 0.06, elevation: 1,
  },
  catBtnActive: { backgroundColor: D.HERO_BG },
  catText: { fontWeight: '700', color: D.PRIMARY }, catTextActive: { color: '#fff' },
  catCount: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginVertical: 8,
    backgroundColor: D.CARD_BG, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: D.BORDER, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: D.PRIMARY },

  listWrap: { flex: 1, paddingHorizontal: 12 },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: D.CARD_BG,
    borderRadius: 14, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', shadowColor: '#000', shadowOpacity: 0.04, elevation: 2,
  },
  itemLeft: { marginRight: 12 },
  token: { width: 46, height: 46, borderRadius: 46, backgroundColor: 'rgba(14,107,79,0.12)', justifyContent: 'center', alignItems: 'center' },
  tokenText: { fontWeight: '900', color: D.HERO_BG },

  itemTitle: { fontWeight: '800', fontSize: 15, color: D.PRIMARY },
  itemMeta: { fontSize: 12, color: D.MUTED, marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { padding: 8 },

  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: D.MUTED },

  modalSafe: { flex: 1, backgroundColor: D.SAFE_BG },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  modalClose: { padding: 8 },
  modalTitle: { fontWeight: '900', fontSize: 18, color: D.PRIMARY },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  detailScroll: { padding: 18 },
  detailTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailArabic: { fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', flex: 1, color: D.PRIMARY, lineHeight: 42 },
  detailLatin: { marginTop: 12, fontWeight: '700', color: D.MUTED, fontSize: 15 },
  detailTranslation: { marginTop: 12, color: D.MUTED, fontSize: 15 },
  section: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  sectionTitle: { fontWeight: '800', marginBottom: 6, color: D.PRIMARY },
  sectionText: { color: D.MUTED },
  detailActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: D.CARD_BG, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', minWidth: 90, justifyContent: 'center' },
  actionText: { marginLeft: 8, fontWeight: '700', color: D.PRIMARY },
  smallRow: { flexDirection: 'row', alignItems: 'center' },
  iconAction: { padding: 8 },

  primaryBtn: { backgroundColor: D.HERO_BG, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  manageModalCard: { backgroundColor: D.CARD_BG, padding: 16, borderRadius: 12, width: '90%' },
  overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(6,10,20,0.6)' },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginTop: 8, color: D.PRIMARY },

  listCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: D.CARD_BG, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  listTitle: { fontWeight: '800', color: D.PRIMARY },
  listCount: { color: D.MUTED, fontSize: 12 },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listViewTitle: { fontWeight: '900', fontSize: 16, color: D.PRIMARY },
  listItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: D.CARD_BG, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: D.BLURB_TOP, transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: D.BLURB_BOTTOM, transform: [{ rotate: '-20deg' }] },
});

const settingsLightStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, backgroundColor: '#F7F9FC', minHeight: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: L.PRIMARY },
  sectionLabel: { fontSize: 13, color: L.MUTED, marginBottom: 8 },

  methodButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#EEF3FB' },
  methodButtonActive: { backgroundColor: '#2E8B57', borderColor: '#1B427F' },
  methodText: { fontSize: 13, color: '#2E8B57', fontWeight: '600' },
  methodTextActive: { color: '#fff' },

  rowSpace: { marginTop: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  madhabRow: { flexDirection: 'row', alignItems: 'center' },
  madhabText: { marginRight: 8, color: '#253a56', fontWeight: '600' },

  smallNote: { fontSize: 12, color: '#6B7A99' },

  adjustRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F2F6FA' },
  adjustLabel: { flex: 1, color: '#253A56', fontWeight: '600' },
  adjustInput: { width: 64, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF9', backgroundColor: '#FFF', textAlign: 'center' },
  adjustHint: { marginLeft: 8, color: '#6B7A99', fontSize: 12 },

  apiInput: { marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E6EEF9', backgroundColor: '#FFF' },

  actions: { flexDirection: 'row', marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#2E8B57', paddingVertical: 12, borderRadius: 10, marginRight: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  saveGhost: { width: 100, borderWidth: 1, borderColor: '#D6E0F0', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveGhostText: { color: '#2E8B57', fontWeight: '700' },

  resetBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  resetText: { color: '#D04444', fontWeight: '700' },

  footerNote: { marginTop: 14, color: '#6B7A99', fontSize: 12, lineHeight: 18 },
  footerNoteLink: { color: 'blue', fontSize: 12, textDecorationLine: "underline", lineHeight: 18 },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: 'rgba(34,85,164,0.08)', transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: 'rgba(2,156,115,0.06)', transform: [{ rotate: '-20deg' }] },

  updateContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEF3FB' },
  sectionTitleSmall: { fontSize: 16, fontWeight: '700', color: '#0B2447' },
  updateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  checkBtn: { flex: 1, backgroundColor: '#37885a', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  checkBtnText: { color: '#fff', fontWeight: '700' },
  checkGhost: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D6E0F0', alignItems: 'center' },
  checkGhostText: { color: '#37885a', fontWeight: '700' },

  importContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EEF3FB' },
  importBtn: { flex: 1, backgroundColor: '#2E8B57', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  importBtnText: { color: '#fff', fontWeight: '700' },
  importGhost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D6E0F0', alignItems: 'center', justifyContent: 'center' },
  importGhostText: { color: '#2E8B57', fontWeight: '700' },

  clearBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  clearText: { color: '#D04444', fontWeight: '700' },

  importModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  importModal: { width: '92%', backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  importTextInput: { height: 180, borderWidth: 1, borderColor: '#E6EEF9', borderRadius: 8, padding: 10, backgroundColor: '#fff' },

  smallGhostText: { color: '#37885a', fontWeight: '700' }
});

const settingsDarkStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, backgroundColor: D.SAFE_BG, minHeight: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: D.PRIMARY },
  sectionLabel: { fontSize: 13, color: D.MUTED, marginBottom: 8 },

  methodButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: D.CARD_BG, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  methodButtonActive: { backgroundColor: D.HERO_BG, borderColor: '#0B4F36' },
  methodText: { fontSize: 13, color: D.HERO_BG, fontWeight: '600' },
  methodTextActive: { color: '#fff' },

  rowSpace: { marginTop: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  madhabRow: { flexDirection: 'row', alignItems: 'center' },
  madhabText: { marginRight: 8, color: D.PRIMARY, fontWeight: '600' },

  smallNote: { fontSize: 12, color: D.MUTED },

  adjustRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  adjustLabel: { flex: 1, color: D.PRIMARY, fontWeight: '600' },
  adjustInput: { width: 64, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', backgroundColor: D.CARD_BG, textAlign: 'center', color: D.PRIMARY },
  adjustHint: { marginLeft: 8, color: D.MUTED, fontSize: 12 },

  apiInput: { marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', backgroundColor: D.CARD_BG, color: D.PRIMARY },

  actions: { flexDirection: 'row', marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: D.HERO_BG, paddingVertical: 12, borderRadius: 10, marginRight: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  saveGhost: { width: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveGhostText: { color: D.HERO_BG, fontWeight: '700' },

  resetBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  resetText: { color: D.ERROR, fontWeight: '700' },

  footerNote: { marginTop: 14, color: D.MUTED, fontSize: 12, lineHeight: 18 },
  footerNoteLink: { color: D.HERO_ACCENT, fontSize: 12, textDecorationLine: "underline", lineHeight: 18 },

  blobTop: { position: 'absolute', width: 260, height: 260, borderRadius: 140, right: -80, top: -80, backgroundColor: D.BLURB_TOP, transform: [{ rotate: '25deg' }] },
  blobBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, left: -90, bottom: -90, backgroundColor: D.BLURB_BOTTOM, transform: [{ rotate: '-20deg' }] },

  updateContainer: { backgroundColor: D.CARD_BG, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  sectionTitleSmall: { fontSize: 16, fontWeight: '700', color: D.PRIMARY },
  updateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  checkBtn: { flex: 1, backgroundColor: D.HERO_BG, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  checkBtnText: { color: '#fff', fontWeight: '700' },
  checkGhost: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', alignItems: 'center' },
  checkGhostText: { color: D.HERO_BG, fontWeight: '700' },

  importContainer: { backgroundColor: D.CARD_BG, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  importBtn: { flex: 1, backgroundColor: D.HERO_BG, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  importBtnText: { color: '#fff', fontWeight: '700' },
  importGhost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  importGhostText: { color: D.HERO_BG, fontWeight: '700' },

  clearBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  clearText: { color: D.ERROR, fontWeight: '700' },

  importModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  importModal: { width: '92%', backgroundColor: D.CARD_BG, padding: 12, borderRadius: 12 },
  importTextInput: { height: 180, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, backgroundColor: D.CARD_BG, color: D.PRIMARY },

  smallGhostText: { color: D.HERO_ACCENT, fontWeight: '700' }
});

export const prayerStyles = prayerDarkStyles;
export const quranStyles = quranDarkStyles;
export const duasStyles = duasDarkStyles;
export const settingsStyles = settingsDarkStyles;

export function palette(isDark) { return isDark ? D : L }

export default {
  prayerStyles: prayerStyles,
  quranStyles: quranStyles,
  duasStyles: duasStyles,
  settingsStyles: settingsStyles,
  palette,
};

export function getStyles(screen, isDark) {
  const name = String(screen || '').toLowerCase();
  if (name === "prayer") return isDark ? prayerDarkStyles : prayerLightStyles;
  if (name === "quran") return isDark ? quranDarkStyles : quranLightStyles;
  if (name === "duas") return isDark ? duasDarkStyles : duasLightStyles;
  if (name === "settings") return isDark ? settingsDarkStyles : settingsLightStyles;
  return {};
}
