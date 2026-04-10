'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { Container } from '@/components/ui/Container';
import { 
  MapPin, CreditCard, Loader2, ChevronRight, 
  Wallet, Building, Truck, ShieldCheck, Package,
  X, User, Phone, CheckCircle2, AlertCircle, Ticket, Store, ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-600">Đang tải trang thanh toán...</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { carts, activeUserId, clearCart, removeItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [momoPayment, setMomoPayment] = useState<{
    orderId: string;
    amount: number;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
  } | null>(null);

  // Voucher: per-shop state
  type ShopVoucher = { inputCode: string; code: string; discount_amount: number; isValidating: boolean; error: string };
  const [voucherByShop, setVoucherByShop] = useState<Record<string, ShopVoucher>>({});
  const getShopVoucher = (shopId: string): ShopVoucher =>
    voucherByShop[shopId] ?? { inputCode: '', code: '', discount_amount: 0, isValidating: false, error: '' };

  // Saved vouchers — và picker state
  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null); // shopId đang mở picker
  const pickerRef = useRef<HTMLDivElement>(null);

  // Đóng picker khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    setMounted(true);
    if (user) setFullName(user.full_name || '');
    // Tải voucher đã lưu của user
    api.get('/vouchers/saved').then(r => setSavedVouchers(r.data || [])).catch(() => {});
  }, [user]);

  const searchParams = useSearchParams();
  const isBuyNow     = searchParams?.get('bn') === '1';
  const isNegotiated = searchParams?.get('ng') === '1';
  const isSingleItem = isBuyNow || isNegotiated;

  const buyNowSellerId = decodeURIComponent(searchParams?.get('sellerId') || '');
  const buyNowShopName = decodeURIComponent(searchParams?.get('shopName') || '');

  const singleItem = isSingleItem ? {
    id:       searchParams!.get('id') || '',
    name:     decodeURIComponent(searchParams!.get('name') || ''),
    price:    Number(searchParams!.get('price') || 0),
    quantity: Number(searchParams!.get('qty') || 1),
    images:   [decodeURIComponent(searchParams!.get('img') || '')],
    unit:     decodeURIComponent(searchParams!.get('unit') || ''),
    seller_id: buyNowSellerId,
    shop: buyNowSellerId ? {
      id:          buyNowSellerId,
      store_name:  buyNowShopName || `Shop #${buyNowSellerId.slice(-6)}`,
      avatar_url:  null as string | null,
    } : undefined,
    isNegotiated,  // đánh dấu để hiển thị UI
  } : null;

  // Keep legacy alias for buy-now code that references buyNowItem
  const buyNowItem = singleItem;

  const selectedIds = searchParams?.get('ids')?.split(',').filter(Boolean) ?? [];
  const allCartItems = carts[activeUserId] || [];
  const items = (isSingleItem && singleItem)
    ? [singleItem]
    : selectedIds.length > 0
      ? allCartItems.filter(item => selectedIds.includes(item.id))
      : allCartItems;
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // Group items by shop — dùng seller_id làm key chính (đồng nhất với backend)
  const shopGroups: Record<string, any[]> = items.reduce((acc: Record<string, any[]>, item: any) => {
    const shopId = item.seller_id || item.shop?.id || 'unknown';
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const totalDiscount = Object.values(voucherByShop).reduce((s, v) => s + (v.discount_amount ?? 0), 0);
  const finalTotal = Math.max(0, totalPrice - totalDiscount);

  const handleApplyShopVoucher = async (shopId: string, code: string, subtotal: number) => {
    if (!code.trim()) return;
    setVoucherByShop(prev => ({
      ...prev,
      [shopId]: { ...getShopVoucher(shopId), isValidating: true, error: '' }
    }));
    try {
      const res = await api.post('/vouchers/validate', {
        code: code.trim().toUpperCase(),
        seller_id: shopId,
        order_total: subtotal,
      });
      setVoucherByShop(prev => ({
        ...prev,
        [shopId]: { inputCode: code, code: code.trim().toUpperCase(), discount_amount: res.data.discount_amount || 0, isValidating: false, error: '' }
      }));
    } catch (err: any) {
      setVoucherByShop(prev => ({
        ...prev,
        [shopId]: { ...prev[shopId], isValidating: false, error: err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn.' }
      }));
    }
  };

  const handleRemoveShopVoucher = (shopId: string) => {
    setVoucherByShop(prev => ({
      ...prev,
      [shopId]: { inputCode: '', code: '', discount_amount: 0, isValidating: false, error: '' }
    }));
  };

  const setVoucherInput = (shopId: string, value: string) => {
    setVoucherByShop(prev => ({
      ...prev,
      [shopId]: { ...getShopVoucher(shopId), inputCode: value, error: '' }
    }));
  };

  const handlePlaceOrder = async () => {
    if (!address || !phoneNumber) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }
    setLoading(true);
    try {
      const pmMap: Record<string, string> = { cod: 'COD', momo: 'MOMO', zalopay: 'ZALOPAY', bank: 'QR_CODE' };
      const seller_orders = Object.entries(shopGroups).map(([shopId, shopItems]) => ({
        seller_id: shopId,
        items: shopItems.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        voucher_code: voucherByShop[shopId]?.code || undefined,
      }));
      const checkoutRes = await api.post('/orders/checkout', {
        shipping_address: `${address} (SĐT: ${phoneNumber})`,
        payment_method: pmMap[paymentMethod] || 'COD',
        seller_orders,
      });
      if (!isBuyNow && !isNegotiated) {
        if (selectedIds.length > 0) {
          removeItems(selectedIds);
        } else {
          clearCart();
        }
      }
      if (paymentMethod === 'momo') {
        const orderId = checkoutRes.data?.order_ids?.[0];
        if (!orderId) {
          throw new Error('Không lấy được order_id sau khi đặt hàng.');
        }
        const payRes = await api.post('/payments/momo/create', { order_id: orderId });
        setMomoPayment({
          orderId,
          amount: finalTotal,
          payUrl: payRes.data?.payUrl,
          deeplink: payRes.data?.deeplink,
          qrCodeUrl: payRes.data?.qrCodeUrl,
        });
      } else {
        router.push('/order-confirmation');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi đặt hàng. Hãy thử xóa giỏ và thêm lại sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const paymentMethods = [
    { id: 'cod',     title: 'Thanh toán khi nhận hàng', sub: 'Tiền mặt (COD)',                icon: <Truck size={18}/>    },
    { id: 'momo',    title: 'Ví điện tử MoMo',          sub: 'Thanh toán qua app MoMo',        icon: <Wallet size={18}/>   },
    { id: 'zalopay', title: 'Ví ZaloPay',               sub: 'Thanh toán qua ZaloPay',         icon: <Wallet size={18}/>   },
    { id: 'bank',    title: 'Chuyển khoản ngân hàng',   sub: 'Internet Banking / QR Code',     icon: <Building size={18}/> },
  ];

  return (
    <div className="bg-gray-50 min-h-screen font-sans">

      {momoPayment && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={() => setMomoPayment(null)}
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-pink-100 text-pink-600 p-2 rounded-lg"><Wallet size={18} /></div>
              <div>
                <p className="text-sm text-gray-500">Thanh toán MoMo</p>
                <p className="font-semibold text-gray-900">Đơn #{momoPayment.orderId}</p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-center space-y-2">
              <p className="text-sm text-gray-600">Số tiền cần thanh toán</p>
              <p className="text-2xl font-bold text-gray-900">
                {momoPayment.amount.toLocaleString('vi-VN')} đ
              </p>
            </div>

            {momoPayment.qrCodeUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <Image src={momoPayment.qrCodeUrl} alt="MoMo QR" width={240} height={240} />
                </div>
                <p className="text-sm text-gray-500 text-center">Quét QR bằng ứng dụng MoMo để hoàn tất thanh toán</p>
              </div>
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 text-center">
                Không nhận được QR từ MoMo. Vui lòng mở liên kết thanh toán.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {momoPayment.payUrl && (
                <a
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-pink-600 text-white font-semibold shadow-sm hover:bg-pink-700 transition"
                  href={momoPayment.payUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở MoMo (web)
                </a>
              )}
              {momoPayment.deeplink && (
                <a
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-pink-600 text-pink-600 font-semibold hover:bg-pink-50 transition"
                  href={momoPayment.deeplink}
                >
                  Mở MoMo (app)
                </a>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <span>Đã thanh toán xong?</span>
              <button
                className="text-green-600 font-semibold hover:text-green-700"
                onClick={() => {
                  setMomoPayment(null);
                  router.push('/profile?tab=orders');
                }}
              >
                Xem đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BANNER ĐẦU TRANG (đồng bộ với /products và /about) --- */}
      <div className="relative w-full h-[20vh] min-h-[160px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop"
          alt="Checkout Banner"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white mt-16 px-4">
          <h1 className="text-3xl font-bold">Thanh toán đơn hàng</h1>
        </div>
      </div>

      <Container className="py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600 transition-colors">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link href="/cart" className="hover:text-green-600 transition-colors">Giỏ hàng</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-semibold">Thanh toán</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ===== CỘT TRÁI (8 CỘT) ===== */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Thông tin vận chuyển */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="bg-green-600 p-2 rounded-lg text-white">
                  <MapPin size={16} />
                </div>
                <h2 className="font-bold text-gray-900">Thông tin vận chuyển</h2>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên người nhận</label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-green-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="Nhập họ tên..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Số điện thoại</label>
                  <input
                    type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-green-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="090..."
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ nhận hàng</label>
                  <textarea
                    rows={3} value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-green-500 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Phương thức thanh toán */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <CreditCard size={16} />
                </div>
                <h2 className="font-bold text-gray-900">Phương thức thanh toán</h2>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4 text-left ${
                      paymentMethod === method.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg flex-shrink-0 transition-colors ${
                      paymentMethod === method.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{method.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{method.sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      paymentMethod === method.id ? 'border-green-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === method.id && (
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Danh sách đặt hàng theo shop */}
            {Object.entries(shopGroups).map(([shopId, shopItems]) => {
              const shopData = (shopItems[0] as any).shop;
              const shopName = shopData?.store_name || shopData?.name || 'Shop';
              const shopAvatar = shopData?.avatar_url || shopData?.avatar || null;
              const subtotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0);
              const sv = getShopVoucher(shopId);
              return (
                <div key={shopId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Shop header */}
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                      {shopAvatar
                        ? <Image src={shopAvatar} alt={shopName} fill className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400"><Store size={15} /></div>}
                    </div>
                    <span className="font-bold text-gray-800">{shopName || `Shop #${shopId.slice(-6)}`}</span>
                    <span className="ml-auto text-xs text-gray-400">{shopItems.length} sản phẩm</span>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4 space-y-3">
                    {shopItems.map(item => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                          <Image src={item.images?.[0] ?? '/placeholder.png'} alt={item.name} fill className="object-cover" />
                          <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{item.quantity}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        </div>
                        <div className="text-right">
                          {(item as any).isNegotiated && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold block mb-0.5">
                              Đã thương lượng
                            </span>
                          )}
                          <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()}đ</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: Tổng shop */}
                  <div className="px-5 py-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Tổng shop</span>
                    <div className="text-right">
                      {sv.discount_amount > 0 ? (
                        <>
                          <p className="text-xs text-gray-400 line-through">{subtotal.toLocaleString()}đ</p>
                          <p className="text-base font-black text-green-600">{(subtotal - sv.discount_amount).toLocaleString()}đ</p>
                        </>
                      ) : (
                        <p className="text-base font-black text-gray-900">{subtotal.toLocaleString()}đ</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== CỘT PHẢI (4 CỘT) ===== */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Tóm tắt thanh toán</h3>
                <p className="text-xs text-gray-400 mt-0.5">{items.length} sản phẩm · {Object.keys(shopGroups).length} shop</p>
              </div>

              {/* Per-shop breakdown */}
              <div className="px-6 py-4 space-y-4 divide-y divide-dashed divide-gray-100">
                {Object.entries(shopGroups).map(([shopId, shopItems]) => {
                  const shopData = (shopItems[0] as any).shop;
                  const shopName = shopData?.store_name || shopData?.name || 'Shop';
                  const subtotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0);
                  const sv = getShopVoucher(shopId);
                  const discount = sv.discount_amount;
                  return (
                    <div key={shopId} className="pt-3 first:pt-0 space-y-2">
                      <p className="text-xs font-bold text-gray-700 truncate">{shopName}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tạm tính ({shopItems.reduce((s, i) => s + i.quantity, 0)} sp)</span>
                        <span>{subtotal.toLocaleString()}đ</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-orange-500 font-semibold">
                          <span>Voucher ({sv.code})</span>
                          <span>-{discount.toLocaleString()}đ</span>
                        </div>
                      )}

                      {/* Voucher input */}
                      <div className="mt-1">
                        {sv.code ? (
                          /* Voucher đã áp dụng */
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                              <Ticket size={14} className="text-orange-500 flex-shrink-0" />
                              <span className="text-sm font-bold text-orange-600 truncate">{sv.code}</span>
                              <span className="text-xs text-orange-500 flex-shrink-0">−{sv.discount_amount.toLocaleString()}đ</span>
                              <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 ml-auto" />
                            </div>
                            <button
                              onClick={() => handleRemoveShopVoucher(shopId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                              title="Xóa mã"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2" ref={pickerOpenFor === shopId ? pickerRef : undefined}>
                            {/* Input row */}
                            <div className="flex gap-1.5">
                              <div className="flex items-center gap-1.5 flex-1 border border-gray-200 rounded-lg overflow-hidden focus-within:border-orange-400 transition bg-white">
                                <Ticket size={14} className="text-orange-400 ml-2.5 flex-shrink-0" />
                                <input
                                  type="text"
                                  value={sv.inputCode}
                                  onChange={e => setVoucherInput(shopId, e.target.value.toUpperCase())}
                                  onKeyDown={e => e.key === 'Enter' && handleApplyShopVoucher(shopId, sv.inputCode, subtotal)}
                                  placeholder="Nhập mã giảm giá"
                                  className="flex-1 py-2.5 text-sm outline-none uppercase font-medium placeholder:normal-case placeholder:font-normal bg-transparent"
                                />
                              </div>
                              <button
                                onClick={() => handleApplyShopVoucher(shopId, sv.inputCode, subtotal)}
                                disabled={sv.isValidating || !sv.inputCode.trim()}
                                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white text-sm font-bold rounded-lg transition flex items-center gap-1 flex-shrink-0"
                              >
                                {sv.isValidating ? <Loader2 size={13} className="animate-spin" /> : 'Áp dụng'}
                              </button>
                            </div>

                            {sv.error && (
                              <p className="flex items-center gap-1 text-xs text-red-500 pl-1">
                                <AlertCircle size={12} /> {sv.error}
                              </p>
                            )}

                            {/* Nút mở ví voucher */}
                            <button
                              onClick={() => setPickerOpenFor(pickerOpenFor === shopId ? null : shopId)}
                              className="w-full flex items-center justify-between px-3 py-2 border border-dashed border-orange-300 rounded-lg text-orange-500 hover:bg-orange-50 transition text-sm font-medium"
                            >
                              <span className="flex items-center gap-1.5">
                                <Ticket size={14} /> Chọn từ mã đã lưu
                              </span>
                              <ChevronDown size={14} className={`transition-transform ${pickerOpenFor === shopId ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Panel mã đã lưu */}
                            {pickerOpenFor === shopId && (
                              <div ref={pickerRef} className="border border-orange-200 rounded-xl overflow-hidden bg-orange-50/40">
                                <div className="px-3 py-2 bg-orange-500 text-white text-xs font-bold flex items-center justify-between">
                                  <span className="flex items-center gap-1.5"><Ticket size={12} /> Mã đã lưu của bạn</span>
                                  <button onClick={() => setPickerOpenFor(null)}><X size={14} /></button>
                                </div>
                                {savedVouchers.length === 0 ? (
                                  <div className="py-6 text-center text-sm text-gray-400">
                                    <Ticket size={28} className="mx-auto mb-2 text-gray-300" />
                                    Chưa có mã nào được lưu
                                  </div>
                                ) : (
                                  <div className="divide-y divide-orange-100 max-h-52 overflow-y-auto">
                                    {savedVouchers.map((v: any) => {
                                      const vd = v.voucher || v;
                                      const canUse = !v.is_used && (!vd.valid_to || new Date(vd.valid_to) >= new Date()) && subtotal >= (vd.min_order_value ?? 0);
                                      return (
                                        <button
                                          key={v.id || vd.code}
                                          onClick={() => { if (canUse) { setVoucherInput(shopId, vd.code); setPickerOpenFor(null); handleApplyShopVoucher(shopId, vd.code, subtotal); } }}
                                          disabled={!canUse}
                                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${canUse ? 'hover:bg-orange-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                        >
                                          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                            <Ticket size={16} className="text-orange-500" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800">{vd.code}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                              {vd.description || `Giảm ${vd.discount_type === 'percentage' ? vd.discount_value + '%' : ((vd.discount_value || 0)).toLocaleString() + 'đ'}`}
                                            </p>
                                            {!canUse && <p className="text-[10px] text-red-400 mt-0.5">Không áp dụng được cho đơn này</p>}
                                          </div>
                                          {canUse && <ChevronRight size={14} className="text-orange-400 flex-shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 border-t border-dashed border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded">Miễn phí</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-orange-500 font-semibold">
                    <span>Tổng giảm giá</span>
                    <span>-{totalDiscount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900 text-sm">Tổng cộng</span>
                  <div className="text-right">
                    {totalDiscount > 0 && <p className="text-xs text-gray-400 line-through">{totalPrice.toLocaleString()}đ</p>}
                    <p className="text-2xl font-black text-green-600 leading-none">{finalTotal.toLocaleString()}đ</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Đã bao gồm thuế phí</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => {
                    if (!address.trim() || !phoneNumber.trim()) {
                      alert('Vui lòng nhập đầy đủ thông tin giao hàng');
                      return;
                    }
                    setShowConfirmDialog(true);
                  }}
                  disabled={loading || items.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30 hover:scale-[1.01] flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <><ShieldCheck size={18} /> Đặt hàng ngay</>
                  )}
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-green-500" />
                  Thông tin được bảo mật tuyệt đối
                </p>
              </div>
            </div>
          </div>

        </div>
      </Container>

      {/* ===== DIALOG XÁC NHẬN ĐẶT HÀNG ===== */}
      {showConfirmDialog && (
        <CheckoutConfirmDialog
          items={items}
          shopGroups={shopGroups}
          voucherByShop={voucherByShop}
          fullName={fullName}
          phoneNumber={phoneNumber}
          address={address}
          paymentMethod={paymentMethods.find(m => m.id === paymentMethod)!}
          totalPrice={totalPrice}
          totalDiscount={totalDiscount}
          finalTotal={finalTotal}
          loading={loading}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handlePlaceOrder}
        />
      )}
    </div>
  );
}

/* ============================================================
   CHECKOUT CONFIRM DIALOG
   ============================================================ */
function CheckoutConfirmDialog({
  items, shopGroups, voucherByShop,
  fullName, phoneNumber, address,
  paymentMethod, totalPrice, totalDiscount, finalTotal, loading,
  onClose, onConfirm
}: {
  items: any[];
  shopGroups: Record<string, any[]>;
  voucherByShop: Record<string, any>;
  fullName: string;
  phoneNumber: string;
  address: string;
  paymentMethod: { id: string; title: string; sub: string; icon: React.ReactNode };
  totalPrice: number;
  totalDiscount: number;
  finalTotal: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Xác nhận đơn hàng</h3>
            <p className="text-xs text-gray-400 mt-0.5">Vui lòng kiểm tra lại trước khi đặt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Thông tin người nhận */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Thông tin giao hàng</p>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Người nhận</p>
                <p className="text-sm font-bold text-gray-800">{fullName || 'Chưa nhập'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Phone size={13} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Số điện thoại</p>
                <p className="text-sm font-bold text-gray-800">{phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={13} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Địa chỉ nhận hàng</p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <CreditCard size={13} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Phương thức thanh toán</p>
                <p className="text-sm font-bold text-gray-800">{paymentMethod?.title}</p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Sản phẩm đặt mua ({items.length} món)
            </p>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center p-3 rounded-xl border border-gray-100">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                    <Image
                      src={item.images?.[0] ?? '/placeholder.png'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.unit} · x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-black text-green-600 flex-shrink-0">
                    {(item.price * item.quantity).toLocaleString()}đ
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-gray-900 rounded-xl p-5 text-white space-y-2">
            {Object.entries(shopGroups).map(([shopId, shopItems]) => {
              const shopData = (shopItems[0] as any).shop;
              const shopName = shopData?.store_name || shopData?.name || 'Shop';
              const subtotal = shopItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
              const sv = voucherByShop[shopId];
              const discount = sv?.discount_amount ?? 0;
              return (
                <div key={shopId} className="flex justify-between text-sm text-gray-300">
                  <span className="truncate max-w-[60%]">{shopName}</span>
                  <span className="font-semibold">
                    {discount > 0 ? (
                      <><span className="line-through text-gray-500 text-xs mr-1">{subtotal.toLocaleString()}đ</span>{(subtotal - discount).toLocaleString()}đ</>
                    ) : `${subtotal.toLocaleString()}đ`}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-gray-700 pt-2 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Tổng thanh toán</p>
                {totalDiscount > 0 && (
                  <p className="text-sm text-gray-400 line-through">{totalPrice.toLocaleString()}đ</p>
                )}
                <p className="text-2xl font-black text-green-400">{finalTotal.toLocaleString()}đ</p>
                {totalDiscount > 0 && (
                  <p className="text-xs text-orange-400">Đã giảm {totalDiscount.toLocaleString()}đ</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Đã bao gồm phí vận chuyển miễn phí</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{items.length} sản phẩm</p>
                <p className="text-xs text-green-400 font-semibold mt-1">Freeship</p>
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Kiểm tra lại
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <><CheckCircle2 size={18} /> Xác nhận đặt hàng</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}