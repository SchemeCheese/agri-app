import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import api from '@/api/client';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';
import { useCartSummary } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

type TabKey = 'info' | 'orders' | 'products' | 'create' | 'vouchers' | 'reviews' | 'shop' | 'chat';

type ProfileData = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  avatar?: string | null;
  profile?: {
    store_name?: string | null;
    address?: string | null;
    description?: string | null;
    cover_url?: string | null;
    banners1?: string[] | null;
    shop_google_maps_url?: string | null;
  } | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  negotiated_price: number;
  product?: {
    id: string;
    name: string;
    unit?: string;
    images?: string[];
  };
};

type OrderData = {
  id: string;
  status: string;
  created_at: string;
  final_total_price: number;
  payment_method?: string;
  shipping_address?: string;
  note?: string;
  order_items: OrderItem[];
  buyer?: {
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  seller?: {
    full_name?: string;
    profile?: {
      store_name?: string;
    };
  };
  payments?: {
    payment_method?: string;
    status?: string;
  }[];
};

type SavedVoucher = {
  id: string;
  is_used?: boolean;
  voucher?: {
    id: string;
    code: string;
    discount_type: 'PERCENT' | 'FIXED';
    discount_value: number;
    min_order_value: number;
    max_discount_amount: number;
    valid_to?: string;
    seller?: {
      profile?: {
        store_name?: string;
      };
    };
  };
};

type SellerProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit?: string;
  category?: string;
  origin?: string;
  images?: string[];
  is_active?: boolean;
  sold?: number;
};

type SellerDashboard = {
  totalRevenue?: number;
  totalOrders?: number;
  activeProducts?: number;
  revenueByMonth?: { month: string; revenue: number }[];
  top3BestSelling?: { id: string; name: string; sold: number; avgRating: number | null; reviewCount: number }[];
  top3NeedImprovement?: { id: string; name: string; sold: number; avgRating: number | null; reviewCount: number }[];
};

type SellerVoucher = {
  id: string;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  used_count?: number;
  is_active?: boolean;
};

type ReviewData = {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  seller_reply?: string | null;
  order_id?: string;
  buyer?: {
    id?: string;
    full_name?: string;
    avatar?: string | null;
  };
  products?: {
    id: string;
    name: string;
    images?: string[];
  }[];
};

const buyerMenuItems: { key: TabKey; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { key: 'info', label: 'Thong tin ca nhan', icon: 'user-o' },
  { key: 'orders', label: 'Lich su mua hang', icon: 'cube' },
  { key: 'vouchers', label: 'Vi Voucher', icon: 'ticket' },
  { key: 'reviews', label: 'Danh gia cua toi', icon: 'star-o' },
];

const sellerMenuItems: { key: TabKey; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { key: 'info', label: 'Tong quan', icon: 'dashboard' },
  { key: 'products', label: 'San pham', icon: 'leaf' },
  { key: 'create', label: 'Them moi', icon: 'plus-square-o' },
  { key: 'vouchers', label: 'Ma giam gia', icon: 'ticket' },
  { key: 'orders', label: 'Don hang', icon: 'inbox' },
  { key: 'reviews', label: 'Danh gia', icon: 'star-o' },
  { key: 'shop', label: 'Ho so Shop', icon: 'home' },
  { key: 'chat', label: 'Chat', icon: 'comment-o' },
];

// Simple SVG bar chart for revenue-by-month. Width is chart inner-area; outer
// wrapper passes in a fixed pixel width derived from screen layout.
const RevenueBarChart = ({
  data,
  width,
  height = 180,
}: {
  data: { month: string; revenue: number }[];
  width: number;
  height?: number;
}) => {
  if (!data || data.length === 0) return null;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 16;
  const padBottom = 28;
  const innerW = Math.max(20, width - padLeft - padRight);
  const innerH = Math.max(20, height - padTop - padBottom);
  const maxRev = Math.max(1, ...data.map((d) => d.revenue));
  const barGap = 4;
  const barW = (innerW - barGap * (data.length - 1)) / data.length;

  return (
    <Svg width={width} height={height}>
      <Line x1={padLeft} y1={padTop + innerH} x2={padLeft + innerW} y2={padTop + innerH} stroke="#E2E8F0" strokeWidth={1} />
      {data.map((d, i) => {
        const h = (d.revenue / maxRev) * innerH;
        const x = padLeft + i * (barW + barGap);
        const y = padTop + innerH - h;
        const label = d.month.slice(5);
        return (
          <React.Fragment key={d.month}>
            <Rect x={x} y={y} width={barW} height={h} fill="#16A34A" rx={2} />
            <SvgText
              x={x + barW / 2}
              y={padTop + innerH + 14}
              fontSize={9}
              fill="#64748B"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

const getOrderStatusUi = (status: string) => {
  switch (status) {
    case 'PENDING':
      return { label: 'Cho xac nhan', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'clock-o' as const };
    case 'CONFIRMED':
      return { label: 'Cho van chuyen', bg: 'bg-blue-50', text: 'text-blue-700', icon: 'check-circle-o' as const };
    case 'SHIPPING':
      return { label: 'Dang giao', bg: 'bg-purple-50', text: 'text-purple-700', icon: 'truck' as const };
    case 'COMPLETED':
      return { label: 'Hoan thanh', bg: 'bg-green-50', text: 'text-green-700', icon: 'check-circle' as const };
    case 'CANCELLED':
      return { label: 'Da huy', bg: 'bg-red-50', text: 'text-red-700', icon: 'times-circle-o' as const };
    case 'ISSUE_REPORTED':
      return { label: 'Co su co', bg: 'bg-orange-50', text: 'text-orange-700', icon: 'warning' as const };
    default:
      return { label: 'Dang xu ly', bg: 'bg-slate-50', text: 'text-slate-700', icon: 'info-circle' as const };
  }
};

const getTimelineStepIndex = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'CONFIRMED':
      return 1;
    case 'SHIPPING':
    case 'ISSUE_REPORTED':
    case 'FAILED':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
};

const getPaymentStatusText = (order?: OrderData | null) => {
  const payment = order?.payments?.[0];
  if (!payment) return 'Chua thanh toan';
  if (payment.status === 'PAID' || payment.status === 'SUCCESS') return 'Da thanh toan';
  if (payment.payment_method === 'COD') return 'Thanh toan khi nhan hang (COD)';
  return 'Cho thanh toan';
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const { totalItems } = useCartSummary();

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<SavedVoucher[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [sellerDashboard, setSellerDashboard] = useState<SellerDashboard | null>(null);
  const [sellerVouchers, setSellerVouchers] = useState<SellerVoucher[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSellerDashboard, setLoadingSellerDashboard] = useState(false);
  const [loadingSellerVouchers, setLoadingSellerVouchers] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState(false);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [reportIssueModalVisible, setReportIssueModalVisible] = useState(false);
  const [reportIssueNote, setReportIssueNote] = useState('');
  const [reportingIssue, setReportingIssue] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewingOrder, setReviewingOrder] = useState<OrderData | null>(null);
  const [creatingReview, setCreatingReview] = useState(false);
  const [processingSellerOrder, setProcessingSellerOrder] = useState(false);
  const [replyingReview, setReplyingReview] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [replyText, setReplyText] = useState('');
  const [createProductModalVisible, setCreateProductModalVisible] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductCategory, setNewProductCategory] = useState('khac');
  const [newProductOrigin, setNewProductOrigin] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImages, setNewProductImages] = useState<{ uri: string; mimeType?: string | null; fileName?: string | null }[]>([]);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [editProductImages, setEditProductImages] = useState<{ uri: string; mimeType?: string | null; fileName?: string | null }[]>([]);
  const [savingEditProduct, setSavingEditProduct] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState<{ product: SellerProduct; delta: string } | null>(null);
  const [restocking, setRestocking] = useState(false);
  const [productActionId, setProductActionId] = useState<string | null>(null);
  const [createVoucherModalVisible, setCreateVoucherModalVisible] = useState(false);
  const [creatingVoucher, setCreatingVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscountType, setVoucherDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [voucherDiscountValue, setVoucherDiscountValue] = useState('10');
  const [voucherMinOrderValue, setVoucherMinOrderValue] = useState('100000');
  const [voucherMaxDiscountAmount, setVoucherMaxDiscountAmount] = useState('50000');
  const [voucherValidFrom, setVoucherValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [voucherValidTo, setVoucherValidTo] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [voucherUsageLimit, setVoucherUsageLimit] = useState('100');
  const [savingShopProfile, setSavingShopProfile] = useState(false);
  const [shopNameInput, setShopNameInput] = useState('');
  const [shopAddressInput, setShopAddressInput] = useState('');
  const [shopDescriptionInput, setShopDescriptionInput] = useState('');
  const [shopPhoneInput, setShopPhoneInput] = useState('');
  const [shopMapsUrlInput, setShopMapsUrlInput] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const isSeller = user?.role === 'SELLER';
  const menuItems = isSeller ? sellerMenuItems : buyerMenuItems;

  const fetchProfile = useCallback(async () => {
    if (!user || !accessToken) return;

    setLoadingProfile(true);
    try {
      const res = await api.get<ProfileData>('/profile/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [user, accessToken]);

  const fetchOrders = useCallback(async () => {
    if (!user || !accessToken) return;

    setLoadingOrders(true);
    try {
      const endpoint = user.role === 'SELLER' ? '/orders/seller-orders' : '/orders/my-orders';
      const res = await api.get<OrderData[]>(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setOrders(list);

      setSelectedOrder((prev) => {
        if (!prev) return null;
        const matched = list.find((order) => order.id === prev.id);
        return matched ?? null;
      });
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [user, accessToken]);

  const fetchVouchers = useCallback(async () => {
    if (!user || !accessToken) return;
    if (user.role === 'SELLER') {
      setSavedVouchers([]);
      return;
    }

    setLoadingVouchers(true);
    try {
      const res = await api.get<SavedVoucher[]>('/vouchers/saved', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSavedVouchers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSavedVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  }, [user, accessToken]);

  const fetchReviews = useCallback(async () => {
    if (!user || !accessToken) return;

    setLoadingReviews(true);
    try {
      if (user.role === 'SELLER') {
        const res = await api.get<{ reviews?: ReviewData[] }>('/reviews/shop-reviews?filter=all', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setReviews(Array.isArray(res.data?.reviews) ? res.data.reviews : []);
      } else {
        const res = await api.get<ReviewData[]>('/reviews/my-reviews', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setReviews(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [user, accessToken]);

  const fetchSellerProducts = useCallback(async () => {
    if (!user || !accessToken || user.role !== 'SELLER') return;

    setLoadingProducts(true);
    try {
      const res = await api.get<SellerProduct[]>('/products/my-products', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSellerProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSellerProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [user, accessToken]);

  const fetchSellerDashboard = useCallback(async () => {
    if (!user || !accessToken || user.role !== 'SELLER') return;

    setLoadingSellerDashboard(true);
    try {
      const res = await api.get<SellerDashboard>('/orders/seller-dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSellerDashboard(res.data ?? null);
    } catch {
      setSellerDashboard(null);
    } finally {
      setLoadingSellerDashboard(false);
    }
  }, [user, accessToken]);

  const fetchSellerVouchers = useCallback(async () => {
    if (!user || !accessToken || user.role !== 'SELLER') return;

    setLoadingSellerVouchers(true);
    try {
      const res = await api.get<SellerVoucher[]>('/vouchers/mine', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSellerVouchers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSellerVouchers([]);
    } finally {
      setLoadingSellerVouchers(false);
    }
  }, [user, accessToken]);

  const pickProductImages = async (target: 'create' | 'edit') => {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Can quyen', 'App can quyen truy cap thu vien anh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }));
    if (target === 'create') setNewProductImages((prev) => [...prev, ...picked].slice(0, 5));
    else setEditProductImages((prev) => [...prev, ...picked].slice(0, 5));
  };

  const buildProductFormData = (payload: Record<string, string | number | undefined>, images: typeof newProductImages) => {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      form.append(k, String(v));
    });
    images.forEach((img, idx) => {
      const mime = img.mimeType || 'image/jpeg';
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const name = img.fileName || `product-${Date.now()}-${idx}.${ext}`;
      form.append('files', { uri: img.uri, name, type: mime } as any);
    });
    return form;
  };

  const handleCreateProduct = async () => {
    if (!accessToken || !newProductName.trim() || !newProductPrice.trim() || !newProductStock.trim()) return;

    setCreatingProduct(true);
    try {
      const form = buildProductFormData(
        {
          name: newProductName.trim(),
          price: Number(newProductPrice),
          stock: Number(newProductStock),
          unit: newProductUnit.trim() || 'kg',
          category: newProductCategory.trim() || 'khac',
          origin: newProductOrigin.trim() || undefined,
          description: newProductDescription.trim() || undefined,
        },
        newProductImages,
      );

      await api.post('/seller/products', form, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
      });

      await fetchSellerProducts();
      await fetchSellerDashboard();
      setCreateProductModalVisible(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
      setNewProductUnit('kg');
      setNewProductCategory('khac');
      setNewProductOrigin('');
      setNewProductDescription('');
      setNewProductImages([]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Tao san pham that bai.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleSaveEditProduct = async () => {
    if (!accessToken || !editingProduct) return;
    setSavingEditProduct(true);
    try {
      const form = buildProductFormData(
        {
          name: editingProduct.name.trim() || undefined,
          price: Number(editingProduct.price) || undefined,
          stock: Number(editingProduct.stock) || undefined,
          unit: editingProduct.unit?.trim() || undefined,
          category: editingProduct.category?.trim() || undefined,
          origin: editingProduct.origin?.trim() || undefined,
        },
        editProductImages,
      );
      await api.patch(`/seller/products/${editingProduct.id}`, form, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
      });
      await fetchSellerProducts();
      setEditingProduct(null);
      setEditProductImages([]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Khong luu duoc thay doi.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setSavingEditProduct(false);
    }
  };

  const handleToggleProductStatus = async (p: SellerProduct) => {
    if (!accessToken) return;
    setProductActionId(p.id);
    try {
      await api.patch(
        `/seller/products/${p.id}/status`,
        { status: p.is_active ? 'INACTIVE' : 'ACTIVE' },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchSellerProducts();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Khong doi duoc trang thai.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setProductActionId(null);
    }
  };

  const handleRestockProduct = async () => {
    if (!accessToken || !restockModalVisible) return;
    const delta = Number(restockModalVisible.delta);
    if (!Number.isFinite(delta) || delta === 0) return;
    setRestocking(true);
    try {
      await api.patch(
        `/seller/products/${restockModalVisible.product.id}/restock`,
        { delta },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchSellerProducts();
      setRestockModalVisible(null);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Cap nhat ton kho that bai.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setRestocking(false);
    }
  };

  const handleDeleteProduct = (p: SellerProduct) => {
    if (!accessToken) return;
    Alert.alert(
      'Xoa san pham?',
      `San pham "${p.name}" se bi xoa khoi shop. Hanh dong nay khong the hoan tac.`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa',
          style: 'destructive',
          onPress: async () => {
            setProductActionId(p.id);
            try {
              await api.delete(`/seller/products/${p.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              await fetchSellerProducts();
              await fetchSellerDashboard();
            } catch (err: any) {
              const message = err?.response?.data?.message ?? 'Khong xoa duoc.';
              Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
            } finally {
              setProductActionId(null);
            }
          },
        },
      ],
    );
  };

  const handleCreateVoucher = async () => {
    if (!accessToken || !voucherCode.trim()) return;

    setCreatingVoucher(true);
    try {
      await api.post(
        '/vouchers',
        {
          code: voucherCode.trim().toUpperCase(),
          discount_type: voucherDiscountType,
          discount_value: Number(voucherDiscountValue || 0),
          min_order_value: Number(voucherMinOrderValue || 0),
          max_discount_amount: Number(voucherMaxDiscountAmount || 0),
          valid_from: new Date(`${voucherValidFrom}T00:00:00`).toISOString(),
          valid_to: new Date(`${voucherValidTo}T23:59:59`).toISOString(),
          usage_limit: Number(voucherUsageLimit || 100),
          is_active: true,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      await fetchSellerVouchers();
      setCreateVoucherModalVisible(false);
      setVoucherCode('');
    } catch {
      // no-op
    } finally {
      setCreatingVoucher(false);
    }
  };

  const handleSaveShopProfile = async () => {
    if (!accessToken) return;

    setSavingShopProfile(true);
    try {
      await api.patch(
        '/profile/me',
        {
          phone_number: shopPhoneInput || undefined,
          store_name: shopNameInput || undefined,
          store_address: shopAddressInput || undefined,
          store_description: shopDescriptionInput || undefined,
          shop_google_maps_url: shopMapsUrlInput || undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      await fetchProfile();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Khong luu duoc thay doi.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setSavingShopProfile(false);
    }
  };

  // Lazy-import expo-image-picker so the module isn't loaded on screens that
  // never invoke a picker (cheaper cold-start on profile).
  const pickAndUpload = async (endpoint: '/profile/me/avatar' | '/profile/me/banners') => {
    if (!accessToken) return;
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Can quyen', 'App can quyen truy cap thu vien anh de tai len.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: endpoint === '/profile/me/avatar',
      aspect: endpoint === '/profile/me/avatar' ? [1, 1] : [16, 9],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const isAvatar = endpoint === '/profile/me/avatar';
    if (isAvatar) setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const form = new FormData();
      const mime = asset.mimeType || 'image/jpeg';
      const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
      const name = asset.fileName || `${isAvatar ? 'avatar' : 'banner'}-${Date.now()}.${ext}`;
      form.append('file', { uri: asset.uri, name, type: mime } as any);
      await api.post(endpoint, form, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchProfile();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Tai anh that bai.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      if (isAvatar) setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async (url: string) => {
    if (!accessToken) return;
    setUploadingBanner(true);
    try {
      await api.delete('/profile/me/banners', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { url },
      });
      await fetchProfile();
    } catch {
      // no-op
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSellerOrderAction = async (
    action: 'confirm' | 'ship' | 'confirm-lost' | 'cancel',
    orderId: string,
  ) => {
    if (!accessToken) return;

    setProcessingSellerOrder(true);
    try {
      const path =
        action === 'confirm'
          ? `/orders/${orderId}/confirm`
          : action === 'ship'
            ? `/orders/${orderId}/ship`
            : action === 'confirm-lost'
              ? `/orders/${orderId}/confirm-lost`
              : `/orders/${orderId}/cancel`;

      const body = action === 'cancel' ? { reason: 'Nguoi ban huy don' } : {};

      await api.patch(path, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchOrders();
      setSelectedOrder(null);
    } catch {
      // no-op
    } finally {
      setProcessingSellerOrder(false);
    }
  };

  const handleReplyReview = async () => {
    if (!accessToken || !selectedReview || !replyText.trim()) return;

    setReplyingReview(true);
    try {
      await api.patch(
        `/reviews/${selectedReview.id}/reply`,
        { reply: replyText.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchReviews();
      setReplyModalVisible(false);
      setSelectedReview(null);
      setReplyText('');
    } catch {
      // no-op
    } finally {
      setReplyingReview(false);
    }
  };

  useEffect(() => {
    if (!user || !accessToken) {
      setProfile(null);
      setOrders([]);
      setSavedVouchers([]);
      setReviews([]);
      setSellerProducts([]);
      setSellerDashboard(null);
      setSellerVouchers([]);
      return;
    }

    fetchProfile();
  }, [user, accessToken, fetchProfile]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (activeTab !== 'orders') return;

    fetchOrders();
  }, [activeTab, accessToken, user, fetchOrders]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (activeTab !== 'vouchers') return;

    if (isSeller) {
      fetchSellerVouchers();
    } else {
      fetchVouchers();
    }
  }, [activeTab, accessToken, user, isSeller, fetchVouchers, fetchSellerVouchers]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (activeTab !== 'reviews') return;

    fetchReviews();
  }, [activeTab, accessToken, user, fetchReviews]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (activeTab !== 'products') return;

    fetchSellerProducts();
  }, [activeTab, accessToken, user, fetchSellerProducts]);

  useEffect(() => {
    if (!isSeller && activeTab === 'products') {
      setActiveTab('orders');
    }
    if (!isSeller && (activeTab === 'create' || activeTab === 'shop' || activeTab === 'chat')) {
      setActiveTab('info');
    }
  }, [isSeller, activeTab]);

  useEffect(() => {
    setShopNameInput(profile?.profile?.store_name || '');
    setShopAddressInput(profile?.profile?.address || '');
    setShopDescriptionInput(profile?.profile?.description || '');
    setShopPhoneInput(profile?.phone_number || '');
    setShopMapsUrlInput(profile?.profile?.shop_google_maps_url || '');
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (!user || !accessToken) return;

      fetchProfile();
      if (isSeller) fetchSellerDashboard();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'vouchers') {
        if (isSeller) fetchSellerVouchers();
        else fetchVouchers();
      }
      if (activeTab === 'reviews') fetchReviews();
      if (activeTab === 'products') fetchSellerProducts();
    }, [
      user,
      accessToken,
      isSeller,
      activeTab,
      fetchProfile,
      fetchSellerDashboard,
      fetchOrders,
      fetchVouchers,
      fetchSellerVouchers,
      fetchReviews,
      fetchSellerProducts,
    ]),
  );

  const activeVouchers = useMemo(() => {
    const now = new Date();
    return savedVouchers.filter((sv) => {
      const validTo = sv.voucher?.valid_to ? new Date(sv.voucher.valid_to) : null;
      return !sv.is_used && (!validTo || validTo >= now);
    });
  }, [savedVouchers]);

  // Buyer with PENDING + MOMO + UNPAID can retry payment or fall back to COD.
  // Mirrors web's /profile/orders/[id] page.
  const isAwaitingMomo = useMemo(() => {
    if (!selectedOrder || isSeller) return false;
    if (selectedOrder.status !== 'PENDING') return false;
    if (selectedOrder.payment_method !== 'MOMO') return false;
    const payment = selectedOrder.payments?.[0];
    return payment?.status === 'UNPAID';
  }, [selectedOrder, isSeller]);

  const [retryingMomo, setRetryingMomo] = useState(false);
  const [changingMethod, setChangingMethod] = useState(false);

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (orderStatusFilter !== 'ALL' && order.status !== orderStatusFilter) return false;
      if (!q) return true;
      if (order.id.toLowerCase().includes(q)) return true;
      const buyer = order.buyer?.full_name?.toLowerCase() ?? '';
      const seller = order.seller?.profile?.store_name?.toLowerCase() ?? '';
      if (buyer.includes(q) || seller.includes(q)) return true;
      return order.order_items.some((it) => it.product?.name?.toLowerCase().includes(q));
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const handleRetryMomo = async () => {
    if (!selectedOrder || !accessToken) return;
    setRetryingMomo(true);
    try {
      const res = await api.post(
        '/payments/momo/create',
        { order_id: selectedOrder.id },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const payUrl = res.data?.payUrl || res.data?.deeplink;
      if (payUrl) {
        await Linking.openURL(payUrl);
      } else {
        Alert.alert('Loi', 'Khong nhan duoc URL thanh toan tu MoMo.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Khong tao lai duoc giao dich MoMo.';
      Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setRetryingMomo(false);
    }
  };

  const handleChangeToCod = async () => {
    if (!selectedOrder || !accessToken) return;
    Alert.alert(
      'Doi sang COD?',
      'Don hang se chuyen sang thanh toan khi nhan hang. Khong the hoan tac.',
      [
        { text: 'De sau', style: 'cancel' },
        {
          text: 'Xac nhan',
          style: 'destructive',
          onPress: async () => {
            setChangingMethod(true);
            try {
              await api.patch(
                `/orders/${selectedOrder.id}/change-payment-method`,
                { payment_method: 'COD' },
                { headers: { Authorization: `Bearer ${accessToken}` } },
              );
              await fetchOrders();
            } catch (err: any) {
              const message = err?.response?.data?.message ?? 'Khong doi duoc phuong thuc thanh toan.';
              Alert.alert('Loi', Array.isArray(message) ? message.join(', ') : String(message));
            } finally {
              setChangingMethod(false);
            }
          },
        },
      ],
    );
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !accessToken) return;

    setCancelingOrder(true);
    try {
      await api.patch(
        `/orders/${selectedOrder.id}/cancel-by-buyer`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const updated = await api.get<OrderData[]>('/orders/my-orders', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(Array.isArray(updated.data) ? updated.data : []);
      setSelectedOrder(null);
    } catch {
      // no-op
    } finally {
      setCancelingOrder(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!selectedOrder || !accessToken) return;

    setConfirmingReceived(true);
    try {
      await api.patch(
        `/orders/${selectedOrder.id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchOrders();
      setSelectedOrder(null);
    } catch {
      // no-op
    } finally {
      setConfirmingReceived(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedOrder || !accessToken) return;

    setReportingIssue(true);
    try {
      await api.patch(
        `/orders/${selectedOrder.id}/report-issue`,
        { note: reportIssueNote || undefined },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchOrders();
      setSelectedOrder(null);
      setReportIssueModalVisible(false);
      setReportIssueNote('');
    } catch {
      // no-op
    } finally {
      setReportingIssue(false);
    }
  };

  const handleCreateReview = async () => {
    if (!reviewingOrder || !accessToken || reviewRating === 0) return;

    setCreatingReview(true);
    try {
      await api.post(
        '/reviews',
        {
          order_id: reviewingOrder.id,
          rating: reviewRating,
          comment: reviewComment || undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await fetchReviews();
      await fetchOrders();
      setReviewModalVisible(false);
      setReviewingOrder(null);
      setReviewRating(0);
      setReviewComment('');
    } catch {
      // no-op
    } finally {
      setCreatingReview(false);
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title="Ban can dang nhap"
            description="Dang nhap de xem thong tin ca nhan, don hang va voucher da luu."
          />
          <View className="flex-row gap-2 mt-4 w-full">
            <TouchableOpacity className="flex-1 bg-[#16A34A] rounded-xl py-3 items-center" onPress={() => router.push('/auth/login')}>
              <Text className="text-white font-bold">Dang nhap</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 border border-[#16A34A] rounded-xl py-3 items-center" onPress={() => router.push('/auth/register')}>
              <Text className="text-[#16A34A] font-bold">Dang ky</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (isSeller) {
    return (
      <ScreenContainer>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1660418011914-2bedc50017e2?q=80&w=1600&auto=format&fit=crop' }}
            className="h-56"
          >
            <View className="flex-1 bg-black/45 justify-end px-6 pb-8">
              <Text className="text-white text-4xl font-black">Tai khoan nguoi ban</Text>
              <Text className="text-white/90 mt-2 text-base font-semibold">Ho so ca nhan va thong tin shop</Text>
            </View>
          </ImageBackground>

          <View className="px-4 py-4 bg-[#F1F5F9]">
            <View className="bg-white rounded-2xl border border-slate-100 p-5 mt-1 items-center">
              <View className="w-20 h-20 rounded-full bg-[#06B63E] items-center justify-center overflow-hidden">
                {profile?.avatar ? (
                  <Image source={{ uri: resolveImageUrl(profile.avatar) }} className="w-full h-full" />
                ) : (
                  <Text className="text-white text-4xl font-black">
                    {(profile?.full_name ?? user.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
                  </Text>
                )}
              </View>
              <Text className="text-slate-900 text-3xl font-black mt-4 text-center">{profile?.full_name ?? user.full_name}</Text>
              <Text className="text-slate-400 mt-1">{profile?.email ?? user.email}</Text>
            </View>

            <View className="bg-white rounded-2xl border border-slate-100 p-4 mt-4">
              <Text className="text-slate-900 text-2xl font-black mb-3">Ho so Shop</Text>

              <Text className="text-xs font-bold text-slate-500 mb-1">Ho va ten</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800" value={profile?.full_name ?? user.full_name} editable={false} />

              <Text className="text-xs font-bold text-slate-500 mb-1">Ten gian hang</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800" value={shopNameInput} onChangeText={setShopNameInput} placeholder="Nong trai cua ban" placeholderTextColor="#94A3B8" />

              <Text className="text-xs font-bold text-slate-500 mb-1">Dia chi kho / shop</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800" value={shopAddressInput} onChangeText={setShopAddressInput} placeholder="VD: TP. Da Lat, Lam Dong" placeholderTextColor="#94A3B8" />

              <Text className="text-xs font-bold text-slate-500 mb-1">So dien thoai</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800" value={shopPhoneInput} onChangeText={setShopPhoneInput} keyboardType="phone-pad" placeholder="Nhap so dien thoai" placeholderTextColor="#94A3B8" />

              <Text className="text-xs font-bold text-slate-500 mb-1">Gioi thieu shop</Text>
              <TextInput className="border border-slate-200 rounded-xl px-3 py-3 h-28 text-slate-800" value={shopDescriptionInput} onChangeText={setShopDescriptionInput} placeholder="Mo ta ngan ve shop" placeholderTextColor="#94A3B8" multiline numberOfLines={4} />

              <TouchableOpacity className={`mt-4 rounded-xl py-3 items-center ${savingShopProfile ? 'bg-slate-300' : 'bg-emerald-600'}`} onPress={handleSaveShopProfile} disabled={savingShopProfile}>
                <Text className="text-white font-bold">{savingShopProfile ? 'Dang luu...' : 'Luu thay doi'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-3 rounded-xl px-4 py-3 flex-row items-center justify-center border border-red-200 bg-red-50"
                onPress={() => {
                  logout();
                  router.replace('/auth/login');
                }}
              >
                <FontAwesome name="sign-out" size={16} color="#EF4444" />
                <Text className="ml-2 font-bold text-red-500">Dang xuat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1660418011914-2bedc50017e2?q=80&w=1600&auto=format&fit=crop' }}
          className="h-64"
        >
          <View className="flex-1 bg-black/45 justify-end px-6 pb-8">
            <Text className="text-white text-5xl font-black">Tai khoan cua toi</Text>
            <Text className="text-white/90 mt-2 text-base font-semibold">Quan ly thong tin va don hang cua ban</Text>
          </View>
        </ImageBackground>

        <View className="px-4 py-4 bg-[#F1F5F9]">
          <View className="flex-row items-center">
            <Text className="text-slate-500">Trang chu</Text>
            <Text className="mx-2 text-slate-400">›</Text>
            <Text className="text-slate-900 font-semibold">Tai khoan</Text>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-5 mt-4 items-center">
            <View className="w-20 h-20 rounded-full bg-[#06B63E] items-center justify-center overflow-hidden">
              {profile?.avatar ? (
                <Image source={{ uri: resolveImageUrl(profile.avatar) }} className="w-full h-full" />
              ) : (
                <Text className="text-white text-4xl font-black">
                  {(profile?.full_name ?? user.full_name)?.charAt(0)?.toUpperCase() ?? 'U'}
                </Text>
              )}
            </View>

            <Text className="text-slate-900 text-3xl font-black mt-4 text-center">
              {profile?.full_name ?? user.full_name}
            </Text>
            <Text className="text-slate-400 mt-1">{profile?.email ?? user.email}</Text>

            <View className="mt-3 bg-green-50 border border-green-100 rounded-full px-3 py-1 flex-row items-center">
              <FontAwesome name="shield" size={11} color="#15803D" />
              <Text className="text-green-700 text-xs font-bold ml-1">
                {user.role === 'SELLER' ? 'Nha vuon' : 'Khach hang'}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl border border-slate-100 p-3 mt-4">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                className={`rounded-xl px-4 py-3 flex-row items-center mb-1 ${
                  activeTab === item.key ? 'bg-[#06B63E]' : 'bg-transparent'
                }`}
                onPress={() => setActiveTab(item.key)}
              >
                <FontAwesome
                  name={item.icon}
                  size={16}
                  color={activeTab === item.key ? '#ffffff' : '#6B7280'}
                />
                <Text
                  className={`ml-3 font-bold text-lg ${
                    activeTab === item.key ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </Text>
                {activeTab === item.key ? <FontAwesome name="angle-right" size={16} color="#fff" style={{ marginLeft: 'auto' }} /> : null}
              </TouchableOpacity>
            ))}

            <View className="h-px bg-slate-100 my-2" />

            {!isSeller ? (
              <TouchableOpacity
                className="rounded-xl px-4 py-3 flex-row items-center"
                onPress={() => router.push('/become-seller')}
              >
                <FontAwesome name="shopping-cart" size={16} color="#16A34A" />
                <Text className="ml-3 font-bold text-lg text-emerald-700">Tro thanh nha ban hang</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              className="rounded-xl px-4 py-3 flex-row items-center"
              onPress={() => router.push('/about')}
            >
              <FontAwesome name="info-circle" size={16} color="#2563EB" />
              <Text className="ml-3 font-bold text-lg text-blue-600">Thong tin & ho tro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-xl px-4 py-3 flex-row items-center"
              onPress={() => {
                logout();
                router.replace('/auth/login');
              }}
            >
              <FontAwesome name="sign-out" size={16} color="#EF4444" />
              <Text className="ml-3 font-bold text-lg text-red-500">Dang xuat</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'info' ? (
            <View className="bg-white rounded-2xl border border-slate-100 mt-4 overflow-hidden">
              <View className="px-5 py-4 border-b border-slate-100 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">{isSeller ? 'Tong quan kinh doanh' : 'Ho so ca nhan'}</Text>
                  <Text className="text-slate-400 mt-1">{isSeller ? 'Day la tinh hinh kinh doanh cua gian hang.' : 'Thong tin tai khoan cua ban'}</Text>
                </View>
                {loadingProfile || loadingSellerDashboard ? <ActivityIndicator size="small" color="#16A34A" /> : null}
              </View>

              <View className="p-5 gap-4">
                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">Ho va ten</Text>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Text className="font-semibold text-slate-800">{profile?.full_name ?? user.full_name}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">Email</Text>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Text className="font-semibold text-slate-800">{profile?.email ?? user.email}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">So dien thoai</Text>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Text className="font-semibold text-slate-800">{profile?.phone_number || 'Chua cap nhat'}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">Vai tro</Text>
                  <View className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Text className="font-semibold text-slate-800">{user.role === 'SELLER' ? 'Nha vuon' : 'Khach hang'}</Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mt-1">
                  <View className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-3">
                    <Text className="text-xs font-semibold text-emerald-700">{isSeller ? 'Doanh thu' : 'San pham trong gio'}</Text>
                    <Text className="text-2xl font-black text-emerald-800 mt-1">
                      {isSeller ? formatPrice(Number(sellerDashboard?.totalRevenue || 0)) : totalItems}
                    </Text>
                  </View>
                  <View className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3">
                    <Text className="text-xs font-semibold text-blue-700">{isSeller ? 'Don hang shop' : 'Tong don hang'}</Text>
                    <Text className="text-2xl font-black text-blue-800 mt-1">
                      {isSeller ? Number(sellerDashboard?.totalOrders || 0) : orders.length}
                    </Text>
                  </View>
                </View>

                {isSeller ? (
                  <View className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-3">
                    <Text className="text-xs font-semibold text-amber-700">San pham dang kinh doanh</Text>
                    <Text className="text-2xl font-black text-amber-800 mt-1">{Number(sellerDashboard?.activeProducts || 0)}</Text>
                  </View>
                ) : null}

                {isSeller && sellerDashboard?.revenueByMonth && sellerDashboard.revenueByMonth.length > 0 ? (
                  <View className="mt-3 bg-white border border-slate-100 rounded-xl p-3">
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Doanh thu 12 thang gan day</Text>
                    <RevenueBarChart data={sellerDashboard.revenueByMonth} width={320} />
                  </View>
                ) : null}

                {isSeller && sellerDashboard?.top3BestSelling && sellerDashboard.top3BestSelling.length > 0 ? (
                  <View className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <Text className="text-xs font-bold text-emerald-700 uppercase mb-2">Top 3 ban chay</Text>
                    {sellerDashboard.top3BestSelling.map((p, idx) => (
                      <View key={p.id} className="flex-row items-center py-1.5">
                        <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                          <Text className="text-white text-xs font-black">{idx + 1}</Text>
                        </View>
                        <Text className="ml-2 flex-1 text-slate-800 font-semibold" numberOfLines={1}>{p.name}</Text>
                        <Text className="text-xs text-emerald-700 font-bold">{p.sold} ban</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {isSeller && sellerDashboard?.top3NeedImprovement && sellerDashboard.top3NeedImprovement.length > 0 ? (
                  <View className="mt-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
                    <Text className="text-xs font-bold text-rose-700 uppercase mb-2">Top 3 can cai thien</Text>
                    {sellerDashboard.top3NeedImprovement.map((p, idx) => (
                      <View key={p.id} className="flex-row items-center py-1.5">
                        <View className="w-6 h-6 rounded-full bg-rose-500 items-center justify-center">
                          <Text className="text-white text-xs font-black">{idx + 1}</Text>
                        </View>
                        <Text className="ml-2 flex-1 text-slate-800 font-semibold" numberOfLines={1}>{p.name}</Text>
                        <Text className="text-xs text-rose-600 font-bold">
                          {p.avgRating !== null ? `${p.avgRating}★` : `${p.sold} ban`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {activeTab === 'orders' ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">Lich su don hang</Text>
                  <Text className="text-slate-400 mt-1">
                    {orders.length > 0
                      ? `${filteredOrders.length}/${orders.length} don hang`
                      : isSeller
                        ? 'Theo doi don hang tu khach mua'
                        : 'Theo doi trang thai don hang'}
                  </Text>
                </View>
                <FontAwesome name="cube" size={18} color="#94A3B8" />
              </View>

              {orders.length > 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 p-3 mb-3">
                  <View className="flex-row items-center border border-slate-200 rounded-xl px-3 py-2 mb-2">
                    <FontAwesome name="search" size={13} color="#94A3B8" />
                    <TextInput
                      className="ml-2 flex-1 text-slate-800"
                      value={orderSearchQuery}
                      onChangeText={setOrderSearchQuery}
                      placeholder={isSeller ? 'Tim theo ma don / khach / san pham' : 'Tim theo ma don / shop / san pham'}
                      placeholderTextColor="#94A3B8"
                    />
                    {orderSearchQuery.length > 0 ? (
                      <TouchableOpacity onPress={() => setOrderSearchQuery('')}>
                        <FontAwesome name="times-circle" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {[
                        { id: 'ALL', label: 'Tat ca' },
                        { id: 'PENDING', label: 'Cho xac nhan' },
                        { id: 'CONFIRMED', label: 'Cho van chuyen' },
                        { id: 'SHIPPING', label: 'Dang giao' },
                        { id: 'COMPLETED', label: 'Hoan thanh' },
                        { id: 'CANCELLED', label: 'Da huy' },
                        { id: 'ISSUE_REPORTED', label: 'Su co' },
                      ].map((f) => {
                        const active = orderStatusFilter === f.id;
                        return (
                          <TouchableOpacity
                            key={f.id}
                            onPress={() => setOrderStatusFilter(f.id)}
                            className={`px-3 py-1.5 rounded-full border ${active ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                          >
                            <Text className={`text-xs font-bold ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {f.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              {loadingOrders ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : null}

              {!loadingOrders && orders.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                  <FontAwesome name="shopping-bag" size={44} color="#CBD5E1" />
                  <Text className="text-slate-700 font-bold text-lg mt-4">Chua co don hang nao</Text>
                  {!isSeller ? (
                    <TouchableOpacity
                      className="mt-5 bg-[#16A34A] rounded-xl px-5 py-3"
                      onPress={() => router.push('/(tabs)/search')}
                    >
                      <Text className="text-white font-bold">Mua sam ngay</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {!loadingOrders && orders.length > 0 && filteredOrders.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-10 px-5 items-center">
                  <FontAwesome name="filter" size={32} color="#CBD5E1" />
                  <Text className="text-slate-600 font-bold mt-3">Khong co don phu hop bo loc.</Text>
                  <TouchableOpacity
                    className="mt-3 px-4 py-2 rounded-lg border border-slate-300"
                    onPress={() => { setOrderStatusFilter('ALL'); setOrderSearchQuery(''); }}
                  >
                    <Text className="text-slate-700 font-semibold text-xs">Xoa bo loc</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!loadingOrders && filteredOrders.length > 0
                ? filteredOrders.map((order) => {
                    const status = getOrderStatusUi(order.status);
                    const partnerName = isSeller
                      ? order.buyer?.full_name || 'Khach hang'
                      : order.seller?.profile?.store_name || order.seller?.full_name || 'Agri Shop';

                    return (
                      <View key={order.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
                        <View className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-row items-center justify-between">
                          <Text className="text-xs font-black text-white bg-[#0F172A] px-2 py-1 rounded-md">#{order.id.slice(-8).toUpperCase()}</Text>
                          <View className={`px-2 py-1 rounded-full flex-row items-center ${status.bg}`}>
                            <FontAwesome name={status.icon} size={11} color="#475569" />
                            <Text className={`ml-1 text-xs font-bold ${status.text}`}>{status.label}</Text>
                          </View>
                        </View>

                        <View className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <FontAwesome name={isSeller ? 'user-o' : 'home'} size={12} color="#16A34A" />
                            <Text className="ml-2 text-slate-700 font-semibold">{partnerName}</Text>
                          </View>
                          <Text className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                          </Text>
                        </View>

                        <View className="px-4 py-3">
                          {order.order_items.slice(0, 2).map((item) => (
                            <View key={item.id} className="flex-row items-center mb-3">
                              <Image
                                source={{ uri: resolveImageUrl(item.product?.images?.[0]) }}
                                className="w-12 h-12 rounded-lg"
                              />
                              <View className="ml-3 flex-1">
                                <Text className="font-semibold text-slate-800" numberOfLines={1}>
                                  {item.product?.name}
                                </Text>
                                <Text className="text-xs text-slate-400">x{item.quantity}</Text>
                              </View>
                              <Text className="font-bold text-[#16A34A]">
                                {formatPrice(Number(item.negotiated_price) * Number(item.quantity))}
                              </Text>
                            </View>
                          ))}
                          {order.order_items.length > 2 ? (
                            <Text className="text-xs text-slate-400">
                              +{order.order_items.length - 2} san pham khac
                            </Text>
                          ) : null}
                        </View>

                        <View className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex-row items-center justify-between">
                          <View>
                            <Text className="text-xs text-slate-400">Tong thanh toan</Text>
                            <Text className="text-[#16A34A] font-black text-2xl">{formatPrice(Number(order.final_total_price))}</Text>
                          </View>
                          <TouchableOpacity
                            className="bg-[#0F172A] rounded-xl px-4 py-2.5"
                            onPress={() => setSelectedOrder(order)}
                          >
                            <Text className="text-white font-bold text-xs">Xem chi tiet</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                : null}
            </View>
          ) : null}

          {activeTab === 'products' && isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">San pham cua toi</Text>
                  <Text className="text-slate-400 mt-1">{sellerProducts.length > 0 ? `${sellerProducts.length} san pham` : 'Quan ly danh muc san pham dang ban'}</Text>
                </View>
                <TouchableOpacity
                  className="bg-emerald-600 rounded-xl px-4 py-2"
                  onPress={() => setActiveTab('create')}
                >
                  <Text className="text-white font-bold text-xs">Tao san pham</Text>
                </TouchableOpacity>
              </View>

              {loadingProducts ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : null}

              {!loadingProducts && sellerProducts.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                  <FontAwesome name="leaf" size={44} color="#CBD5E1" />
                  <Text className="text-slate-700 font-bold text-lg mt-4">Ban chua co san pham nao</Text>
                  <TouchableOpacity
                    className="mt-5 bg-[#16A34A] rounded-xl px-5 py-3"
                    onPress={() => setActiveTab('create')}
                  >
                    <Text className="text-white font-bold">Tao san pham dau tien</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!loadingProducts && sellerProducts.length > 0
                ? sellerProducts.map((p) => (
                    <View key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
                      <View className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-row items-center justify-between">
                        <Text className="font-bold text-slate-900 flex-1" numberOfLines={1}>{p.name}</Text>
                        <View className={`px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                          <Text className={`text-xs font-bold ${p.is_active ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {p.is_active ? 'Dang ban' : 'Tam dung'}
                          </Text>
                        </View>
                      </View>
                      <View className="px-4 py-3 flex-row">
                        {p.images?.[0] ? (
                          <Image source={{ uri: resolveImageUrl(p.images[0]) }} className="w-16 h-16 rounded-xl mr-3 bg-slate-100" />
                        ) : (
                          <View className="w-16 h-16 rounded-xl bg-slate-100 mr-3 items-center justify-center">
                            <FontAwesome name="leaf" size={20} color="#94A3B8" />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-xs text-slate-500">Gia ban</Text>
                          <Text className="text-[#16A34A] font-black text-xl">{formatPrice(Number(p.price || 0))}</Text>
                          <View className="flex-row items-center justify-between mt-1">
                            <Text className="text-xs text-slate-500">Ton: {Number(p.stock || 0)} {p.unit || 'kg'}</Text>
                            <Text className="text-xs text-slate-500">Da ban: {Number(p.sold || 0)}</Text>
                          </View>
                        </View>
                      </View>

                      <View className="px-3 py-2 border-t border-slate-100 flex-row gap-2 flex-wrap">
                        <TouchableOpacity
                          className="px-3 py-2 rounded-lg border border-blue-300 bg-blue-50"
                          onPress={() => { setEditingProduct({ ...p }); setEditProductImages([]); }}
                          disabled={productActionId === p.id}
                        >
                          <Text className="text-blue-700 text-xs font-bold">Sua</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50"
                          onPress={() => setRestockModalVisible({ product: p, delta: '' })}
                          disabled={productActionId === p.id}
                        >
                          <Text className="text-amber-700 text-xs font-bold">Nhap kho</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className={`px-3 py-2 rounded-lg border ${p.is_active ? 'border-slate-300 bg-slate-50' : 'border-emerald-300 bg-emerald-50'}`}
                          onPress={() => handleToggleProductStatus(p)}
                          disabled={productActionId === p.id}
                        >
                          <Text className={`text-xs font-bold ${p.is_active ? 'text-slate-700' : 'text-emerald-700'}`}>
                            {p.is_active ? 'Tam dung' : 'Kich hoat'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="px-3 py-2 rounded-lg border border-red-300 bg-red-50 ml-auto"
                          onPress={() => handleDeleteProduct(p)}
                          disabled={productActionId === p.id}
                        >
                          <Text className="text-red-600 text-xs font-bold">Xoa</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                : null}
            </View>
          ) : null}

          {activeTab === 'create' && isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3">
                <Text className="text-slate-900 text-3xl font-black">Them san pham moi</Text>
                <Text className="text-slate-400 mt-1">Dien thong tin de tao san pham cho cua hang</Text>
              </View>

              <View className="bg-white rounded-2xl border border-slate-100 p-4">
                <Text className="text-xs font-bold text-slate-500 mb-1">Ten san pham *</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                  value={newProductName}
                  onChangeText={setNewProductName}
                  placeholder="VD: Dau tay Da Lat loai 1"
                  placeholderTextColor="#94A3B8"
                />

                <Text className="text-xs font-bold text-slate-500 mb-1">Mo ta</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 h-24 text-slate-800"
                  value={newProductDescription}
                  onChangeText={setNewProductDescription}
                  placeholder="Mo ta ngan ve san pham"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1">Gia ban *</Text>
                    <TextInput
                      className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                      value={newProductPrice}
                      onChangeText={setNewProductPrice}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1">Ton kho *</Text>
                    <TextInput
                      className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                      value={newProductStock}
                      onChangeText={setNewProductStock}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1">Don vi</Text>
                    <TextInput
                      className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                      value={newProductUnit}
                      onChangeText={setNewProductUnit}
                      placeholder="kg"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-500 mb-1">Danh muc</Text>
                    <TextInput
                      className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                      value={newProductCategory}
                      onChangeText={setNewProductCategory}
                      placeholder="trai-cay | rau-cu | ngu-coc | gia-vi | khac"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <Text className="text-xs font-bold text-slate-500 mb-1">Xuat xu</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-4 text-slate-800"
                  value={newProductOrigin}
                  onChangeText={setNewProductOrigin}
                  placeholder="VD: Da Lat"
                  placeholderTextColor="#94A3B8"
                />

                <Text className="text-xs font-bold text-slate-500 mb-2">Anh san pham (toi da 5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  <View className="flex-row gap-2">
                    {newProductImages.map((img, idx) => (
                      <View key={`${img.uri}-${idx}`} className="relative">
                        <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-xl bg-slate-100" />
                        <TouchableOpacity
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                          onPress={() => setNewProductImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <FontAwesome name="times" size={11} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {newProductImages.length < 5 ? (
                      <TouchableOpacity
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 items-center justify-center bg-slate-50"
                        onPress={() => void pickProductImages('create')}
                      >
                        <FontAwesome name="camera" size={18} color="#94A3B8" />
                        <Text className="text-[10px] text-slate-500 mt-1">Them anh</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  className={`rounded-xl py-3 items-center ${creatingProduct || !newProductName.trim() || !newProductPrice.trim() || !newProductStock.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`}
                  onPress={handleCreateProduct}
                  disabled={creatingProduct || !newProductName.trim() || !newProductPrice.trim() || !newProductStock.trim()}
                >
                  <Text className="text-white font-bold">{creatingProduct ? 'Dang tao...' : 'Luu san pham'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {activeTab === 'vouchers' && isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">Ma giam gia</Text>
                  <Text className="text-slate-400 mt-1">Tao va quan ly voucher cho shop cua ban</Text>
                </View>
                <TouchableOpacity
                  className="bg-emerald-600 rounded-xl px-4 py-2"
                  onPress={() => setCreateVoucherModalVisible(true)}
                >
                  <Text className="text-white font-bold text-xs">Tao voucher moi</Text>
                </TouchableOpacity>
              </View>

              {loadingSellerVouchers ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : null}

              {!loadingSellerVouchers && sellerVouchers.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                  <FontAwesome name="ticket" size={44} color="#CBD5E1" />
                  <Text className="text-slate-700 font-bold text-lg mt-4">Chua co ma giam gia nao</Text>
                  <TouchableOpacity
                    className="mt-5 bg-[#16A34A] rounded-xl px-5 py-3"
                    onPress={() => setCreateVoucherModalVisible(true)}
                  >
                    <Text className="text-white font-bold">Tao ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!loadingSellerVouchers && sellerVouchers.length > 0
                ? sellerVouchers.map((v) => (
                    <View key={v.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-3">
                      <View className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-row items-center justify-between">
                        <Text className="text-slate-900 font-black tracking-wide">{v.code}</Text>
                        <Text className={`text-xs font-bold ${v.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {v.is_active ? 'Dang hoat dong' : 'Da tat'}
                        </Text>
                      </View>
                      <View className="px-4 py-3">
                        <Text className="text-slate-700 font-semibold">
                          {v.discount_type === 'PERCENT'
                            ? `Giam ${v.discount_value}% (toi da ${formatPrice(Number(v.max_discount_amount || 0))})`
                            : `Giam ${formatPrice(Number(v.discount_value || 0))}`}
                        </Text>
                        <Text className="text-xs text-slate-500 mt-1">Don toi thieu: {formatPrice(Number(v.min_order_value || 0))}</Text>
                        <Text className="text-xs text-slate-500 mt-1">Da dung: {Number(v.used_count || 0)} / {Number(v.usage_limit || 0)}</Text>
                      </View>
                    </View>
                  ))
                : null}
            </View>
          ) : null}

          {activeTab === 'vouchers' && !isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">Vi Voucher</Text>
                  <Text className="text-slate-400 mt-1">
                    {savedVouchers.length > 0
                      ? `${activeVouchers.length} voucher co the dung`
                      : 'Ma giam gia ban da luu'}
                  </Text>
                </View>
                <FontAwesome name="ticket" size={18} color="#F59E0B" />
              </View>

              {loadingVouchers ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : null}

              {!loadingVouchers && savedVouchers.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                  <FontAwesome name="ticket" size={44} color="#CBD5E1" />
                  <Text className="text-slate-700 font-bold text-lg mt-4">Chua co voucher nao</Text>
                  <Text className="text-slate-400 mt-1 text-center">Ghe tham cac shop de luu ma giam gia nhe!</Text>
                  <TouchableOpacity
                    className="mt-5 bg-[#16A34A] rounded-xl px-5 py-3"
                    onPress={() => router.push('/(tabs)/search')}
                  >
                    <Text className="text-white font-bold">Kham pha shop ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!loadingVouchers && savedVouchers.length > 0
                ? savedVouchers.map((sv) => {
                    const v = sv.voucher;
                    if (!v) return null;

                    const expired = v.valid_to ? new Date(v.valid_to) < new Date() : false;
                    const canUse = !sv.is_used && !expired;
                    const shopName = v.seller?.profile?.store_name || 'Shop';

                    return (
                      <View
                        key={sv.id}
                        className={`rounded-2xl border mb-3 overflow-hidden ${
                          canUse ? 'bg-white border-orange-200' : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <View className={`px-4 py-3 ${canUse ? 'bg-orange-500' : 'bg-slate-400'}`}>
                          <Text className="text-white font-black text-xl tracking-widest">{v.code}</Text>
                        </View>

                        <View className="p-4">
                          <Text className="font-bold text-slate-900">
                            {v.discount_type === 'PERCENT'
                              ? `Giam ${v.discount_value}%`
                              : `Giam ${formatPrice(Number(v.discount_value))}`}
                          </Text>
                          <Text className="text-slate-500 text-xs mt-1">
                            Don toi thieu {formatPrice(Number(v.min_order_value))}
                          </Text>
                          <Text className="text-slate-500 text-xs mt-1">Ap dung tai: {shopName}</Text>
                          <Text className="text-xs mt-2 font-semibold">
                            {sv.is_used ? 'Da dung' : expired ? 'Da het han' : 'Con hieu luc'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                : null}
            </View>
          ) : null}

          {activeTab === 'reviews' ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">{isSeller ? 'Danh gia cua khach' : 'Danh gia cua toi'}</Text>
                  <Text className="text-slate-400 mt-1">
                    {reviews.length > 0
                      ? `${reviews.length} danh gia`
                      : isSeller
                        ? 'Xem nhan xet tu khach hang'
                        : 'Xem lai tat ca danh gia da viet'}
                  </Text>
                </View>
                <FontAwesome name="star-o" size={18} color="#94A3B8" />
              </View>

              {loadingReviews ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 items-center">
                  <ActivityIndicator size="large" color="#16A34A" />
                </View>
              ) : null}

              {!loadingReviews && reviews.length === 0 ? (
                <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                  <FontAwesome name="star-o" size={44} color="#CBD5E1" />
                  <Text className="text-slate-700 font-bold text-lg mt-4">Chua co danh gia nao</Text>
                  <Text className="text-slate-400 mt-1 text-center">
                    {isSeller ? 'Chua co nhan xet nao tu khach hang.' : 'Hay mua hang va chia se trai nghiem cua ban!'}
                  </Text>
                </View>
              ) : null}

              {!loadingReviews && reviews.length > 0
                ? reviews.map((review) => (
                    <View key={review.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                      <View className="flex-row items-center mb-3">
                        <Image
                          source={{ uri: resolveImageUrl(review.products?.[0]?.images?.[0]) }}
                          className="w-12 h-12 rounded-lg"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-bold text-slate-800" numberOfLines={1}>
                            {review.products?.[0]?.name || 'San pham'}
                          </Text>
                          <Text className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </Text>
                          {isSeller ? (
                            <Text className="text-xs text-emerald-700 mt-1 font-semibold">
                              Khach: {review.buyer?.full_name || 'An danh'}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View className="flex-row items-center mb-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <FontAwesome
                            key={`${review.id}-${index}`}
                            name={index < review.rating ? 'star' : 'star-o'}
                            size={15}
                            color={index < review.rating ? '#F59E0B' : '#CBD5E1'}
                            style={{ marginRight: 3 }}
                          />
                        ))}
                      </View>

                      {review.comment ? (
                        <Text className="text-slate-600 italic">"{review.comment}"</Text>
                      ) : null}

                      {review.seller_reply ? (
                        <View className="mt-3 bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400">
                          <Text className="text-xs font-bold text-blue-700">Phan hoi tu cua hang</Text>
                          <Text className="text-xs text-slate-700 mt-1">{review.seller_reply}</Text>
                        </View>
                      ) : null}

                      {isSeller && !review.seller_reply ? (
                        <TouchableOpacity
                          className="mt-3 rounded-xl py-2.5 items-center border border-emerald-200 bg-emerald-50"
                          onPress={() => {
                            setSelectedReview(review);
                            setReplyModalVisible(true);
                          }}
                        >
                          <Text className="text-emerald-700 font-bold">Phan hoi danh gia</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
          ) : null}

          {activeTab === 'shop' && isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-900 text-3xl font-black">Ho so Shop</Text>
                  <Text className="text-slate-400 mt-1">Cap nhat thong tin hien thi cua gian hang</Text>
                </View>
                <TouchableOpacity
                  className={`rounded-xl px-4 py-2 ${savingShopProfile ? 'bg-slate-300' : 'bg-emerald-600'}`}
                  onPress={handleSaveShopProfile}
                  disabled={savingShopProfile}
                >
                  <Text className="text-white font-bold text-xs">{savingShopProfile ? 'Dang luu...' : 'Luu thay doi'}</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                <Text className="text-xs font-bold text-slate-500 mb-2">Anh dai dien shop</Text>
                <View className="flex-row items-center">
                  <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center overflow-hidden">
                    {profile?.avatar ? (
                      <Image source={{ uri: resolveImageUrl(profile.avatar) }} className="w-full h-full" />
                    ) : (
                      <FontAwesome name="user" size={28} color="#94A3B8" />
                    )}
                  </View>
                  <TouchableOpacity
                    className={`ml-4 px-4 py-2 rounded-xl ${uploadingAvatar ? 'bg-slate-300' : 'bg-emerald-600'}`}
                    onPress={() => void pickAndUpload('/profile/me/avatar')}
                    disabled={uploadingAvatar}
                  >
                    <Text className="text-white font-bold text-xs">{uploadingAvatar ? 'Dang tai...' : 'Doi avatar'}</Text>
                  </TouchableOpacity>
                </View>

                <View className="h-px bg-slate-100 my-4" />

                <Text className="text-xs font-bold text-slate-500 mb-2">Banner gian hang (toi da 3 anh)</Text>
                {profile?.profile?.banners1 && profile.profile.banners1.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    <View className="flex-row gap-2">
                      {profile.profile.banners1.map((b) => (
                        <View key={b} className="relative">
                          <Image source={{ uri: resolveImageUrl(b) }} className="w-40 h-24 rounded-xl bg-slate-100" />
                          <TouchableOpacity
                            className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                            onPress={() => void handleRemoveBanner(b)}
                          >
                            <FontAwesome name="trash" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <Text className="text-xs text-slate-400 mb-2">Chua co banner nao.</Text>
                )}

                <TouchableOpacity
                  className={`rounded-xl py-2.5 items-center border border-dashed ${uploadingBanner ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-300'} ${(profile?.profile?.banners1?.length ?? 0) >= 3 ? 'opacity-50' : ''}`}
                  onPress={() => void pickAndUpload('/profile/me/banners')}
                  disabled={uploadingBanner || (profile?.profile?.banners1?.length ?? 0) >= 3}
                >
                  <Text className="text-emerald-700 font-bold text-xs">
                    {uploadingBanner ? 'Dang tai...' : (profile?.profile?.banners1?.length ?? 0) >= 3 ? 'Da dat gioi han 3 banner' : '+ Them banner moi'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-2xl border border-slate-100 p-4">
                <Text className="text-xs font-bold text-slate-500 mb-1">Ten gian hang</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                  value={shopNameInput}
                  onChangeText={setShopNameInput}
                  placeholder="Nong trai cua ban"
                  placeholderTextColor="#94A3B8"
                />

                <Text className="text-xs font-bold text-slate-500 mb-1">Dia chi kho / shop</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                  value={shopAddressInput}
                  onChangeText={setShopAddressInput}
                  placeholder="VD: TP. Da Lat, Lam Dong"
                  placeholderTextColor="#94A3B8"
                />

                <Text className="text-xs font-bold text-slate-500 mb-1">Link Google Maps (tuy chon)</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                  value={shopMapsUrlInput}
                  onChangeText={setShopMapsUrlInput}
                  placeholder="https://www.google.com/maps/... hoac https://maps.app.goo.gl/..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text className="text-xs font-bold text-slate-500 mb-1">So dien thoai lien he</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                  value={shopPhoneInput}
                  onChangeText={setShopPhoneInput}
                  keyboardType="phone-pad"
                  placeholder="Nhap so dien thoai"
                  placeholderTextColor="#94A3B8"
                />

                <Text className="text-xs font-bold text-slate-500 mb-1">Gioi thieu shop</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 h-28 text-slate-800"
                  value={shopDescriptionInput}
                  onChangeText={setShopDescriptionInput}
                  placeholder="Mo ta ngan ve shop"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          ) : null}

          {activeTab === 'chat' && isSeller ? (
            <View className="mt-4">
              <View className="bg-white rounded-2xl border border-slate-100 py-14 px-5 items-center">
                <FontAwesome name="comment-o" size={44} color="#CBD5E1" />
                <Text className="text-slate-700 font-bold text-lg mt-4">Chat cua shop</Text>
                <Text className="text-slate-400 mt-1 text-center">Tinh nang chat seller se ket noi voi module chat hien co.</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedOrder(null)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-slate-900 text-xl font-black">Chi tiet don hang</Text>
                <Text className="text-slate-400 text-xs">#{selectedOrder?.id.slice(-8).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <FontAwesome name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-slate-50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between">
                  {[
                    { label: 'Dat hang', icon: 'check-square-o' as const },
                    { label: 'Xac nhan', icon: 'check-circle-o' as const },
                    { label: 'Dang giao', icon: 'truck' as const },
                    { label: 'Hoan thanh', icon: 'check-circle' as const },
                  ].map((step, index, arr) => {
                    const currentStep = getTimelineStepIndex(selectedOrder?.status || 'PENDING');
                    const done = index <= currentStep;
                    const lineDone = index < currentStep;

                    return (
                      <View key={step.label} className="flex-1 flex-row items-center">
                        <View className="items-center">
                          <View className={`w-8 h-8 rounded-full items-center justify-center ${done ? 'bg-green-100' : 'bg-slate-200'}`}>
                            <FontAwesome name={step.icon} size={13} color={done ? '#16A34A' : '#94A3B8'} />
                          </View>
                          <Text className={`text-[10px] mt-1 font-semibold ${done ? 'text-green-700' : 'text-slate-400'}`}>
                            {step.label}
                          </Text>
                        </View>
                        {index < arr.length - 1 ? (
                          <View className={`h-0.5 flex-1 mx-1 mb-4 ${lineDone ? 'bg-green-500' : 'bg-slate-200'}`} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <Text className="text-[10px] text-amber-700 font-bold uppercase">Trang thai</Text>
                  <Text className="text-xs text-amber-900 font-semibold mt-1">{getOrderStatusUi(selectedOrder?.status || '').label}</Text>
                </View>
                <View className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <Text className="text-[10px] text-blue-700 font-bold uppercase">Thanh toan</Text>
                  <Text className="text-xs text-blue-900 font-semibold mt-1">{getPaymentStatusText(selectedOrder)}</Text>
                </View>
              </View>

              <View className="bg-slate-50 rounded-xl p-3 mb-3">
                <Text className="text-xs text-slate-400">Dia chi giao hang</Text>
                <Text className="text-sm text-slate-800 mt-1">{selectedOrder?.shipping_address || 'Dang cap nhat'}</Text>
              </View>

              {isSeller ? (
                <View className="bg-emerald-50 rounded-xl p-3 mb-3 border border-emerald-100">
                  <Text className="text-xs text-emerald-700 font-bold">Thong tin khach mua</Text>
                  <Text className="text-sm text-slate-800 mt-1">{selectedOrder?.buyer?.full_name || 'Khach hang'}</Text>
                  {selectedOrder?.buyer?.phone_number ? (
                    <Text className="text-xs text-slate-600 mt-1">SDT: {selectedOrder.buyer.phone_number}</Text>
                  ) : null}
                  {selectedOrder?.buyer?.email ? (
                    <Text className="text-xs text-slate-600 mt-1">Email: {selectedOrder.buyer.email}</Text>
                  ) : null}
                </View>
              ) : null}

              {selectedOrder?.order_items.map((item) => (
                <View key={item.id} className="flex-row items-center mb-3 border border-slate-100 rounded-xl p-2">
                  <Image
                    source={{ uri: resolveImageUrl(item.product?.images?.[0]) }}
                    className="w-14 h-14 rounded-lg"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-slate-800" numberOfLines={2}>{item.product?.name}</Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      {item.product?.unit || 'kg'} x {item.quantity}
                    </Text>
                  </View>
                  <Text className="font-black text-[#16A34A]">
                    {formatPrice(Number(item.negotiated_price) * Number(item.quantity))}
                  </Text>
                </View>
              ))}

              <View className="bg-[#0F172A] rounded-xl p-4 mt-2 mb-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-white/70 text-xs">Tong thanh toan</Text>
                  <Text className="text-[#00E676] text-3xl font-black mt-1">
                    {formatPrice(Number(selectedOrder?.final_total_price || 0))}
                  </Text>
                </View>
                <Text className="text-white/80 text-xs text-right">
                  {selectedOrder?.order_items.length || 0} san pham
                </Text>
              </View>

              {isAwaitingMomo ? (
                <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                  <View className="flex-row items-start mb-2">
                    <FontAwesome name="exclamation-circle" size={16} color="#D97706" />
                    <View className="ml-2 flex-1">
                      <Text className="text-amber-900 font-bold text-sm">Don dang cho thanh toan</Text>
                      <Text className="text-amber-700 text-xs mt-1">
                        Ban da chon MoMo nhung giao dich chua hoan tat. Bam "Thanh toan" de thu lai,
                        hoac doi sang COD. Don se tu huy sau 24h.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2 mt-1">
                    <TouchableOpacity
                      className={`flex-1 rounded-xl py-3 items-center ${retryingMomo ? 'bg-slate-300' : 'bg-pink-600'}`}
                      onPress={handleRetryMomo}
                      disabled={retryingMomo || changingMethod}
                    >
                      <Text className="text-white font-bold text-xs">
                        {retryingMomo ? 'Dang mo MoMo...' : 'Thanh toan'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 rounded-xl py-3 items-center border ${changingMethod ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-300'}`}
                      onPress={handleChangeToCod}
                      disabled={retryingMomo || changingMethod}
                    >
                      <Text className={`font-bold text-xs ${changingMethod ? 'text-slate-500' : 'text-slate-700'}`}>
                        {changingMethod ? 'Dang doi...' : 'Doi sang COD'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {!isSeller && selectedOrder?.status === 'PENDING' ? (
                <TouchableOpacity
                  className={`rounded-xl py-3 items-center border ${cancelingOrder ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`}
                  onPress={handleCancelOrder}
                  disabled={cancelingOrder}
                >
                  <Text className={`font-bold ${cancelingOrder ? 'text-slate-500' : 'text-red-500'}`}>
                    {cancelingOrder ? 'Dang huy don...' : 'Huy don hang'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {!isSeller && selectedOrder?.status === 'SHIPPING' ? (
                <View className="flex-col gap-2">
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center ${confirmingReceived ? 'bg-slate-300' : 'bg-[#16A34A]'}`}
                    onPress={handleConfirmReceived}
                    disabled={confirmingReceived}
                  >
                    <Text className="text-white font-bold">
                      {confirmingReceived ? 'Dang xac nhan...' : 'Xac nhan da nhan hang'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center border ${reportingIssue ? 'bg-slate-100 border-slate-200' : 'bg-orange-50 border-orange-200'}`}
                    onPress={() => setReportIssueModalVisible(true)}
                    disabled={reportingIssue}
                  >
                    <Text className={`font-bold ${reportingIssue ? 'text-slate-500' : 'text-orange-600'}`}>
                      {reportingIssue ? 'Dang bao cao...' : 'Chua nhan duoc hang: Bao cao su co'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {!isSeller && selectedOrder?.status === 'COMPLETED' ? (
                <TouchableOpacity
                  className={`rounded-xl py-3 items-center ${creatingReview ? 'bg-slate-300' : 'bg-blue-500'}`}
                  onPress={() => {
                    setReviewingOrder(selectedOrder);
                    setReviewModalVisible(true);
                  }}
                  disabled={creatingReview}
                >
                  <Text className="text-white font-bold">
                    {creatingReview ? 'Dang gui danh gia...' : 'Danh gia'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {isSeller && selectedOrder?.status === 'PENDING' ? (
                <View className="flex-col gap-2">
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center ${processingSellerOrder ? 'bg-slate-300' : 'bg-blue-600'}`}
                    onPress={() => handleSellerOrderAction('confirm', selectedOrder.id)}
                    disabled={processingSellerOrder}
                  >
                    <Text className="text-white font-bold">Xac nhan don</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center border ${processingSellerOrder ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`}
                    onPress={() => handleSellerOrderAction('cancel', selectedOrder.id)}
                    disabled={processingSellerOrder}
                  >
                    <Text className={`font-bold ${processingSellerOrder ? 'text-slate-500' : 'text-red-600'}`}>Huy don</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {isSeller && selectedOrder?.status === 'CONFIRMED' ? (
                <View className="flex-col gap-2">
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center ${processingSellerOrder ? 'bg-slate-300' : 'bg-[#16A34A]'}`}
                    onPress={() => handleSellerOrderAction('ship', selectedOrder.id)}
                    disabled={processingSellerOrder}
                  >
                    <Text className="text-white font-bold">Xac nhan da gui hang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center border ${processingSellerOrder ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`}
                    onPress={() => handleSellerOrderAction('cancel', selectedOrder.id)}
                    disabled={processingSellerOrder}
                  >
                    <Text className={`font-bold ${processingSellerOrder ? 'text-slate-500' : 'text-red-600'}`}>Huy don</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {isSeller && selectedOrder?.status === 'ISSUE_REPORTED' ? (
                <TouchableOpacity
                  className={`rounded-xl py-3 items-center ${processingSellerOrder ? 'bg-slate-300' : 'bg-orange-500'}`}
                  onPress={() => handleSellerOrderAction('confirm-lost', selectedOrder.id)}
                  disabled={processingSellerOrder}
                >
                  <Text className="text-white font-bold">Xac nhan that lac (FAILED)</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Report Issue Modal */}
      <Modal visible={reportIssueModalVisible} transparent animationType="slide" onRequestClose={() => setReportIssueModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setReportIssueModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 text-lg font-black">Bao cao su co</Text>
              <TouchableOpacity onPress={() => setReportIssueModalVisible(false)}>
                <FontAwesome name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
              <Text className="text-orange-900 font-semibold text-sm">Chưa nhận được hàng?</Text>
              <Text className="text-orange-700 text-xs mt-1">
                Vui lòng mô tả chi tiết vấn đề để chúng tôi có thể giúp bạn giải quyết nhanh chóng.
              </Text>
            </View>

            <Text className="text-slate-700 font-semibold text-sm mb-2">Mô tả (Tùy chọn)</Text>
            <TextInput
              className="w-full h-32 border border-slate-200 rounded-xl p-3 text-slate-800"
              multiline
              numberOfLines={5}
              placeholder="Nhập mô tả về sự cố..."
              placeholderTextColor="#94A3B8"
              value={reportIssueNote}
              onChangeText={setReportIssueNote}
              maxLength={500}
              editable={!reportingIssue}
            />
            <Text className="text-xs text-slate-400 mt-1 text-right">{reportIssueNote.length}/500</Text>

            <TouchableOpacity
              className={`mt-4 rounded-xl py-3 items-center ${reportingIssue ? 'bg-slate-300' : 'bg-orange-600'}`}
              onPress={handleReportIssue}
              disabled={reportingIssue}
            >
              <Text className="text-white font-bold">
                {reportingIssue ? 'Dang bao cao...' : 'Gui bao cao'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setReviewModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 pb-8 max-h-[80%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 text-lg font-black">Danh gia san pham</Text>
                <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                  <FontAwesome name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-slate-700 font-semibold text-sm mb-3">Danh gia cua ban</Text>
              <View className="flex-row justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    disabled={creatingReview}
                  >
                    <FontAwesome
                      name={star <= reviewRating ? 'star' : 'star-o'}
                      size={40}
                      color={star <= reviewRating ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {reviewRating > 0 ? (
                <View className="bg-blue-50 rounded-xl p-3 mb-4 flex-row items-center gap-2">
                  <FontAwesome name="info-circle" size={16} color="#0284C7" />
                  <Text className="text-blue-700 text-xs flex-1">
                    {reviewRating <= 2
                      ? 'Co the them binh luan chi tiet de noi tro tro'
                      : reviewRating === 3
                      ? 'Cam on ban da danh gia'
                      : 'Tuyet voi! Cam on ban da hoi long'}
                  </Text>
                </View>
              ) : null}

              <Text className="text-slate-700 font-semibold text-sm mb-2">Binh luan (Tuy chon)</Text>
              <TextInput
                className="w-full h-24 border border-slate-200 rounded-xl p-3 text-slate-800"
                multiline
                numberOfLines={3}
                placeholder="Chia se canh nhan cua ban..."
                placeholderTextColor="#94A3B8"
                value={reviewComment}
                onChangeText={setReviewComment}
                editable={!creatingReview}
              />

              <TouchableOpacity
                className={`mt-6 rounded-xl py-3 items-center ${creatingReview || reviewRating === 0 ? 'bg-slate-300' : 'bg-blue-500'}`}
                onPress={handleCreateReview}
                disabled={creatingReview || reviewRating === 0}
              >
                <Text className="text-white font-bold">
                  {creatingReview ? 'Dang gui danh gia...' : 'Gui danh gia'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={replyModalVisible} transparent animationType="slide" onRequestClose={() => setReplyModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setReplyModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 text-lg font-black">Phan hoi khach hang</Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <FontAwesome name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="w-full h-28 border border-slate-200 rounded-xl p-3 text-slate-800"
              multiline
              numberOfLines={4}
              placeholder="Nhap noi dung phan hoi..."
              placeholderTextColor="#94A3B8"
              value={replyText}
              onChangeText={setReplyText}
              editable={!replyingReview}
              maxLength={500}
            />

            <TouchableOpacity
              className={`mt-4 rounded-xl py-3 items-center ${replyingReview || !replyText.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`}
              onPress={handleReplyReview}
              disabled={replyingReview || !replyText.trim()}
            >
              <Text className="text-white font-bold">{replyingReview ? 'Dang gui...' : 'Gui phan hoi'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={createProductModalVisible} transparent animationType="slide" onRequestClose={() => setCreateProductModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCreateProductModalVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 pb-8 max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 text-lg font-black">Tao san pham moi</Text>
                <TouchableOpacity onPress={() => setCreateProductModalVisible(false)}>
                  <FontAwesome name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold text-slate-500 mb-1">Ten san pham *</Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                value={newProductName}
                onChangeText={setNewProductName}
                placeholder="VD: Rau cai huu co"
                placeholderTextColor="#94A3B8"
              />

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1">Gia ban *</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={newProductPrice}
                    onChangeText={setNewProductPrice}
                    keyboardType="numeric"
                    placeholder="50000"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1">Ton kho *</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={newProductStock}
                    onChangeText={setNewProductStock}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1">Don vi</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={newProductUnit}
                    onChangeText={setNewProductUnit}
                    placeholder="kg"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1">Danh muc</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={newProductCategory}
                    onChangeText={setNewProductCategory}
                    placeholder="khac"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text className="text-xs font-bold text-slate-500 mb-1">Xuat xu</Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                value={newProductOrigin}
                onChangeText={setNewProductOrigin}
                placeholder="Lam Dong"
                placeholderTextColor="#94A3B8"
              />

              <Text className="text-xs font-bold text-slate-500 mb-1">Mo ta</Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-3 py-3 mb-4 h-24 text-slate-800"
                value={newProductDescription}
                onChangeText={setNewProductDescription}
                placeholder="Mo ta ngan ve san pham"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                className={`rounded-xl py-3 items-center ${creatingProduct || !newProductName.trim() || !newProductPrice.trim() || !newProductStock.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`}
                onPress={handleCreateProduct}
                disabled={creatingProduct || !newProductName.trim() || !newProductPrice.trim() || !newProductStock.trim()}
              >
                <Text className="text-white font-bold">{creatingProduct ? 'Dang tao...' : 'Tao san pham'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={createVoucherModalVisible} transparent animationType="slide" onRequestClose={() => setCreateVoucherModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCreateVoucherModalVisible(false)}
          className="flex-1 bg-black/50 justify-center px-4"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 text-lg font-black">Tao voucher moi</Text>
              <TouchableOpacity onPress={() => setCreateVoucherModalVisible(false)}>
                <FontAwesome name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-bold text-slate-500 mb-1">Ma voucher *</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
              value={voucherCode}
              onChangeText={setVoucherCode}
              placeholder="VD: GIAM10"
              placeholderTextColor="#94A3B8"
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Loai giam</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 rounded-xl py-2 items-center border ${voucherDiscountType === 'PERCENT' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}
                    onPress={() => setVoucherDiscountType('PERCENT')}
                  >
                    <Text className={`text-xs font-bold ${voucherDiscountType === 'PERCENT' ? 'text-emerald-700' : 'text-slate-600'}`}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 rounded-xl py-2 items-center border ${voucherDiscountType === 'FIXED' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}
                    onPress={() => setVoucherDiscountType('FIXED')}
                  >
                    <Text className={`text-xs font-bold ${voucherDiscountType === 'FIXED' ? 'text-emerald-700' : 'text-slate-600'}`}>VND</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Gia tri</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
                  value={voucherDiscountValue}
                  onChangeText={setVoucherDiscountValue}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Don toi thieu</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
                  value={voucherMinOrderValue}
                  onChangeText={setVoucherMinOrderValue}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Giam toi da</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
                  value={voucherMaxDiscountAmount}
                  onChangeText={setVoucherMaxDiscountAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Tu ngay (YYYY-MM-DD)</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
                  value={voucherValidFrom}
                  onChangeText={setVoucherValidFrom}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-500 mb-1">Den ngay (YYYY-MM-DD)</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
                  value={voucherValidTo}
                  onChangeText={setVoucherValidTo}
                />
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-500 mb-1 mt-3">So luot su dung toi da</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-3 text-slate-800"
              value={voucherUsageLimit}
              onChangeText={setVoucherUsageLimit}
              keyboardType="numeric"
            />

            <TouchableOpacity
              className={`mt-4 rounded-xl py-3 items-center ${creatingVoucher || !voucherCode.trim() ? 'bg-slate-300' : 'bg-emerald-600'}`}
              onPress={handleCreateVoucher}
              disabled={creatingVoucher || !voucherCode.trim()}
            >
              <Text className="text-white font-bold">{creatingVoucher ? 'Dang tao...' : 'Tao voucher'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!editingProduct} transparent animationType="slide" onRequestClose={() => setEditingProduct(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setEditingProduct(null)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl p-4 pb-8 max-h-[85%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-900 text-lg font-black">Sua san pham</Text>
                <TouchableOpacity onPress={() => setEditingProduct(null)}>
                  <FontAwesome name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {editingProduct ? (
                <>
                  <Text className="text-xs font-bold text-slate-500 mb-1">Ten san pham</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={editingProduct.name}
                    onChangeText={(t) => setEditingProduct({ ...editingProduct, name: t })}
                  />

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-500 mb-1">Gia ban</Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                        value={String(editingProduct.price || '')}
                        onChangeText={(t) => setEditingProduct({ ...editingProduct, price: Number(t) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-500 mb-1">Ton kho</Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                        value={String(editingProduct.stock || '')}
                        onChangeText={(t) => setEditingProduct({ ...editingProduct, stock: Number(t) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-500 mb-1">Don vi</Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                        value={editingProduct.unit || ''}
                        onChangeText={(t) => setEditingProduct({ ...editingProduct, unit: t })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-500 mb-1">Danh muc</Text>
                      <TextInput
                        className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                        value={editingProduct.category || ''}
                        onChangeText={(t) => setEditingProduct({ ...editingProduct, category: t })}
                      />
                    </View>
                  </View>

                  <Text className="text-xs font-bold text-slate-500 mb-1">Xuat xu</Text>
                  <TextInput
                    className="border border-slate-200 rounded-xl px-3 py-3 mb-3 text-slate-800"
                    value={editingProduct.origin || ''}
                    onChangeText={(t) => setEditingProduct({ ...editingProduct, origin: t })}
                  />

                  <Text className="text-xs font-bold text-slate-500 mb-2">Anh hien co</Text>
                  {editingProduct.images && editingProduct.images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                      <View className="flex-row gap-2">
                        {editingProduct.images.map((url, i) => (
                          <Image key={`${url}-${i}`} source={{ uri: resolveImageUrl(url) }} className="w-20 h-20 rounded-xl bg-slate-100" />
                        ))}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text className="text-xs text-slate-400 mb-2">Chua co anh.</Text>
                  )}

                  <Text className="text-xs font-bold text-slate-500 mb-2 mt-2">Anh moi them</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    <View className="flex-row gap-2">
                      {editProductImages.map((img, idx) => (
                        <View key={`${img.uri}-${idx}`} className="relative">
                          <Image source={{ uri: img.uri }} className="w-20 h-20 rounded-xl bg-slate-100" />
                          <TouchableOpacity
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
                            onPress={() => setEditProductImages((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            <FontAwesome name="times" size={11} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {editProductImages.length < 5 ? (
                        <TouchableOpacity
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 items-center justify-center bg-slate-50"
                          onPress={() => void pickProductImages('edit')}
                        >
                          <FontAwesome name="camera" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    className={`rounded-xl py-3 items-center mt-2 ${savingEditProduct ? 'bg-slate-300' : 'bg-emerald-600'}`}
                    onPress={handleSaveEditProduct}
                    disabled={savingEditProduct}
                  >
                    <Text className="text-white font-bold">{savingEditProduct ? 'Dang luu...' : 'Luu thay doi'}</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!restockModalVisible} transparent animationType="slide" onRequestClose={() => setRestockModalVisible(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setRestockModalVisible(null)}
          className="flex-1 bg-black/50 justify-center px-4"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 text-lg font-black">Cap nhat ton kho</Text>
              <TouchableOpacity onPress={() => setRestockModalVisible(null)}>
                <FontAwesome name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {restockModalVisible ? (
              <>
                <Text className="text-sm text-slate-700 font-semibold" numberOfLines={1}>{restockModalVisible.product.name}</Text>
                <Text className="text-xs text-slate-500 mt-1">
                  Ton kho hien tai: {Number(restockModalVisible.product.stock || 0)} {restockModalVisible.product.unit || 'kg'}
                </Text>
                <Text className="text-xs font-bold text-slate-500 mt-3 mb-1">So luong them (dung so am de tru)</Text>
                <TextInput
                  className="border border-slate-200 rounded-xl px-3 py-3 mb-1 text-slate-800"
                  value={restockModalVisible.delta}
                  onChangeText={(t) => setRestockModalVisible({ ...restockModalVisible, delta: t })}
                  keyboardType="numbers-and-punctuation"
                  placeholder="VD: 50 hoac -10"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  className={`mt-3 rounded-xl py-3 items-center ${restocking ? 'bg-slate-300' : 'bg-amber-500'}`}
                  onPress={handleRestockProduct}
                  disabled={restocking}
                >
                  <Text className="text-white font-bold">{restocking ? 'Dang cap nhat...' : 'Cap nhat'}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
