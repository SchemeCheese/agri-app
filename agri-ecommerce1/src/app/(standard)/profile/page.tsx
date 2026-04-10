'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import api from '@/lib/axios';
import Image from 'next/image';
import {
  User, Package, ShoppingBag, Clock,
  CheckCircle2, XCircle, ChevronRight, LogOut,
  Loader2, Mail, Phone, Shield, Store, X,
  CreditCard, Truck, Star, MessageSquare, AlertCircle,
  PackageCheck, AlertTriangle, Camera, Edit, Check, Ticket, Tag
} from 'lucide-react';
import Link from 'next/link';
import { OrderTimeline } from '@/components/ui/OrderTimeline';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews' | 'vouchers'>('info');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBuyerCancelDialog, setShowBuyerCancelDialog] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [showWriteReview, setShowWriteReview] = useState<any>(null);
  const [savedVouchers, setSavedVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Track scroll để header đổi màu
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Khởi tạo form profile từ user
  useEffect(() => {
    if (user) {
      setProfileForm({ full_name: user.full_name || '', phone_number: (user as any).phone_number || '' });
      if ((user as any).avatar) {
        setAvatarPreview(`http://localhost:3001${(user as any).avatar}`);
      }
    }
  }, [user]);

  // Load reviews tab
  useEffect(() => {
    if (activeTab === 'reviews') {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const res = await api.get('/reviews/my-reviews');
          setReviews(res.data);
        } catch (error) {
          console.error(error);
        } finally { setLoadingReviews(false); }
      };
      fetchReviews();
    }
  }, [activeTab]);

  // Load vouchers tab
  useEffect(() => {
    if (activeTab === 'vouchers') {
      setLoadingVouchers(true);
      api.get('/vouchers/saved')
        .then(res => setSavedVouchers(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error('Vouchers error:', err))
        .finally(() => setLoadingVouchers(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await api.get('/orders/my-orders');
          setOrders(res.data);
        } catch (error) {
          console.error('Lỗi lấy đơn hàng:', error);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  const refreshOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
      // Cập nhật selectedOrder nếu đang mở
      if (selectedOrder) {
        const updated = res.data.find((o: any) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/complete`);
      await refreshOrders();
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  const handleCancelByBuyer = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/cancel-by-buyer`);
      await refreshOrders();
      setShowBuyerCancelDialog(false);
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  const handleReportIssue = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/report-issue`);
      await refreshOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể báo sự cố. Vui lòng thử lại sau.');
    } finally { setActionLoading(false); }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaveError('');
    try {
      await api.patch('/profile/me', profileForm);
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await api.post('/profile/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.avatar) setAvatarPreview(`http://localhost:3001${res.data.avatar}`);
      }
      setEditMode(false);
      setAvatarFile(null);
    } catch (e: any) {
      setProfileSaveError(e.response?.data?.message || 'Lỗi khi lưu thông tin');
    } finally { setProfileSaving(false); }
  };

  const handleWriteReview = async (
    orderId: string,
    reviews: { product_id: string; rating: number; comment: string; images: File[] }[]
  ) => {
    for (const review of reviews) {
      let imageUrls: string[] = [];
      if (review.images.length > 0) {
        for (const img of review.images) {
          const fd = new FormData();
          fd.append('file', img);
          try {
            const res = await api.post('/reviews/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.url) imageUrls.push(res.data.url);
          } catch {}
        }
      }
      await api.post('/reviews', {
        order_id: orderId,
        product_id: review.product_id,
        rating: review.rating,
        comment: review.comment,
        ...(imageUrls.length > 0 && { images: imageUrls }),
      });
    }
    setShowWriteReview(null);
    await refreshOrders();
  };

  const menuItems = [
    { id: 'info',     label: 'Thông tin cá nhân',  icon: <User size={18} />    },
    { id: 'orders',   label: 'Lịch sử mua hàng',   icon: <Package size={18} /> },
    { id: 'vouchers', label: 'Ví Voucher',          icon: <Ticket size={18} />  },
    { id: 'reviews',  label: 'Đánh giá của tôi',    icon: <Star size={18} />    },
  ];

  const getOrderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':   return { text: 'Chờ xác nhận',   color: 'text-amber-600 bg-amber-50 border border-amber-200',    icon: <Clock size={12}/> };
      case 'CONFIRMED': return { text: 'Chờ vận chuyển', color: 'text-blue-600 bg-blue-50 border border-blue-200',        icon: <CheckCircle2 size={12}/> };
      case 'SHIPPING':  return { text: 'Đang giao',       color: 'text-purple-600 bg-purple-50 border border-purple-200', icon: <Truck size={12}/> };
      case 'COMPLETED': return { text: 'Đã nhận hàng',   color: 'text-green-600 bg-green-50 border border-green-200',    icon: <PackageCheck size={12}/> };
      case 'ISSUE_REPORTED': return { text: 'Có sự cố',     color: 'text-orange-600 bg-orange-50 border border-orange-200', icon: <AlertTriangle size={12}/> };
      case 'FAILED':    return { text: 'Giao thất bại',   color: 'text-red-600 bg-red-50 border border-red-200',         icon: <XCircle size={12}/> };
      case 'CANCELLED': return { text: 'Đã hủy',          color: 'text-red-500 bg-red-50 border border-red-200',          icon: <XCircle size={12}/> };
      default:          return { text: 'Đang xử lý',      color: 'text-blue-600 bg-blue-50 border border-blue-200',       icon: <Package size={12}/> };
    }
  };

  const getPaymentStatus = (payments: any[]) => {
    if (!payments || payments.length === 0) return { text: 'Chưa thanh toán', color: 'text-gray-500', icon: <AlertCircle size={14}/> };
    const p = payments[0];
    const pm = p.payment_method;
    switch (p.status) {
      case 'PAID':
      case 'SUCCESS':   return { text: 'Đã thanh toán',   color: 'text-green-600', icon: <CheckCircle2 size={14}/>, method: pm };
      case 'REFUNDING': return { text: 'Đang hoàn tiền',  color: 'text-blue-600',  icon: <Loader2 size={14}/>,      method: pm };
      case 'REFUNDED':  return { text: 'Đã hoàn tiền',    color: 'text-teal-600',  icon: <CheckCircle2 size={14}/>, method: pm };
      case 'FAILED':    return { text: 'Thanh toán lỗi',  color: 'text-red-500',   icon: <XCircle size={14}/>,      method: pm };
      default:          return { text: 'Chưa thanh toán', color: 'text-amber-600', icon: <Clock size={14}/>,        method: pm };
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">

      {/* BANNER */}
      <div className="relative w-full h-[30vh] min-h-[220px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1660418011914-2bedc50017e2?q=80&w=2650&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Profile Banner"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white mt-16 px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tài khoản của tôi</h1>
          <p className="text-base opacity-80">Quản lý thông tin và đơn hàng của bạn</p>
        </div>
      </div>

      <Container className="py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600 transition-colors">Trang chủ</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-semibold">Tài khoản</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ===== SIDEBAR TRÁI (3 CỘT) ===== */}
          <div className="lg:col-span-3 space-y-4">
            {/* Avatar Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 shadow-md shadow-green-100 bg-green-600 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                  : <span className="text-3xl font-black text-white">{user?.full_name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <h2 className="font-bold text-gray-900 text-base line-clamp-1">{user?.full_name}</h2>
              <p className="text-gray-400 text-sm mt-0.5 truncate">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
                {user?.role === 'SELLER' ? <><Store size={11}/> Nhà vườn</> : <><Shield size={11}/> Khách hàng</>}
              </span>
            </div>

            {/* Nav Menu */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as 'info' | 'orders' | 'reviews' | 'vouchers')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      activeTab === item.id
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={14} />}
                  </button>
                ))}
                <div className="border-t border-gray-100 pt-1 mt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* ===== NỘI DUNG PHẢI (9 CỘT) ===== */}
          <div className="lg:col-span-9">

            {/* TAB 1: THÔNG TIN */}
            {activeTab === 'info' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hồ sơ cá nhân</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Thông tin tài khoản của bạn</p>
                  </div>
                  {!editMode ? (
                    <button onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl transition-all border border-gray-200 hover:border-green-300">
                      <Edit size={15}/> Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setAvatarFile(null);
                          setProfileSaveError('');
                          setProfileForm({ full_name: user?.full_name || '', phone_number: (user as any)?.phone_number || '' });
                          if ((user as any)?.avatar) setAvatarPreview(`http://localhost:3001${(user as any).avatar}`);
                          else setAvatarPreview('');
                        }}
                        className="text-sm font-semibold text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all border border-gray-200">
                        Hủy
                      </button>
                      <button onClick={handleSaveProfile} disabled={profileSaving}
                        className="flex items-center gap-2 text-sm font-semibold bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all disabled:opacity-70">
                        {profileSaving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                        {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  {profileSaveError && <p className="text-sm text-red-500 mb-4 font-medium">{profileSaveError}</p>}
                  {editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 flex justify-center">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-50 shadow-md bg-gray-100">
                            {avatarPreview
                              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/>
                              : <div className="w-full h-full bg-green-600 flex items-center justify-center text-white text-3xl font-black">{user?.full_name?.charAt(0)}</div>
                            }
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all">
                            <Camera className="text-white" size={22}/>
                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                            }}/>
                          </label>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                            <Camera size={12}/>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Họ và tên</label>
                        <input type="text" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium text-gray-900 text-sm"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Số điện thoại</label>
                        <input type="text" value={profileForm.phone_number} onChange={e => setProfileForm({...profileForm, phone_number: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium text-gray-900 text-sm"
                          placeholder="Nhập số điện thoại"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Email</label>
                        <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 font-medium">{user?.email}</div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Vai trò</label>
                        <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500 font-medium">
                          {user?.role === 'SELLER' ? 'Nhà vườn / Người bán' : 'Khách hàng'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoField icon={<User size={15}/>}   label="Họ và tên"     value={user?.full_name} />
                      <InfoField icon={<Mail size={15}/>}   label="Email"          value={user?.email} />
                      <InfoField icon={<Phone size={15}/>}  label="Số điện thoại" value={(user as any)?.phone_number} />
                      <InfoField icon={<Shield size={15}/>} label="Vai trò"        value={user?.role === 'SELLER' ? 'Nhà vườn / Người bán' : 'Khách hàng'} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB VÍ VOUCHER */}
            {activeTab === 'vouchers' && (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Ví Voucher</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {savedVouchers.length > 0
                        ? `${savedVouchers.filter((sv: any) => !sv.is_used && new Date(sv.voucher?.valid_to || sv.valid_to) >= new Date()).length} voucher có thể dùng`
                        : 'Mã giảm giá bạn đã lưu'}
                    </p>
                  </div>
                  <Ticket size={22} className="text-orange-400" />
                </div>

                {loadingVouchers ? (
                  <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center py-20">
                    <Loader2 className="animate-spin text-green-600 mb-3" size={32} />
                  </div>
                ) : savedVouchers.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 text-center py-20 px-6">
                    <Ticket size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-semibold">Chưa có voucher nào</p>
                    <p className="text-gray-400 text-sm mt-1">Ghé thăm các shop để lưu mã giảm giá nhé!</p>
                    <Link href="/products" className="mt-5 inline-flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition">
                      Khám phá shop ngay <ChevronRight size={15}/>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {savedVouchers.map((sv: any) => {
                      const v = sv.voucher || sv;
                      const expired = v.valid_to && new Date(v.valid_to) < new Date();
                      const used = sv.is_used;
                      const canUse = !used && !expired;
                      const shopName = v.seller?.profile?.store_name || v.shop_name || 'Shop';
                      const shopId = v.seller?.id || v.seller_id;
                      return (
                        <div key={sv.id || v.id}
                          className={`relative flex items-stretch rounded-xl overflow-hidden shadow-sm border transition ${
                            canUse
                              ? 'border-orange-200 bg-white hover:shadow-md'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          {/* Left — giá trị giảm */}
                          <div className={`flex flex-col items-center justify-center px-5 py-4 min-w-[90px] text-white flex-shrink-0 ${
                            canUse ? 'bg-gradient-to-b from-orange-500 to-orange-600' : 'bg-gray-400'
                          }`}>
                            <Tag size={16} className="mb-1 opacity-80"/>
                            <span className={`font-black leading-none ${v.discount_type === 'PERCENT' ? 'text-2xl' : 'text-lg'}`}>
                              {v.discount_type === 'PERCENT' ? `${v.discount_value}%` : `${(v.discount_value / 1000).toFixed(0)}K`}
                            </span>
                            <span className="text-[10px] opacity-80 mt-0.5">GIẢM</span>
                          </div>

                          {/* Notch phân cách hình coupon */}
                          <div className={`absolute top-1/2 -translate-y-1/2 left-[78px] w-5 h-5 rounded-full z-10 ${
                            canUse ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100 border border-gray-200'
                          }`}/>

                          {/* Right — thông tin */}
                          <div className="flex-1 px-5 py-4 border-l border-dashed border-gray-200 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-black text-gray-800 tracking-widest text-base">{v.code}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {v.discount_type === 'PERCENT'
                                      ? `Giảm ${v.discount_value}%${v.max_discount_amount > 0 ? ` · tối đa ${Number(v.max_discount_amount).toLocaleString()}đ` : ''}`
                                      : `Giảm thẳng ${Number(v.discount_value).toLocaleString()}đ`}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  used ? 'bg-gray-100 text-gray-500' :
                                  expired ? 'bg-red-100 text-red-600' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {used ? 'Đã dùng' : expired ? 'Hết hạn' : '● Còn dùng'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <span className="text-gray-500 font-semibold">Đơn tối thiểu:</span> {Number(v.min_order_value).toLocaleString()}đ
                                </p>
                                {v.valid_to && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={10}/>
                                    HSD: {new Date(v.valid_to).toLocaleDateString('vi-VN')}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                🏪 <span className="font-semibold text-gray-600">{shopName}</span>
                              </p>
                            </div>

                            {canUse && (
                              <div className="flex gap-2 mt-3">
                                <Link href={shopId ? `/shop/${shopId}` : '/products'}
                                  className="flex-1 text-center text-xs font-bold text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition">
                                  Đến shop
                                </Link>
                                <Link href={`/cart`}
                                  className="flex-1 text-center text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg transition">
                                  Dùng ngay
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LỊCH SỬ ĐƠN HÀNG */}
            {activeTab === 'orders' && (
              <div>
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Lịch sử đơn hàng</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {orders.length > 0 ? `${orders.length} đơn hàng` : 'Theo dõi trạng thái đơn hàng'}
                    </p>
                  </div>
                  <Package size={22} className="text-gray-300" />
                </div>

                {/* Loading */}
                {loadingOrders && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center py-24">
                    <Loader2 className="animate-spin text-green-600 mb-3" size={32} />
                    <p className="text-sm text-gray-400 font-medium">Đang tải đơn hàng...</p>
                  </div>
                )}

                {/* Empty */}
                {!loadingOrders && orders.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-24 px-6">
                    <ShoppingBag size={72} className="mx-auto text-gray-200 mb-5" />
                    <h4 className="font-bold text-gray-700 text-lg mb-2">Chưa có đơn hàng nào</h4>
                    <p className="text-sm text-gray-400 mb-6">Hãy khám phá và mua sắm những sản phẩm tươi ngon!</p>
                    <Link href="/products" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition">
                      Mua sắm ngay <ChevronRight size={16}/>
                    </Link>
                  </div>
                )}

                {/* Order List */}
                {!loadingOrders && orders.length > 0 && (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const status = getOrderStatus(order.status);
                      const payment = getPaymentStatus(order.payments);
                      const shopName    = order.seller?.profile?.store_name || order.seller?.full_name || 'Agri Shop';
                      const isDelivered = order.status === 'COMPLETED';
                      const isPaid      = ['PAID', 'SUCCESS'].includes(order.payments?.[0]?.status);
                      const hasIssue    = order.status === 'ISSUE_REPORTED';
                      const needsAction = order.status === 'SHIPPING'; // buyer cần bấm nhận hàng

                      return (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                          needsAction ? 'border-purple-200 ring-1 ring-purple-100' : hasIssue ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'
                        }`}>

                          {/* Action hint banner */}
                          {needsAction && (
                            <div className="px-6 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
                              <p className="text-xs font-semibold text-purple-700">
                                Đơn đang trên đường giao — bấm <span className="font-black">Xem chi tiết</span> để xác nhận đã nhận hàng.
                              </p>
                            </div>
                          )}
                          {hasIssue && (
                            <div className="px-6 py-2 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                              <AlertTriangle size={12} className="text-orange-500 flex-shrink-0 animate-pulse" />
                              <p className="text-xs font-semibold text-orange-700">
                                Đang xử lý sự cố — người bán sẽ xác nhận tình trạng đơn hàng sớm nhất.
                              </p>
                            </div>
                          )}

                          {/* Order Header */}
                          <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold bg-gray-900 text-white px-2.5 py-1 rounded-md tracking-wide">
                                #{order.id.slice(-8).toUpperCase()}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                {status.icon} {status.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 font-medium">
                                {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Shop info */}
                          <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-dashed border-gray-100">
                            <Store size={14} className="text-green-600" />
                            <span className="text-sm font-semibold text-gray-700">{shopName}</span>
                          </div>

                          {/* Order Items */}
                          <div className="px-6 py-4 space-y-4">
                            {order.order_items.map((item: any) => (
                              <div key={item.id} className="flex gap-4 items-center">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                  <Image
                                    src={item.product?.images?.[0] ?? '/placeholder.png'}
                                    alt={item.product?.name || ''}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                                    {item.product?.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {item.product?.unit} · x{item.quantity}
                                  </p>
                                </div>
                                <p className="text-sm font-bold text-green-600 flex-shrink-0">
                                  {(Number(item.negotiated_price) * Number(item.quantity)).toLocaleString()}đ
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Order Footer */}
                          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${payment.color}`}>
                              <CreditCard size={13}/> {payment.text}
                              {(payment as any).method && (
                                <span className="text-gray-400 font-normal">({({'COD':'Tiền mặt','MOMO':'MoMo','ZALOPAY':'ZaloPay','QR_CODE':'QR/Chuyển khoản'} as Record<string,string>)[(payment as any).method] || (payment as any).method})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Tổng thanh toán</p>
                                <p className="text-lg font-black text-green-600">
                                  {Number(order.final_total_price).toLocaleString()}đ
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all whitespace-nowrap"
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* TAB 3: ĐÁNH GIÁ CỦA TÔI */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Đánh giá của tôi</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {reviews.length > 0 ? `${reviews.length} đánh giá` : 'Xem lại tất cả đánh giá đã viết'}
                    </p>
                  </div>
                  <Star size={22} className="text-gray-300"/>
                </div>

                {loadingReviews && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex justify-center py-24">
                    <Loader2 className="animate-spin text-green-600" size={32}/>
                  </div>
                )}

                {!loadingReviews && reviews.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-24 px-6">
                    <Star size={64} className="mx-auto text-gray-200 mb-4"/>
                    <h4 className="font-bold text-gray-700 text-lg mb-2">Chưa có đánh giá nào</h4>
                    <p className="text-sm text-gray-400">Hãy mua hàng và chia sẻ trải nghiệm của bạn!</p>
                  </div>
                )}

                {!loadingReviews && reviews.length > 0 && (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                            <Image src={review.product?.images?.[0] ?? '/placeholder.png'} alt="" fill className="object-cover"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{review.product?.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={16} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}/>
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-gray-700 italic mb-2">&quot;{review.comment}&quot;</p>}
                        {review.seller_reply && (
                          <div className="bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400 mt-3">
                            <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mb-1"><Store size={12}/> Phản hồi từ cửa hàng</p>
                            <p className="text-xs text-gray-700">{review.seller_reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}          </div>
        </div>
      </Container>

      {/* ===== DIALOG CHI TIẾT ĐƠN HÀNG ===== */}
      {selectedOrder && !showBuyerCancelDialog && (
        <OrderDetailDialog
          order={selectedOrder}
          actionLoading={actionLoading}
          onClose={() => setSelectedOrder(null)}
          getOrderStatus={getOrderStatus}
          getPaymentStatus={getPaymentStatus}
          onComplete={() => handleCompleteOrder(selectedOrder.id)}
          onCancelClick={() => setShowBuyerCancelDialog(true)}
          onWriteReview={() => setShowWriteReview(selectedOrder)}
          onReportIssue={() => handleReportIssue(selectedOrder.id)}
        />
      )}

      {showBuyerCancelDialog && selectedOrder && (
        <BuyerCancelDialog
          loading={actionLoading}
          onClose={() => setShowBuyerCancelDialog(false)}
          onConfirm={() => handleCancelByBuyer(selectedOrder.id)}
        />
      )}

      {showWriteReview && (
        <WriteReviewDialog
          order={showWriteReview}
          onClose={() => setShowWriteReview(null)}
          onSubmit={handleWriteReview}
        />
      )}
    </div>
  );
}

/* ============================================================
   DIALOG COMPONENT
   ============================================================ */
function OrderDetailDialog({
  order, onClose, getOrderStatus, getPaymentStatus, actionLoading, onComplete, onCancelClick, onWriteReview, onReportIssue
}: {
  order: any;
  onClose: () => void;
  getOrderStatus: (s: string) => any;
  getPaymentStatus: (p: any[]) => any;
  actionLoading: boolean;
  onComplete: () => void;
  onCancelClick: () => void;
  onWriteReview: () => void;
  onReportIssue: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const orderStatus  = getOrderStatus(order.status);
  const payStatus    = getPaymentStatus(order.payments);
  const shopName     = order.seller?.profile?.store_name || order.seller?.full_name || 'Agri Shop';
  const isDelivered  = order.status === 'COMPLETED';
  const isPaid       = ['PAID', 'SUCCESS'].includes(order.payments?.[0]?.status);
  const paymentMethod = order.payments?.[0]?.payment_method || order.payment_method || 'COD';
  const isCOD        = paymentMethod === 'COD';
  const [showCodConfirm, setShowCodConfirm] = useState(false);

  // Timer báo sự cố: cần đủ 3 ngày kể từ khi shipped_at
  const shippedAt  = order.shipped_at ? new Date(order.shipped_at) : null;
  const unlockDate = shippedAt ? new Date(shippedAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null;
  const canReport  = unlockDate ? new Date() >= unlockDate : false;
  const unlockDateStr = unlockDate
    ? unlockDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // Đóng khi click nền
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Đóng khi nhấn Esc
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

        {/* Dialog Header */}
        <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Chi tiết đơn hàng</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Timeline */}
          <OrderTimeline currentStatus={order.status} />

          {/* Trạng thái tổng quan */}
          <div className="grid grid-cols-2 gap-3">
            {/* Trạng thái đơn hàng */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package size={12}/> Trạng thái
              </p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${orderStatus.color}`}>
                {orderStatus.icon} {orderStatus.text}
              </span>
              {isDelivered && (
                <p className="text-[11px] text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 size={11}/> Đã nhận hàng
                </p>
              )}
            </div>

            {/* Trạng thái thanh toán */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard size={12}/> Thanh toán
              </p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${payStatus.color}`}>
                {payStatus.icon} {payStatus.text}
              </span>
              {(payStatus as any).method && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Phương thức: <span className="font-semibold text-gray-600">
                    {({'COD':'Tiền mặt (COD)','MOMO':'Ví MoMo','ZALOPAY':'ZaloPay','QR_CODE':'QR / Chuyển khoản'} as Record<string,string>)[(payStatus as any).method] || (payStatus as any).method}
                  </span>
                </p>
              )}
              {isPaid && (
                <p className="text-[11px] text-green-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 size={11}/> Đã thanh toán
                </p>
              )}
            </div>
          </div>

          {/* Thông tin shop + địa chỉ */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2">
              <Store size={14} className="text-green-600 flex-shrink-0"/>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cửa hàng</span>
              <span className="text-sm font-bold text-gray-800 ml-auto">{shopName}</span>
            </div>
            <div className="flex items-start gap-2">
              <Truck size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Địa chỉ</span>
              <span className="text-xs text-gray-600 ml-auto text-right max-w-[60%]">{order.shipping_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400 flex-shrink-0"/>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Ngày đặt</span>
              <span className="text-xs text-gray-600 ml-auto">
                {new Date(order.created_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Sản phẩm đã mua
            </p>
            <div className="space-y-3">
              {order.order_items.map((item: any) => {
                // Kiểm tra đã review chưa
                const hasReview = order.reviews?.length > 0;

                return (
                  <div key={item.id} className="flex gap-3 items-start p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                      <Image
                        src={item.product?.images?.[0] ?? '/placeholder.png'}
                        alt={item.product?.name || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.product?.unit} · Số lượng: <span className="font-bold text-gray-600">{item.quantity}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Đơn giá: <span className="font-semibold text-gray-700">{Number(item.negotiated_price).toLocaleString()}đ</span>
                      </p>

                      {/* Badge đánh giá — chỉ hiện khi đã nhận hàng */}
                      {isDelivered && (
                        <div className="mt-2">
                          {hasReview ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                              <Star size={10} className="fill-green-600"/> Đã đánh giá
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                              <MessageSquare size={10}/> Chưa đánh giá
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-black text-green-600 flex-shrink-0 pt-0.5">
                      {(Number(item.negotiated_price) * Number(item.quantity)).toLocaleString()}đ
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review hiện tại (nếu có) */}
          {order.reviews?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star size={12} className="text-green-600"/> Đánh giá của bạn
              </p>
              {order.reviews.map((review: any) => (
                <div key={review.id} className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tổng cộng */}
          <div className="bg-gray-900 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Tổng thanh toán</p>
                <p className="text-2xl font-black text-green-400 mt-0.5">
                  {Number(order.final_total_price).toLocaleString()}đ
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{order.order_items.length} sản phẩm</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isPaid ? '✓ Đã thanh toán' : '⏳ Chờ thanh toán'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Nút hành động buyer ── */}
          {order.status === 'PENDING' && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={onCancelClick}
                disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
              >
                Hủy đơn hàng
              </button>
            </div>
          )}

          {order.status === 'SHIPPING' && (
            <div className="space-y-2.5">
              <button
                onClick={() => isCOD ? setShowCodConfirm(true) : onComplete()}
                disabled={actionLoading}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-green-600/20"
              >
                {actionLoading
                  ? <Loader2 className="animate-spin" size={18}/>
                  : <><PackageCheck size={18}/> Đã nhận được hàng</>
                }
              </button>
              <button
                onClick={onReportIssue}
                disabled={actionLoading || !canReport}
                title={!canReport && unlockDateStr ? `Có thể báo sự cố sau ${unlockDateStr}` : undefined}
                className={`w-full py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  canReport
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                } disabled:opacity-50`}
              >
                <AlertTriangle size={15}/>
                {canReport
                  ? 'Tôi chưa nhận được hàng'
                  : `Có thể báo sự cố sau ${unlockDateStr || '3 ngày giao hàng'}`
                }
              </button>
            </div>
          )}

          {/* COD Confirmation Dialog */}
          {showCodConfirm && (
            <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="text-green-600" size={28}/>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Xác nhận nhận hàng</h3>
                <p className="text-sm text-gray-600 text-center leading-relaxed mb-2">
                  Bằng việc bấm <span className="font-bold text-gray-900">Đồng ý</span>, bạn xác nhận sản phẩm đã được giao thành công và bạn đã thanh toán đầy đủ
                </p>
                <p className="text-2xl font-black text-green-600 text-center mb-1">
                  {Number(order.final_total_price).toLocaleString()}đ
                </p>
                <p className="text-xs text-gray-400 text-center mb-5">tiền mặt (COD) cho người giao hàng.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCodConfirm(false)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    Kiểm tra lại
                  </button>
                  <button
                    onClick={() => { setShowCodConfirm(false); onComplete(); }}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition flex items-center justify-center disabled:opacity-70"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16}/> : 'Đồng ý'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {order.status === 'COMPLETED' && !(order.reviews?.length > 0) && (
            <button
              onClick={onWriteReview}
              className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Star size={18} className="fill-white"/> Viết đánh giá
            </button>
          )}

          {order.status === 'CANCELLED' && order.cancel_reason && (
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Lý do hủy từ người bán</p>
                <p className="text-sm text-red-700">{order.cancel_reason}</p>
              </div>
            </div>
          )}

          {order.status === 'ISSUE_REPORTED' && (
            <div className="flex items-start gap-3 bg-orange-50 rounded-xl p-4 border border-orange-200">
              <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Đang xử lý sự cố</p>
                <p className="text-sm text-orange-700">{order.note || 'Báo cáo chưa nhận hàng đã gửi đến người bán. Vui lòng chờ xác nhận từ người bán.'}</p>
              </div>
            </div>
          )}

          {order.status === 'FAILED' && (
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
              <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Giao hàng thất bại</p>
                <p className="text-sm text-red-700">
                  {isCOD
                    ? 'Hàng đã xác nhận thất lạc. Do bạn chọn thanh toán COD, bạn không mất tiền cho đơn này.'
                    : order.payments?.[0]?.status === 'REFUNDING'
                    ? 'Hàng đã xác nhận thất lạc. Hệ thống đang hoàn lại tiền cho bạn trong 3–5 ngày làm việc.'
                    : order.payments?.[0]?.status === 'REFUNDED'
                    ? 'Tiền đã được hoàn lại thành công vào tài khoản của bạn.'
                    : 'Đơn hàng đã giao thất bại. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.'
                  }
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BUYER CANCEL DIALOG
   ============================================================ */
function BuyerCancelDialog({
  loading, onClose, onConfirm
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Hủy đơn hàng?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Đơn hàng chỉ có thể hủy khi đang ở trạng thái <span className="font-semibold text-amber-600">Chờ xác nhận</span>.
              Bạn chắc chắn muốn hủy?
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
            >
              Giữ đơn
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO FIELD COMPONENT
   ============================================================ */
function InfoField({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        {icon} {label}
      </p>
      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 font-medium text-gray-800 text-sm">
        {value || <span className="text-gray-400 italic">Chưa cập nhật</span>}
      </div>
    </div>
  );
}

/* ============================================================
   WRITE REVIEW DIALOG — Per-product with image upload
   ============================================================ */
type ProductReview = {
  product_id: string;
  rating: number;
  comment: string;
  images: File[];
  previews: string[];
};

function WriteReviewDialog({
  order,
  onClose,
  onSubmit,
}: {
  order: any;
  onClose: () => void;
  onSubmit: (orderId: string, reviews: { product_id: string; rating: number; comment: string; images: File[] }[]) => Promise<void>;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const shopName = order.seller?.profile?.store_name || order.seller?.full_name || 'Agri Shop';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Khởi tạo state đánh giá riêng cho từng sản phẩm
  const [reviews, setReviews] = useState<Record<string, ProductReview>>(() => {
    const init: Record<string, ProductReview> = {};
    (order.order_items || []).forEach((item: any) => {
      init[item.id] = {
        product_id: item.product?.id ?? item.id,
        rating: 5,
        comment: '',
        images: [],
        previews: [],
      };
    });
    return init;
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const setRating = (itemId: string, val: number) =>
    setReviews(prev => ({ ...prev, [itemId]: { ...prev[itemId], rating: val } }));

  const setComment = (itemId: string, val: string) =>
    setReviews(prev => ({ ...prev, [itemId]: { ...prev[itemId], comment: val } }));

  const addImages = (itemId: string, files: FileList) => {
    const newFiles = Array.from(files).slice(0, 4 - reviews[itemId].images.length);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setReviews(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        images: [...prev[itemId].images, ...newFiles],
        previews: [...prev[itemId].previews, ...newPreviews],
      },
    }));
  };

  const removeImage = (itemId: string, idx: number) => {
    setReviews(prev => {
      const r = prev[itemId];
      return {
        ...prev,
        [itemId]: {
          ...r,
          images: r.images.filter((_, i) => i !== idx),
          previews: r.previews.filter((_, i) => i !== idx),
        },
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = Object.values(reviews);
      await onSubmit(order.id, payload);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi khi gửi đánh giá. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  const ratingLabel = (r: number) =>
    r === 1 ? 'Rất tệ' : r === 2 ? 'Tệ' : r === 3 ? 'Bình thường' : r === 4 ? 'Tốt' : 'Xuất sắc';

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Đánh giá sản phẩm</h3>
            <p className="text-xs text-gray-400 mt-0.5">{shopName} · #{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(order.order_items || []).map((item: any) => {
            const r = reviews[item.id];
            if (!r) return null;
            return (
              <div key={item.id} className="border border-gray-100 rounded-2xl p-4 space-y-4 bg-gray-50/50">
                {/* Thông tin sản phẩm */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border flex-shrink-0 bg-white">
                    <Image src={item.product?.images?.[0] ?? '/placeholder.png'} alt="" fill className="object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug">{item.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">x{item.quantity} · {item.product?.unit}</p>
                  </div>
                </div>

                {/* Chọn số sao */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Chất lượng</p>
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        onClick={() => setRating(item.id, s)}
                        className={`text-3xl transition-transform hover:scale-110 active:scale-95 ${
                          s <= r.rating ? 'text-yellow-400' : 'text-gray-200'
                        }`}
                      >★</button>
                    ))}
                    <span className="text-sm font-semibold text-gray-500 ml-1">{ratingLabel(r.rating)}</span>
                  </div>
                </div>

                {/* Nhận xét */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nhận xét</p>
                  <textarea
                    rows={3}
                    value={r.comment}
                    onChange={e => setComment(item.id, e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm text-gray-700 resize-none bg-white"
                  />
                </div>

                {/* Tải ảnh lên */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Hình ảnh thực tế
                    <span className="text-gray-300 font-normal ml-1">({r.previews.length}/4)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.previews.map((src, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                        <Image src={src} alt="" fill className="object-cover"/>
                        <button
                          onClick={() => removeImage(item.id, idx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10}/>
                        </button>
                      </div>
                    ))}
                    {r.previews.length < 4 && (
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span className="text-[10px] text-gray-400 mt-1">Thêm ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => e.target.files && addImages(item.id, e.target.files)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-green-600/20"
          >
            {loading
              ? <Loader2 className="animate-spin" size={18}/>
              : <><Star size={18} className="fill-white"/> Gửi {order.order_items?.length > 1 ? `${order.order_items.length} đánh giá` : 'đánh giá'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}