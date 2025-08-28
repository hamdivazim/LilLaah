import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Alert,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { getCategories, getCategoryItems, getDuaDetail, getDuaApiBase, setDuaApiBase } from '../../services/dua_service';
import { getStyles, duasStyles as styles, systemIsDark } from '../styles';

const STORAGE_FAV_KEY = 'lillaah_dua_favs_v1';
const STORAGE_LISTS_KEY = 'lillaah_dua_lists_v1';
const DUA_SETTINGS_KEY = 'dua_settings_v1';

export default function Duas({systemIsDark}) {
  const [fontsLoaded] = useFonts({ Quran: require('../../assets/fonts/quran.ttf') });

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const queryRef = useRef(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [favs, setFavs] = useState({});

  const [lists, setLists] = useState({});
  const [listsModalVisible, setListsModalVisible] = useState(false);
  const [manageListModalVisible, setManageListModalVisible] = useState(false);
  const [listActionTarget, setListActionTarget] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [activeViewListId, setActiveViewListId] = useState(null);

  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);

  const containerPaddingTop = Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 0;

  const styles = getStyles("duas", systemIsDark);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        setLoading(true);

        try {
          const duaRaw = await AsyncStorage.getItem(DUA_SETTINGS_KEY);
          if (duaRaw) {
            const duaParsed = JSON.parse(duaRaw);
            setShowTransliteration(duaParsed.showTransliteration !== false);
            setShowTranslation(duaParsed.showTranslation !== false);
            if (duaParsed.apiBase) {
              try { await setDuaApiBase(duaParsed.apiBase); } catch (e) {}
            } else {
              try { await getDuaApiBase(); } catch (e) {}
            }
          } else {
            try { await getDuaApiBase(); } catch (e) {}
          }
        } catch (e) {
          console.warn('Failed to restore Dua settings', e);
        }

        const [catsRes, favJson, listsJson] = await Promise.all([
          getCategories(),
          AsyncStorage.getItem(STORAGE_FAV_KEY),
          AsyncStorage.getItem(STORAGE_LISTS_KEY),
        ]);

        if (!mounted) return;

        setCategories(catsRes.data || []);
        if (catsRes.data && catsRes.data.length) setActiveCategory(catsRes.data[0].slug);
        setFavs(favJson ? JSON.parse(favJson) : {});
        setLists(listsJson ? JSON.parse(listsJson) : {});
      } catch (e) {
        console.warn('Failed to load categories or storage', e);
        Alert.alert('Network error', 'Could not load data. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    fetchItems(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (queryRef.current) clearTimeout(queryRef.current);
    queryRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => queryRef.current && clearTimeout(queryRef.current);
  }, [query]);

  const fetchItems = useCallback(async (slug, opts = {}) => {
    try {
      if (!opts.background) setRefreshing(true);
      const res = await getCategoryItems(slug);
      setItems(res.data || []);
    } catch (e) {
      console.warn('Failed to load items', e);
      Alert.alert('Error', 'Could not load items for this category.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    if (activeCategory) fetchItems(activeCategory, { background: false });
  };

  const openDetail = async (slug, id) => {
    try {
      setDetailLoading(true);
      setDetailVisible(true);
      const res = await getDuaDetail(slug, id);
      setDetail(res.data || null);
    } catch (e) {
      console.warn('detail fetch fail', e);
      Alert.alert('Error', 'Failed to load dua details.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setDetail(null);
  };

  const toggleFav = async (itemKey, meta) => {
    try {
      const newFavs = { ...favs };
      if (newFavs[itemKey]) delete newFavs[itemKey];
      else newFavs[itemKey] = meta;
      setFavs(newFavs);
      await AsyncStorage.setItem(STORAGE_FAV_KEY, JSON.stringify(newFavs));
    } catch (e) {
      console.warn('fav save fail', e);
    }
  };

  const saveLists = async (next) => {
    try {
      setLists(next);
      await AsyncStorage.setItem(STORAGE_LISTS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save lists', e);
    }
  };

  const createList = async (name) => {
    if (!name || !name.trim()) return Alert.alert('List name', 'Please enter a name for the list.');
    const id = `list_${Date.now()}`;
    const next = { ...lists, [id]: { name: name.trim(), items: [] } };
    await saveLists(next);
    setNewListName('');
    setManageListModalVisible(false);
    setActiveViewListId(id);
  };

  const deleteList = async (id) => {
    const { [id]: removed, ...rest } = lists;
    await saveLists(rest);
    if (activeViewListId === id) setActiveViewListId(null);
  };

  const addToList = async (listId, duaMeta) => {
    if (!lists[listId]) return;
    const exists = lists[listId].items.some(i => i.category === duaMeta.category && String(i.id) === String(duaMeta.id));
    if (exists) return Alert.alert('Already in list', 'This dua is already in the selected list.');
    const next = {
      ...lists,
      [listId]: { ...lists[listId], items: [{ category: duaMeta.category, id: duaMeta.id, title: duaMeta.title }, ...lists[listId].items] }
    };
    await saveLists(next);
    setListActionTarget(null);
    Alert.alert('Added', 'Dua added to list');
  };

  const removeFromList = async (listId, duaId) => {
    if (!lists[listId]) return;
    const nextItems = lists[listId].items.filter(i => String(i.id) !== String(duaId));
    const next = { ...lists, [listId]: { ...lists[listId], items: nextItems } };
    await saveLists(next);
  };

  const onShare = async (title, arabic, latin, translation) => {
    const textParts = [title, arabic, latin, translation].filter(Boolean).join('\n\n');
    try {
      await Share.share({ message: textParts, title });
    } catch (e) {}
  };

  const filteredItems = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return items;
    return items.filter(it => (it.title || '').toLowerCase().includes(q));
  }, [items, debouncedQuery]);

  const renderCategory = ({ item }) => {
    const active = item.slug === activeCategory;
    return (
      <TouchableOpacity
        onPress={() => setActiveCategory(item.slug)}
        style={[styles.catBtn, active && styles.catBtnActive]}
        accessibilityLabel={`Open category ${item.name}`}
      >
        <Text numberOfLines={1} style={[styles.catText, active && styles.catTextActive]}>
          {item.name} <Text style={styles.catCount}>· {item.total}</Text>
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const key = `${item.category}:${item.id}`;
    const isFav = !!favs[key];
    const tokenLetter = (item.title || '').charAt(0).toUpperCase();
    return (
      <TouchableOpacity style={styles.itemCard} onPress={() => openDetail(item.category, item.id)} accessible accessibilityRole="button">
        <View style={styles.itemLeft}>
          <View style={styles.token}>
            <Text style={styles.tokenText}>{tokenLetter}</Text>
          </View>
        </View>

        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text numberOfLines={2} style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemMeta}>{item.categoryName}</Text>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity onPress={() => toggleFav(key, { id: item.id, title: item.title, category: item.category })} style={styles.iconWrap} accessibilityLabel={isFav ? 'Remove favourite' : 'Save favourite'}>
            <Ionicons name={isFav ? 'bookmark' : 'bookmark-outline'} size={20} color={isFav ? '#D97706' : '#6B7280'} />
          </TouchableOpacity>
          <Ionicons name='chevron-forward' size={20} color='#9CA3AF' />
        </View>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingFull, { paddingTop: containerPaddingTop }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: containerPaddingTop }]}>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Duas & Dhikr</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => {
            setItems(Object.keys(favs).map(k => ({ id: favs[k].id, title: favs[k].title, category: favs[k].category, categoryName: 'Favourites' })));
            setActiveCategory('favourites');
          }} style={styles.headerIcon} accessibilityLabel="Open favourites">
            <Ionicons name='bookmark' size={22} color='#37885a' />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setListsModalVisible(true)} style={styles.headerIcon} accessibilityLabel="Open lists">
            <Ionicons name='list' size={22} color='#37885a' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.catWrap}>
        {loading ? <ActivityIndicator /> : (
          <FlatList
            horizontal
            data={categories}
            keyExtractor={c => c.slug}
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
          />
        )}
      </View>

      <View style={styles.searchRow}>
        <Ionicons name='search' size={18} color='#6B7280' style={{ marginRight: 8 }} />
        <TextInput
          placeholder='Search within category'
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          returnKeyType='search'
          onSubmitEditing={() => Keyboard.dismiss()}
          accessibilityLabel="Search duas"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 8 }} accessibilityLabel="Clear search">
            <Ionicons name='close' size={18} color='#6B7280' />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.listWrap}>
        {refreshing && items.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={it => `${it.category}:${it.id}`}
            renderItem={renderItem}
            onRefresh={onRefresh}
            refreshing={refreshing}
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
            ListEmptyComponent={() => (
              <View style={styles.empty}><Text style={styles.emptyText}>No duas found in this category.</Text></View>
            )}
          />
        )}
      </View>

      <Modal visible={detailVisible} animationType='slide' onRequestClose={closeDetail}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetail} style={styles.modalClose} accessibilityLabel="Close"><Ionicons name='chevron-back' size={24} color={systemIsDark?'#37885a' :'#000'} /></TouchableOpacity>
            <Text style={styles.modalTitle}>{detail?.title ?? 'Dua'}</Text>
            <View style={{ width: 48 }} />
          </View>

          {detailLoading ? (
            <View style={styles.center}><ActivityIndicator /><Text style={{ marginTop: 8 }}>Loading…</Text></View>
          ) : detail ? (
            <ScrollView contentContainerStyle={styles.detailScroll}>
              <View style={styles.detailTopRow}>
                <Text
                  style={[styles.detailArabic, { fontFamily: 'Quran', fontSize: 30 }]}
                  selectable
                  accessibilityLabel="Arabic text of dua"
                >
                  {detail.arabic}
                </Text>

                <View style={styles.smallRow}>
                  <TouchableOpacity onPress={() => setShowTransliteration(s => !s)} style={styles.iconAction} accessibilityLabel="Toggle transliteration">
                    <Ionicons name={showTransliteration ? 'eye' : 'eye-off'} size={18} color={systemIsDark?'#37885a' :'#000'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowTranslation(s => !s)} style={styles.iconAction} accessibilityLabel="Toggle translation">
                    <Ionicons name={showTranslation ? 'text' : 'text-outline'} size={18} color={systemIsDark?'#37885a' :'#000'} />
                  </TouchableOpacity>
                </View>
              </View>

              {showTransliteration && detail.latin ? (
                <Text style={styles.detailLatin} selectable>{detail.latin}</Text>
              ) : null}

              {showTranslation && detail.translation ? (
                <Text style={styles.detailTranslation} selectable>{detail.translation}</Text>
              ) : null}

              {detail.notes ? (
                <View style={styles.section}><Text style={styles.sectionTitle}>Notes</Text><Text style={styles.sectionText}>{detail.notes}</Text></View>
              ) : null}

              {detail.fawaid ? (
                <View style={styles.section}><Text style={styles.sectionTitle}>Benefits</Text><Text style={styles.sectionText}>{detail.fawaid}</Text></View>
              ) : null}

              {detail.source ? (
                <View style={styles.section}><Text style={styles.sectionTitle}>Source</Text><Text style={styles.sectionText}>{detail.source}</Text></View>
              ) : null}

              <View style={styles.detailActionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(detail.title, detail.arabic, detail.latin, detail.translation)} accessibilityLabel="Share dua">
                  <Ionicons name='share-social' size={18} color={systemIsDark?'#37885a' :'#000'} />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  const key = `${detail.category}:${detail.id}`;
                  toggleFav(key, { id: detail.id, title: detail.title, category: detail.category });
                }} accessibilityLabel="Save dua">
                  <Ionicons name={favs[`${detail.category}:${detail.id}`] ? 'bookmark' : 'bookmark-outline'} size={18} color={systemIsDark?'#37885a' :'#000'} />
                  <Text style={styles.actionText}>{favs[`${detail.category}:${detail.id}`] ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  const txt = [detail.title, detail.arabic, detail.latin, detail.translation].filter(Boolean).join('\n\n');
                  if (Platform.OS === 'web') {
                    navigator.clipboard.writeText(txt);
                    Alert.alert('Copied');
                  } else {
                    try {
                      const Clipboard = require('@react-native-clipboard/clipboard').default;
                      Clipboard && Clipboard.setString(txt);
                      Alert.alert('Copied to clipboard');
                    } catch (e) {
                      Alert.alert('Copy', 'Could not copy to clipboard on this platform.');
                    }
                  }
                }} accessibilityLabel="Copy dua">
                  <Ionicons name='copy' size={18} color={systemIsDark?'#37885a' :'#000'} />
                  <Text style={styles.actionText}>Copy</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 18 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setListActionTarget({ id: detail.id, title: detail.title, category: detail.category })} accessibilityLabel="Add to list">
                  <Text style={styles.primaryBtnText}>Add to Dua List</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 80 }} />
            </ScrollView>
          ) : (
            <View style={styles.center}><Text>No detail available</Text></View>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={listsModalVisible} animationType='slide' onRequestClose={() => { setListsModalVisible(false); setActiveViewListId(null); }}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setListsModalVisible(false); setActiveViewListId(null); }} style={styles.modalClose}><Ionicons name='chevron-back' size={24} color={systemIsDark?'#37885a' :'#000'} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Dua Lists</Text>
            <TouchableOpacity onPress={() => setManageListModalVisible(true)} style={{ padding: 8 }} accessibilityLabel="Create list"><Ionicons name='add' size={22} color={systemIsDark?'#37885a' :'#000'} /></TouchableOpacity>
          </View>

          <View style={{ padding: 16, flex: 1 }}>
            {Object.keys(lists).length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyText}>You have no lists yet. Tap + to create one.</Text></View>
            ) : (
              <View style={{ flex: 1 }}>
                <FlatList
                  data={Object.keys(lists).map(k => ({ id: k, ...lists[k] }))}
                  keyExtractor={i => i.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.listCard} onPress={() => setActiveViewListId(item.id)}>
                      <View>
                        <Text style={styles.listTitle}>{item.name}</Text>
                        <Text style={styles.listCount}>{item.items.length} items</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteList(item.id)} style={styles.iconWrap} accessibilityLabel="Delete list"><Ionicons name='trash' size={18} color='#EF4444' /></TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />

                {activeViewListId ? (
                  <View style={{ marginTop: 12, flex: 1 }}>
                    <View style={styles.listHeaderRow}>
                      <Text style={styles.listViewTitle}>{lists[activeViewListId]?.name}</Text>
                      <TouchableOpacity onPress={() => setActiveViewListId(null)} style={styles.iconWrap}><Ionicons name='close' size={18} color={systemIsDark?'#37885a' :'#000'} /></TouchableOpacity>
                    </View>

                    <FlatList
                      data={lists[activeViewListId]?.items || []}
                      keyExtractor={i => `${i.category}:${i.id}`}
                      renderItem={({ item }) => (
                        <View style={styles.listItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeFromList(activeViewListId, item.id)} style={styles.iconWrap} accessibilityLabel="Remove from list"><Ionicons name='trash' size={18} color='#EF4444' /></TouchableOpacity>
                        </View>
                      )}
                    />
                  </View>
                ) : null}

              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={manageListModalVisible} animationType='fade' transparent onRequestClose={() => setManageListModalVisible(false)}>
        <View style={styles.overlayCenter}>
          <View style={styles.manageModalCard}>
            <Text style={[styles.modalTitle, {fontSize: 16}]}>Create a new list</Text>
            <TextInput placeholder='List name' value={newListName} onChangeText={setNewListName} style={styles.input} placeholderTextColor={systemIsDark ? '#BBBBBB' : '#555555'} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setManageListModalVisible(false)} style={[styles.actionBtn, { marginRight: 8 }]}><Text style={styles.actionText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => createList(newListName)} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!listActionTarget} animationType='slide' onRequestClose={() => setListActionTarget(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setListActionTarget(null)} style={styles.modalClose}><Ionicons name='chevron-back' size={24} color={systemIsDark?'#37885a' :'#000'} /></TouchableOpacity>
            <Text style={styles.modalTitle}>Add to list</Text>
            <View style={{ width: 48 }} />
          </View>

          <View style={{ padding: 16, flex: 1 }}>
            <Text style={{ marginBottom: 8, color: '#6B7280' }}>Select a list to add "{listActionTarget?.title}" to, or create a new list.</Text>
            <FlatList
              data={Object.keys(lists).map(k => ({ id: k, ...lists[k] }))}
              keyExtractor={i => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listCard} onPress={() => addToList(item.id, listActionTarget)}>
                  <View>
                    <Text style={styles.listTitle}>{item.name}</Text>
                    <Text style={styles.listCount}>{item.items.length} items</Text>
                  </View>
                  <Ionicons name='chevron-forward' size={20} color='#9CA3AF' />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => <View style={styles.empty}><Text style={styles.emptyText}>No lists yet — create one first.</Text></View>}
            />

            <View style={{ marginTop: 12 }}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { setManageListModalVisible(true); }}>
                <Text style={styles.primaryBtnText}>Create new list</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
