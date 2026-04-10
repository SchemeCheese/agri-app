'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';
import {
  Package, Search, Loader2, X, User, Phone, MapPin,
  Clock, CheckCircle2, Truck, PackageCheck, XCircle,
  CreditCard, AlertTriangle, RefreshCw, ShieldAlert
} from 'lucide-react';
import { OrderTimeline } from '@/components/ui/OrderTimeline';

/* ─────────────────────── TYPES ─────────────────────── */
interface OrderItem {
  id: string;
  quantity: number;
  negotiated_price: string;
  product: { name: string; unit: string; images: string[] };
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED' | 'ISSUE_REPORTED' | 'FAILED';
  shipping_address: string;
  final_total_price: string;
  created_at: string;
  shipped_at?: string;
  cancel_reason?: string;
  note?: string;
  buyer: { full_name: string; email: string; phone_number?: string };
  order_items: OrderItem[];
  payments: { status: string; payment_method: string }[];
}

/* ─────────────────────── CONSTANTS ─────────────────────── */
const TABS = [
  { id: 'ALL',            label: 'Tất cả'           },
  { id: 'PENDING',        label: 'Chờ xác nhận'     },
  { id: 'CONFIRMED',      label: 'Chờ vận chuyển'   },
  { id: 'SHIPPING',       label: 'Đang giao'         },
  { id: 'COMPLETED',      label: 'Đã giao'           },
  { id: 'ISSUE_REPORTED', label: 'Có sự cố'          },
  { id: 'CANCELLED',      label: 'Đã hủy'            },
  { id: 'FAILED',         label: 'Thất lạc'          },
];

const STATUS_STYLE: Record<string, { text: string; cls: string; icon: React.ReactNode }> = {
  PENDING:        { text: 'Chờ xác nhận',   cls: 'text-amber-600 bg-amber-50 border border-amber-200',      icon: <Clock size={12}/>           },
  CONFIRMED:      { text: 'Chờ vận chuyển', cls: 'text-blue-600 bg-blue-50 border border-blue-200',          icon: <CheckCircle2 size={12}/>    },
  SHIPPING:       { text: 'Đang giao',      cls: 'text-purple-600 bg-purple-50 border border-purple-200',    icon: <Truck size={12}/>           },
  COMPLETED:      { text: 'Đã giao',        cls: 'text-green-600 bg-green-50 border border-green-200',       icon: <PackageCheck size={12}/>    },
  ISSUE_REPORTED: { text: 'Có sự cố',       cls: 'text-orange-600 bg-orange-50 border border-orange-200',    icon: <AlertTriangle size={12}/>   },
  FAILED:         { text: 'Thất lạc',       cls: 'text-red-600 bg-red-50 border border-red-200',             icon: <XCircle size={12}/>         },
  CANCELLED:      { text: 'Đã hủy',         cls: 'text-red-500 bg-red-50 border border-red-200',             icon: <XCircle size={12}/>         },
};

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function SellerOrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('ALL');
  const [search, setSearch]               = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/seller-orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* Counts per tab */
  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.id] = tab.id === 'ALL'
      ? orders.length
      : orders.filter(o => o.status === tab.id).length;
    return acc;
  }, {});

  /* Filtered list */
  const filtered = orders.filter(o => {
    const matchTab    = activeTab === 'ALL' || o.status === activeTab;
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer.full_name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  /* ── Action handlers ── */
  const handleConfirm = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/confirm`);
      await fetchOrders();
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  const handleShip = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/ship`);
      await fetchOrders();
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  const handleCancel = async (orderId: string, reason: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/cancel`, { reason });
      await fetchOrders();
      setShowCancelDialog(false);
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  const handleConfirmLost = async (orderId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${orderId}/confirm-lost`);
      await fetchOrders();
      setSelectedOrder(null);
    } finally { setActionLoading(false); }
  };

  /* Refresh selected order khi danh sách thay đổi */
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Đơn hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý và xử lý đơn hàng của bạn.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-64 shadow-sm text-sm"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 shadow-sm text-sm"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center py-24 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="animate-spin text-green-600 mb-3" size={32} />
          <p className="text-sm text-gray-400">Đang tải đơn hàng...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <Package size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Không có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="p-4 pl-6">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE['CANCELLED'];
                  const isIssue = order.status === 'ISSUE_REPORTED';
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50/80 transition-colors group ${isIssue ? 'bg-orange-50/40' : ''}`}>
                      <td className="p-4 pl-6 font-mono font-bold text-gray-900 text-xs">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {order.buyer.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{order.buyer.full_name}</p>
                            <p className="text-xs text-gray-400">{order.buyer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-800 line-clamp-1">
                          {order.order_items[0]?.product?.name}
                        </p>
                        {order.order_items.length > 1 && (
                          <p className="text-xs text-gray-400">+{order.order_items.length - 1} món khác</p>
                        )}
                      </td>
                      <td className="p-4 font-bold text-green-600">
                        {Number(order.final_total_price).toLocaleString()}đ
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>
                          {s.icon} {s.text}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all opacity-70 group-hover:opacity-100 ${
                            isIssue
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-gray-900 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {isIssue ? '⚠ Xử lý sự cố' : 'Xem chi tiết'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && !showCancelDialog && (
        <SellerOrderDialog
          order={selectedOrder}
          actionLoading={actionLoading}
          onClose={() => setSelectedOrder(null)}
          onConfirm={() => handleConfirm(selectedOrder.id)}
          onShip={() => handleShip(selectedOrder.id)}
          onCancelClick={() => setShowCancelDialog(true)}
          onConfirmLost={() => handleConfirmLost(selectedOrder.id)}
        />
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && selectedOrder && (
        <CancelReasonDialog
          loading={actionLoading}
          onClose={() => setShowCancelDialog(false)}
          onSubmit={(reason) => handleCancel(selectedOrder.id, reason)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════ SELLER ORDER DIALOG ═══════════════════════ */
function SellerOrderDialog({
  order, actionLoading, onClose, onConfirm, onShip, onCancelClick, onConfirmLost
}: {
  order: Order;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onShip: () => void;
  onCancelClick: () => void;
  onConfirmLost: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE['CANCELLED'];
  const payMethod = order.payments?.[0]?.payment_method;
  const payStatus = order.payments?.[0]?.status;
  const isCOD     = payMethod === 'COD';

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Chi tiết đơn hàng</h3>
            <p className="text-xs font-mono text-gray-400 mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Timeline */}
          <OrderTimeline currentStatus={order.status} />

          {/* Badge trạng thái + ngày */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.cls}`}>
              {s.icon} {s.text}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </span>
          </div>

          {/* Thông tin người mua */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin người nhận</p>
            <InfoRow icon={<User size={13} className="text-green-600"/>}       label="Người nhận"    value={order.buyer.full_name} />
            <InfoRow icon={<Phone size={13} className="text-blue-600"/>}       label="Liên hệ"       value={order.buyer.phone_number || order.buyer.email} />
            <InfoRow icon={<MapPin size={13} className="text-amber-600"/>}     label="Địa chỉ"       value={order.shipping_address} />
            <InfoRow icon={<CreditCard size={13} className="text-purple-600"/>} label="Thanh toán"
              value={`${payMethod || 'COD'}${payStatus === 'SUCCESS' ? ' · Đã thanh toán' : ''}`}
            />
          </div>

          {/* Lý do hủy */}
          {order.status === 'CANCELLED' && order.cancel_reason && (
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Lý do hủy</p>
                <p className="text-sm text-red-700">{order.cancel_reason}</p>
              </div>
            </div>
          )}

          {/* Danh sách sản phẩm */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Sản phẩm ({order.order_items.length} món)
            </p>
            <div className="space-y-3">
              {order.order_items.map(item => (
                <div key={item.id} className="flex gap-3 items-center p-3 rounded-xl border border-gray-100">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                    <Image src={item.product?.images?.[0] ?? '/placeholder.png'} alt={item.product?.name || ''} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.product?.unit} · x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-black text-green-600 flex-shrink-0">
                    {(Number(item.negotiated_price) * item.quantity).toLocaleString()}đ
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-between text-white">
            <div>
              <p className="text-xs text-gray-400">Tổng thanh toán</p>
              <p className="text-xl font-black text-green-400">{Number(order.final_total_price).toLocaleString()}đ</p>
            </div>
            <p className="text-xs text-gray-400">{order.order_items.length} sản phẩm</p>
          </div>

          {/* ── Nút hành động theo status ── */}
          {order.status === 'PENDING' && (
            <div className="flex gap-3 pt-1">
              <button onClick={onCancelClick} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50">
                Hủy đơn
              </button>
              <button onClick={onConfirm} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-green-600/20">
                {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle2 size={18}/> Xác nhận đơn</>}
              </button>
            </div>
          )}

          {order.status === 'CONFIRMED' && (
            <div className="flex gap-3 pt-1">
              <button onClick={onCancelClick} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50">
                Hủy đơn
              </button>
              <button onClick={onShip} disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-blue-600/20">
                {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <><Truck size={18}/> Gửi đơn hàng</>}
              </button>
            </div>
          )}

          {order.status === 'SHIPPING' && (
            <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4 border border-purple-100">
              <Truck size={18} className="text-purple-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-purple-700">
                Đơn đang trên đường giao — chờ người mua xác nhận đã nhận hàng.
              </p>
            </div>
          )}

          {/* ── ISSUE_REPORTED ── */}
          {order.status === 'ISSUE_REPORTED' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-orange-50 rounded-xl p-4 border border-orange-200">
                <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">⚠ Người mua báo chưa nhận hàng</p>
                  <p className="text-sm text-orange-700">
                    {order.note || 'Người mua đã báo cáo chưa nhận được hàng. Vui lòng đối soát với bên vận chuyển rồi xác nhận.'}
                  </p>
                  {order.buyer?.full_name && (
                    <p className="text-xs text-orange-600 mt-1.5 font-semibold">Người mua: {order.buyer.full_name}</p>
                  )}
                  {payMethod && (
                    <p className="text-xs text-orange-600 font-semibold">Thanh toán: {({'COD':'Tiền mặt (COD)','MOMO':'Ví MoMo','ZALOPAY':'ZaloPay','QR_CODE':'QR/Chuyển khoản'} as Record<string,string>)[payMethod] || payMethod}</p>
                  )}
                </div>
              </div>
              {!isCOD && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <ShieldAlert size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Đơn này thanh toán online — nếu xác nhận thất lạc, hệ thống sẽ tự động chuyển trạng thái hoàn tiền (<span className="font-bold">REFUNDING</span>) và gửi email thông báo cho người mua.
                  </p>
                </div>
              )}
              <button
                onClick={onConfirmLost}
                disabled={actionLoading}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-orange-500/20"
              >
                {actionLoading
                  ? <Loader2 className="animate-spin" size={18}/>
                  : <><AlertTriangle size={18}/> Xác nhận thất lạc</>}
              </button>
            </div>
          )}

          {/* ── FAILED ── */}
          {order.status === 'FAILED' && (
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-200">
              <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Giao hàng thất lạc</p>
                <p className="text-sm text-red-700">
                  {isCOD
                    ? 'Đơn thất lạc đã được xác nhận. Không có hoàn tiền vì người mua chọn COD.'
                    : payStatus === 'REFUNDING'
                    ? 'Hệ thống đang xử lý hoàn tiền cho người mua (3–5 ngày làm việc).'
                    : payStatus === 'REFUNDED'
                    ? 'Hoàn tiền đã hoàn tất thành công.'
                    : 'Đơn hàng thất lạc đã được xác nhận.'
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

/* ═══════════════════════ CANCEL DIALOG ═══════════════════════ */
function CancelReasonDialog({
  loading, onClose, onSubmit
}: {
  loading: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Hủy đơn hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Email thông báo sẽ gửi đến người mua</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Lý do hủy đơn <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Ví dụ: Sản phẩm hiện đã hết hàng, xin lỗi vì sự bất tiện..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-red-400 focus:bg-white outline-none text-sm resize-none transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{reason.length}/500</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Hệ thống sẽ tự động gửi email xin lỗi kèm lý do đến người mua.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
              Quay lại
            </button>
            <button
              onClick={() => reason.trim() && onSubmit(reason.trim())}
              disabled={loading || !reason.trim()}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={16}/> : <><XCircle size={16}/> Xác nhận hủy</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ HELPER ═══════════════════════ */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 leading-snug mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}