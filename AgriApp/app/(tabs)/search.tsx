import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Image, ImageBackground, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SearchInput } from '@/components/common/SearchInput';
import { SectionHeader } from '@/components/home/SectionHeader';
import { HomeFooterCard } from '@/components/home/HomeFooterCard';
import { CategoryChips } from '@/components/product/CategoryChips';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductCard } from '@/components/product/ProductCard';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useProductModerationStore } from '@/store/productModerationStore';
import { formatPrice } from '@/utils/format';
import { FontAwesome } from '@expo/vector-icons';
import { resolveImageUrl } from '@/utils/image';

const MIN_PRICE = 0;
const MAX_PRICE = 2000000;
const ORIGIN_OPTIONS = ['Đà Lạt', 'Tây Bắc', 'Miền Tây', 'Nhập khẩu'];

type SellerProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit?: string;
  sold?: number;
  is_active?: boolean;
  description?: string;
  images?: string[];
  category?: string;
  origin?: string;
};

type ProductFormMode = 'create' | 'edit';
type SellerFilter = 'ALL' | 'ACTIVE' | 'OUT_OF_STOCK';
type SellerSort = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'SOLD_DESC';

type ShopSearchResult = {
  id: string;
  name: string;
  avatar?: string | null;
  matchedProductCount: number;
};

export default function SearchScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isSeller = user?.role === 'SELLER';
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);

  const { products, categories, isLoading, isError } = useProducts();
  const addItem = useCartStore((state) => state.addItem);
  const filteredProducts = useProductSearch(products, keyword, selectedCategory);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productFormMode, setProductFormMode] = useState<ProductFormMode>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('khac');
  const [origin, setOrigin] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedImageSource, setSelectedImageSource] = useState<'url' | 'file' | null>(null);
  const [sellerKeyword, setSellerKeyword] = useState('');
  const [sellerFilter, setSellerFilter] = useState<SellerFilter>('ALL');
  const [sellerSort, setSellerSort] = useState<SellerSort>('NEWEST');
  const pausedProductIds = useProductModerationStore((state) => state.pausedProductIds);
  const deletedProductIds = useProductModerationStore((state) => state.deletedProductIds);
  const markPaused = useProductModerationStore((state) => state.markPaused);
  const markDeleted = useProductModerationStore((state) => state.markDeleted);

  const resetProductForm = () => {
    setProductFormMode('create');
    setEditingProductId(null);
    setName('');
    setPrice('');
    setStock('');
    setUnit('kg');
    setCategory('khac');
    setOrigin('');
    setDescription('');
    setImageUrlInput('');
    setSelectedImageUri('');
    setSelectedImageSource(null);
  };

  const fetchSellerProducts = useCallback(async () => {
    if (!isSeller || !accessToken) return;
    try {
      const res = await api.get<SellerProduct[]>('/products/my-products', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const pausedSet = new Set(pausedProductIds);
      const deletedSet = new Set(deletedProductIds);
      const source = Array.isArray(res.data) ? res.data : [];

      setSellerProducts(
        source
          .filter((item) => !deletedSet.has(item.id))
          .map((item) => (pausedSet.has(item.id) ? { ...item, is_active: false } : item)),
      );
    } catch {
      setSellerProducts([]);
    }
  }, [isSeller, accessToken, pausedProductIds, deletedProductIds]);

  const getMimeTypeFromUri = (uri: string) => {
    const normalized = uri.toLowerCase();
    if (normalized.endsWith('.png')) return 'image/png';
    if (normalized.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  };

  const selectImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Can quyen truy cap', 'Vui long cap quyen thu vien de chon anh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSelectedImageUri(result.assets[0].uri);
    setSelectedImageSource('file');
    setImageUrlInput('');
  };

  const selectImageFromFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setSelectedImageUri(result.assets[0].uri);
    setSelectedImageSource('file');
    setImageUrlInput('');
  };

  const parseImageUrls = (input: string) =>
    input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const isValidImageUrl = (url: string) => /^https?:\/\//i.test(url) || url.startsWith('/');

  const applyImageUrl = () => {
    const urls = parseImageUrls(imageUrlInput);
    if (urls.length === 0) return;

    const invalid = urls.find((url) => !isValidImageUrl(url));
    if (invalid) {
      Alert.alert('Link anh khong hop le', 'Moi link phai bat dau bang http(s):// hoac duong dan /uploads/...');
      return;
    }

    setSelectedImageUri(urls[0]);
    setSelectedImageSource('url');
  };

  const clearSelectedImage = () => {
    setImageUrlInput('');
    setSelectedImageUri('');
    setSelectedImageSource(null);
  };

  const openCreateProductModal = () => {
    resetProductForm();
    setCreateModalVisible(true);
  };

  const openEditProductModal = (product: SellerProduct) => {
    setProductFormMode('edit');
    setEditingProductId(product.id);
    setName(product.name || '');
    setPrice(String(product.price ?? ''));
    setStock(String(product.stock ?? ''));
    setUnit(product.unit || 'kg');
    setCategory(product.category || 'khac');
    setOrigin(product.origin || '');
    setDescription(product.description || '');

    const currentImages = (product.images ?? []).filter(Boolean);
    setImageUrlInput(currentImages.join(', '));
    setSelectedImageUri(currentImages[0] || '');
    setSelectedImageSource(currentImages.length > 0 ? 'url' : null);
    setCreateModalVisible(true);
  };

  const submitProduct = async () => {
    if (!accessToken || !name.trim() || !price.trim() || !stock.trim()) return;
    setCreatingProduct(true);

    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('price', String(Number(price)));
      form.append('stock', String(Number(stock)));
      form.append('unit', unit.trim() || 'kg');
      form.append('category', category.trim() || 'khac');
      if (origin.trim()) form.append('origin', origin.trim());
      if (description.trim()) form.append('description', description.trim());

      if (selectedImageSource === 'url') {
        const parsedUrls = parseImageUrls(imageUrlInput);
        const imageUrls = parsedUrls.length > 0 ? parsedUrls : selectedImageUri ? [selectedImageUri] : [];

        const invalid = imageUrls.find((url) => !isValidImageUrl(url));
        if (invalid) {
          Alert.alert('Link anh khong hop le', 'Moi link phai bat dau bang http(s):// hoac duong dan /uploads/...');
          setCreatingProduct(false);
          return;
        }

        imageUrls.forEach((url) => form.append('image_urls', url));
      }

      if (selectedImageUri && selectedImageSource === 'file') {
        const fileName = selectedImageUri.split('/').pop() || `product-${Date.now()}.jpg`;
        form.append('image', {
          uri: selectedImageUri,
          name: fileName,
          type: getMimeTypeFromUri(fileName),
        } as any);
      }

      if (productFormMode === 'edit' && editingProductId) {
        await api.patch(`/products/${editingProductId}`, form, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/products', form, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setCreateModalVisible(false);
      resetProductForm();
      await fetchSellerProducts();
    } catch {
      Alert.alert('That bai', 'Khong the luu san pham. Vui long thu lai.');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleConfirmSaveProduct = () => {
    const isCreate = productFormMode === 'create';
    Alert.alert(
      isCreate ? 'Xac nhan tao san pham' : 'Xac nhan cap nhat san pham',
      isCreate ? 'Ban co chac chan muon tao san pham nay?' : 'Ban co chac chan muon luu thay doi?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: isCreate ? 'Tao' : 'Luu',
          style: 'default',
          onPress: () => {
            void submitProduct();
          },
        },
      ],
    );
  };

  const pauseProduct = async (product: SellerProduct) => {
    if (!accessToken) return;
    try {
      await api.delete(`/products/${product.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      markPaused(product.id);
      await fetchSellerProducts();
      Alert.alert('Da tam dung', `San pham "${product.name}" da duoc tam dung ban.`);
    } catch {
      Alert.alert('That bai', 'Khong the tam dung san pham. Vui long thu lai.');
    }
  };

  const deleteProductFromUi = async (product: SellerProduct) => {
    if (!accessToken) return;
    try {
      await api.delete(`/products/${product.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      markDeleted(product.id);
      setSellerProducts((prev) => prev.filter((item) => item.id !== product.id));
      Alert.alert('Da xoa', `San pham "${product.name}" da duoc xoa khoi danh sach hien thi.`);
    } catch {
      Alert.alert('That bai', 'Khong the xoa san pham. Vui long thu lai.');
    }
  };

  const handleDeleteProduct = (product: SellerProduct) => {
    if (!accessToken) return;

    Alert.alert(
      'Quan ly san pham',
      `Ban muon thao tac gi voi "${product.name}"?`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Tam dung',
          style: 'default',
          onPress: () => {
            void pauseProduct(product);
          },
        },
        {
          text: 'Xoa san pham',
          style: 'destructive',
          onPress: () => {
            void deleteProductFromUi(product);
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (!isSeller) return;
      void fetchSellerProducts();
    }, [isSeller, fetchSellerProducts]),
  );

  const normalizeText = (value?: string) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const normalizedKeyword = normalizeText(keyword);

  const visibleShops = useMemo<ShopSearchResult[]>(() => {
    if (!normalizedKeyword) return [];

    const groups = new Map<string, ShopSearchResult>();

    products.forEach((product) => {
      const matchCategory =
        !selectedCategory || selectedCategory === 'Tất cả'
          ? true
          : product.category === selectedCategory;
      if (!matchCategory) return;

      const shopId = product.shop?.id ?? product.seller_id;
      const shopName = product.shop?.store_name ?? product.shopName ?? '';
      if (!shopId || !shopName) return;

      const isShopMatch = normalizeText(shopName).includes(normalizedKeyword);
      if (!isShopMatch) return;

      const current = groups.get(shopId);
      groups.set(shopId, {
        id: shopId,
        name: shopName,
        avatar: product.shop?.avatar_url ?? current?.avatar ?? null,
        matchedProductCount: (current?.matchedProductCount ?? 0) + 1,
      });
    });

    return Array.from(groups.values()).sort((a, b) => b.matchedProductCount - a.matchedProductCount);
  }, [products, normalizedKeyword, selectedCategory]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.filter((product) => {
      const price = product.price ?? 0;
      const matchPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchOrigin =
        selectedOrigins.length === 0 ||
        selectedOrigins.some((origin) => normalizeText(product.origin).includes(normalizeText(origin)));

      return matchPrice && matchOrigin;
    });
  }, [filteredProducts, priceRange, selectedOrigins]);

  const sellerVisibleProducts = useMemo(() => {
    const normalizedKeyword = sellerKeyword.trim().toLowerCase();
    const pausedSet = new Set(pausedProductIds);
    const deletedSet = new Set(deletedProductIds);

    const normalizedProducts = sellerProducts
      .filter((item) => !deletedSet.has(item.id))
      .map((item) => (pausedSet.has(item.id) ? { ...item, is_active: false } : item));

      const filtered = normalizedProducts.filter((item) => {

      const matchesKeyword =
        !normalizedKeyword ||
        item.name?.toLowerCase().includes(normalizedKeyword) ||
        item.id?.toLowerCase().includes(normalizedKeyword);

      const stock = Number(item.stock || 0);
      const isActive = item.is_active !== false;

      if (sellerFilter === 'ACTIVE') return matchesKeyword && stock > 0 && isActive;
      if (sellerFilter === 'OUT_OF_STOCK') return matchesKeyword && (stock <= 0 || !isActive);
      return matchesKeyword;
    });

    const sorted = [...filtered];
    if (sellerSort === 'PRICE_ASC') {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sellerSort === 'PRICE_DESC') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sellerSort === 'SOLD_DESC') {
      sorted.sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    }

    return sorted;
  }, [sellerProducts, sellerKeyword, sellerFilter, sellerSort, pausedProductIds, deletedProductIds]);

  const cycleSort = () => {
    setSellerSort((current) => {
      if (current === 'NEWEST') return 'PRICE_ASC';
      if (current === 'PRICE_ASC') return 'PRICE_DESC';
      if (current === 'PRICE_DESC') return 'SOLD_DESC';
      return 'NEWEST';
    });
  };

  const getSellerSortLabel = () => {
    if (sellerSort === 'PRICE_ASC') return 'Gia tang';
    if (sellerSort === 'PRICE_DESC') return 'Gia giam';
    if (sellerSort === 'SOLD_DESC') return 'Ban chay';
    return 'Moi nhat';
  };

  if (isSeller) {
    return (
      <ScreenContainer>
        <View className="px-4 pt-4 pb-3 bg-[#F1F5F9] border-b border-slate-200 flex-row items-center justify-between">
          <View>
            <Text className="text-4xl font-black text-slate-900">San pham</Text>
            <Text className="text-sm text-slate-500 mt-1">Quan ly kho hang va danh muc san pham</Text>
          </View>
          <TouchableOpacity className="bg-emerald-600 rounded-xl px-4 py-3 flex-row items-center" onPress={openCreateProductModal}>
            <FontAwesome name="plus" size={14} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">Them san pham moi</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 bg-[#F1F5F9] px-4 pt-3" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl border border-slate-200 p-3 mb-3">
            <View className="flex-row items-center">
              <View className="flex-1 flex-row items-center rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50">
                <FontAwesome name="search" size={15} color="#94A3B8" />
                <TextInput
                  className="flex-1 ml-2 text-slate-800"
                  placeholder="Tim kiem theo ten, ma SKU..."
                  value={sellerKeyword}
                  onChangeText={setSellerKeyword}
                />
              </View>

              <TouchableOpacity
                className="ml-2 rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 flex-row items-center"
                onPress={() =>
                  setSellerFilter((current) => {
                    if (current === 'ALL') return 'ACTIVE';
                    if (current === 'ACTIVE') return 'OUT_OF_STOCK';
                    return 'ALL';
                  })
                }
              >
                <FontAwesome name="sliders" size={14} color="#475569" />
                <Text className="ml-2 font-bold text-slate-700">{sellerFilter === 'ALL' ? 'Bo loc' : sellerFilter === 'ACTIVE' ? 'Dang ban' : 'Het hang'}</Text>
              </TouchableOpacity>

              <TouchableOpacity className="ml-2 rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 flex-row items-center" onPress={cycleSort}>
                <FontAwesome name="sort" size={14} color="#475569" />
                <Text className="ml-2 font-bold text-slate-700">{getSellerSortLabel()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {sellerVisibleProducts.length === 0 ? (
            <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
              <EmptyState title="Ban chua co san pham nao" description="Bam Them san pham moi de bat dau dang ban." />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {sellerVisibleProducts.map((p) => (
                <View key={p.id} className="w-[48.5%] bg-white rounded-2xl border border-slate-200 overflow-hidden mb-3">
                  <View className="h-32 bg-slate-100 relative">
                    <Image source={{ uri: resolveImageUrl(p.images?.[0]) }} className="w-full h-full" resizeMode="cover" />

                    <View className="absolute top-2 left-2 bg-white/90 px-2.5 py-1 rounded-full">
                      <Text className={`text-[10px] font-black ${p.is_active ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {p.is_active ? 'DANG BAN' : 'TAM DUNG'}
                      </Text>
                    </View>

                    <View className="absolute top-2 right-2 flex-row gap-2">
                      <TouchableOpacity
                        className="w-8 h-8 rounded-full bg-white items-center justify-center"
                        onPress={() => openEditProductModal(p)}
                      >
                        <FontAwesome name="pencil" size={16} color="#16A34A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-8 h-8 rounded-full bg-white items-center justify-center"
                        onPress={() => handleDeleteProduct(p)}
                      >
                        <FontAwesome name="trash-o" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="p-3">
                    <Text className={`text-slate-900 text-xl font-black ${p.is_active ? 'text-slate-900' : 'text-slate-500'}`} numberOfLines={1}>{p.name}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>#{p.id.slice(-8).toUpperCase()}</Text>

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-[#16A34A] font-black text-3xl">{formatPrice(Number(p.price || 0))}</Text>
                      <View className="rounded-lg px-2 py-1 bg-amber-50 flex-row items-center">
                        <FontAwesome name="star" size={12} color="#EAB308" />
                        <Text className="ml-1 text-amber-600 font-bold text-xs">5.0</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <View className="flex-row items-center">
                        <FontAwesome name="cube" size={12} color="#94A3B8" />
                        <Text className="text-base text-slate-500 ml-1">Kho: <Text className="font-black text-slate-800">{Number(p.stock || 0)}</Text></Text>
                      </View>
                      <View className="flex-row items-center">
                        <FontAwesome name="eye" size={12} color="#94A3B8" />
                        <Text className="text-base text-slate-500 ml-1">Ban: <Text className="font-black text-slate-800">{Number(p.sold || 0)}</Text></Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
          <TouchableOpacity className="flex-1 bg-black/50 justify-end" activeOpacity={1} onPress={() => setCreateModalVisible(false)}>
            <TouchableOpacity className="bg-white rounded-t-3xl p-4 pb-8" activeOpacity={1} onPress={() => {}}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 text-lg font-black">{productFormMode === 'create' ? 'Them San Pham Moi' : 'Chinh Sua San Pham'}</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <FontAwesome name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold text-slate-500 mb-2">Anh san pham</Text>
              <View className="h-36 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden items-center justify-center mb-3">
                {selectedImageUri ? (
                  <Image source={{ uri: resolveImageUrl(selectedImageUri) }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-slate-400">Chua chon anh</Text>
                )}
              </View>

              {selectedImageSource ? (
                <View className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Text className="text-xs text-slate-600">
                    Nguon anh: <Text className="font-bold text-slate-800">{selectedImageSource === 'url' ? `Tu link URL (${parseImageUrls(imageUrlInput).length || 1} anh)` : 'Tu thu vien/tep'}</Text>
                  </Text>
                  <TouchableOpacity onPress={clearSelectedImage}>
                    <Text className="text-xs font-bold text-red-500">Bo anh</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View className="flex-row gap-2 mb-3">
                <TextInput
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-3"
                  placeholder="Dan 1 hoac nhieu link, cach nhau bang dau phay"
                  value={imageUrlInput}
                  onChangeText={setImageUrlInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity className="bg-slate-800 rounded-xl px-3 justify-center" onPress={applyImageUrl}>
                  <Text className="text-white font-bold text-xs">Ap dung</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity className="flex-1 rounded-xl py-3 items-center border border-emerald-200 bg-emerald-50" onPress={() => void selectImageFromLibrary()}>
                  <Text className="text-emerald-700 font-bold">Tu thu vien</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 rounded-xl py-3 items-center border border-blue-200 bg-blue-50" onPress={() => void selectImageFromFile()}>
                  <Text className="text-blue-700 font-bold">Tu tep</Text>
                </TouchableOpacity>
              </View>

              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3" placeholder="Ten san pham" value={name} onChangeText={setName} />
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3" placeholder="Mo ta" value={description} onChangeText={setDescription} />
              <View className="flex-row gap-2 mb-3">
                <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" placeholder="Gia" keyboardType="numeric" value={price} onChangeText={setPrice} />
                <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" placeholder="Ton kho" keyboardType="numeric" value={stock} onChangeText={setStock} />
              </View>
              <View className="flex-row gap-2 mb-3">
                <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" placeholder="Don vi" value={unit} onChangeText={setUnit} />
                <TextInput className="flex-1 border border-slate-200 rounded-xl px-3 py-3" placeholder="Danh muc" value={category} onChangeText={setCategory} />
              </View>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-4" placeholder="Xuat xu" value={origin} onChangeText={setOrigin} />
              <TouchableOpacity className={`rounded-xl py-3 items-center ${creatingProduct || !name.trim() || !price.trim() || !stock.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`} onPress={handleConfirmSaveProduct} disabled={creatingProduct || !name.trim() || !price.trim() || !stock.trim()}>
                <Text className="text-white font-bold">
                  {creatingProduct
                    ? 'Dang luu...'
                    : productFormMode === 'create'
                      ? 'Tao San Pham'
                      : 'Luu Chinh Sua'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScreenContainer>
    );
  }

  const handleToggleOrigin = (origin: string) => {
    setSelectedOrigins((current) =>
      current.includes(origin) ? current.filter((item) => item !== origin) : [...current, origin],
    );
  };

  const clearFilterOnly = () => {
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setSelectedOrigins([]);
  };

  const listHeader = (
    <View className="pb-4">
      <View className="px-4 pt-3">
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1400&auto=format&fit=crop' }}
          className="rounded-[32px] overflow-hidden"
          imageStyle={{ borderRadius: 32 }}
        >
          <View className="bg-black/35 min-h-[190px] px-5 py-5 justify-end">
            <View className="bg-white/15 self-start px-3 py-1.5 rounded-full border border-white/20">
              <Text className="text-white text-[11px] font-semibold tracking-wide">Danh muc san pham</Text>
            </View>

            <Text className="text-white text-3xl font-extrabold leading-tight mt-4">
              Tim nong san theo{`\n`}danh muc va bo loc
            </Text>

            <Text className="text-white/85 mt-3 text-sm leading-5 max-w-[290px]">
              Xem toan bo san pham tu backend, loc nhanh theo gia, xuat xu va nhom san pham.
            </Text>
          </View>
        </ImageBackground>
      </View>

      <View className="px-4 mt-4">
        <SearchInput value={keyword} onChangeText={setKeyword} placeholder="Nhap ten san pham..." />
      </View>

      <View className="mb-1 mt-5">
        <SectionHeader title="Danh muc" subtitle="Chon nhanh nhom san pham" />
        <CategoryChips
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </View>

      <ProductFilters
        minPrice={MIN_PRICE}
        maxPrice={MAX_PRICE}
        priceRange={priceRange}
        onChangePriceRange={setPriceRange}
        origins={ORIGIN_OPTIONS}
        selectedOrigins={selectedOrigins}
        onToggleOrigin={handleToggleOrigin}
        onClearAll={clearFilterOnly}
      />

      <View className="px-4 mt-4">
        <Text className="text-base text-slate-600">
          {visibleShops.length > 0 ? (
            <>
              Tìm thấy <Text className="font-bold text-[#15803D]">{visibleShops.length}</Text> shop và{' '}
              <Text className="font-bold text-[#15803D]">{visibleProducts.length}</Text> sản phẩm
            </>
          ) : (
            <>
              Tìm thấy <Text className="font-bold text-[#15803D]">{visibleProducts.length}</Text> sản phẩm
            </>
          )}
        </Text>
      </View>

      {visibleShops.length > 0 ? (
        <View className="mt-4 mb-1">
          <SectionHeader title="Shop" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <View className="flex-row gap-3">
              {visibleShops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  className="w-52 bg-white border border-slate-200 rounded-2xl px-3 py-3"
                  onPress={() => setKeyword(shop.name)}
                  activeOpacity={0.9}
                >
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 overflow-hidden items-center justify-center">
                      {shop.avatar ? (
                        <Image source={{ uri: resolveImageUrl(shop.avatar) }} className="w-full h-full" />
                      ) : (
                        <FontAwesome name="building-o" size={16} color="#059669" />
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-900 font-bold" numberOfLines={1}>
                        {shop.name}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                        {shop.matchedProductCount} sản phẩm phù hợp
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 18 }}
        ListHeaderComponent={listHeader}
        ListFooterComponent={<HomeFooterCard />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : isError ? (
            <EmptyState
              title="Khong tai duoc danh sach san pham"
              description="Kiem tra EXPO_PUBLIC_API_URL va backend NestJS dang chay tren Railway."
            />
          ) : (
            <EmptyState
              title="Khong co san pham phu hop"
              description="Thu doi khoang gia, nguon goc hoac danh muc khac."
            />
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: { id: item.id },
              })
            }
            onAddToCart={() => addItem(item)}
          />
        )}
      />
    </ScreenContainer>
  );
}
