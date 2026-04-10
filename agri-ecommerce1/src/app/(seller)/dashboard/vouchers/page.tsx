'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Ticket, Trash2, Edit2, X, Loader2, CheckCircle2, AlertCircle, Tag, Clock, ToggleLeft, ToggleRight, History, User2, ShoppingBag } from 'lucide-react';
import api from '@/lib/axios';

interface Voucher {
  id: string;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  valid_from: string;
  valid_to: string;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

const emptyForm = {
  code: '',
  discount_type: 'PERCENT' as 'PERCENT' | 'FIXED',
  discount_value: 10,
  min_order_value: 100000,
  max_discount_amount: 50000,
  valid_from: '',
  valid_to: '',
  usage_limit: 100,
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [usageModal, setUsageModal] = useState<{ open: boolean; voucherId: string; code: string } | null>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const fetchVouchers = () => {
    setLoading(true);
    api.get('/vouchers/mine')
      .then(res => setVouchers(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Vouchers error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSaveError('');
    setShowForm(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingId(v.id);
    setForm({
      code: v.code,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      min_order_value: v.min_order_value,
      max_discount_amount: v.max_discount_amount,
      valid_from: v.valid_from ? v.valid_from.slice(0, 16) : '',
      valid_to: v.valid_to ? v.valid_to.slice(0, 16) : '',
      usage_limit: v.usage_limit,
    });
    setSaveError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setSaveError('Vui lòng nhập mã voucher.'); return; }
    if (!form.valid_from || !form.valid_to) { setSaveError('Vui lòng nhập thời hạn sử dụng.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        valid_from: new Date(form.valid_from).toISOString(),
        valid_to: new Date(form.valid_to).toISOString(),
      };
      if (editingId) {
        await api.patch(`/vouchers/${editingId}`, payload);
      } else {
        await api.post('/vouchers', payload);
      }
      setShowForm(false);
      fetchVouchers();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Lỗi khi lưu voucher.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Xóa mã voucher "${code}"?`)) return;
    try {
      await api.delete(`/vouchers/${id}`);
      fetchVouchers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa voucher.');
    }
  };

  const handleToggle = async (v: Voucher) => {
    setToggleLoading(v.id);
    try {
      await api.patch(`/vouchers/${v.id}`, { is_active: !v.is_active });
      setVouchers(prev => prev.map(x => x.id === v.id ? { ...x, is_active: !v.is_active } : x));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleOpenUsage = async (v: Voucher) => {
    setUsageModal({ open: true, voucherId: v.id, code: v.code });
    setUsageHistory([]);
    setLoadingUsage(true);
    try {
      const res = await api.get(`/vouchers/${v.id}/usage`);
      setUsageHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Usage history error:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const isExpired = (validTo: string) => new Date(validTo) < new Date();
  const isActive = (v: Voucher) => v.is_active && !isExpired(v.valid_to) && v.used_count < v.usage_limit;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mã Giảm Giá</h1>
          <p className="text-gray-500 mt-2 font-medium">Tạo và quản lý các voucher khuyến mãi cho shop của bạn.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all active:scale-95"
        >
          <Plus size={20} /> Tạo voucher mới
        </button>
      </div>

      {/* Voucher List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20 px-6">
          <Ticket className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-semibold text-lg">Chưa có mã giảm giá nào</p>
          <p className="text-gray-400 text-sm mt-1">Tạo voucher đầu tiên để thu hút khách hàng!</p>
          <button onClick={handleOpenCreate} className="mt-6 inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all text-sm">
            <Plus size={16} /> Tạo ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {vouchers.map((v) => {
            const active = isActive(v);
            const expired = isExpired(v.valid_to);
            return (
              <div key={v.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  active ? 'border-green-200' : 'border-gray-100 opacity-70'
                }`}
              >
                {/* Top bar */}
                <div className={`px-5 py-3 flex items-center justify-between ${active ? 'bg-green-600' : expired ? 'bg-red-400' : !v.is_active ? 'bg-gray-500' : 'bg-amber-500'}`}>
                  <div className="flex items-center gap-2 text-white">
                    <Tag size={16} />
                    <span className="font-black tracking-widest text-lg">{v.code}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {active ? '✓ Đang hoạt động' : expired ? 'Hết hạn' : !v.is_active ? 'Đã tắt' : 'Hết lượt'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Giá trị giảm</p>
                      <p className="text-2xl font-black text-green-600">
                        {v.discount_type === 'PERCENT'
                          ? `${v.discount_value}%`
                          : `${v.discount_value.toLocaleString()}đ`
                        }
                      </p>
                      {v.discount_type === 'PERCENT' && v.max_discount_amount > 0 && (
                        <p className="text-xs text-gray-400">Tối đa {v.max_discount_amount.toLocaleString()}đ</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Đơn tối thiểu</p>
                      <p className="text-sm font-bold text-gray-700">{v.min_order_value.toLocaleString()}đ</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-100 pt-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{new Date(v.valid_from).toLocaleDateString('vi-VN')} — {new Date(v.valid_to).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Đã dùng: <strong className="text-gray-700">{v.used_count}</strong> / {v.usage_limit}</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (v.used_count / v.usage_limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleOpenEdit(v)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                      <Edit2 size={13} /> Sửa
                    </button>
                    <button
                      onClick={() => handleToggle(v)}
                      disabled={toggleLoading === v.id}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-colors ${
                        v.is_active
                          ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
                          : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'
                      } disabled:opacity-50`}
                    >
                      {toggleLoading === v.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : v.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      {v.is_active ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => handleOpenUsage(v)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
                      <History size={13} /> Lịch sử
                    </button>
                    <button onClick={() => handleDelete(v.id, v.code)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage History Modal */}
      {usageModal?.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <History size={18} className="text-blue-500" />
                  Lịch sử sử dụng — <span className="text-blue-600 font-black tracking-widest">{usageModal.code}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Danh sách các đơn hàng đã áp dụng mã này</p>
              </div>
              <button onClick={() => setUsageModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingUsage ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                </div>
              ) : usageHistory.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto text-gray-200 mb-3" size={40} />
                  <p className="text-gray-500 font-semibold">Chưa có ai sử dụng mã này</p>
                  <p className="text-gray-400 text-sm mt-1">Chia sẻ voucher của bạn để thu hút khách hàng!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase px-1">
                    <span className="w-5">#</span>
                    <span className="flex-1">Khách hàng</span>
                    <span className="w-32 text-right">Đơn hàng</span>
                    <span className="w-28 text-right">Trị giá đơn</span>
                    <span className="w-24 text-right">Tiết kiệm</span>
                    <span className="w-28 text-right">Ngày dùng</span>
                  </div>
                  {usageHistory.map((entry: any, idx: number) => (
                    <div key={entry.order_id ?? idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                      <span className="w-5 text-gray-400 font-bold text-xs">{idx + 1}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <User2 size={13} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{entry.buyer_name || 'Khách hàng'}</p>
                          <p className="text-gray-400 text-xs">{entry.buyer_email || ''}</p>
                        </div>
                      </div>
                      <span className="w-32 text-right text-xs font-mono text-blue-600">#{(entry.order_id || '').toString().slice(-8).toUpperCase()}</span>
                      <span className="w-28 text-right font-semibold text-gray-700">{Number(entry.order_total || 0).toLocaleString()}đ</span>
                      <span className="w-24 text-right font-bold text-green-600">-{Number(entry.discount_applied || 0).toLocaleString()}đ</span>
                      <span className="w-28 text-right text-xs text-gray-400">
                        {entry.used_at ? new Date(entry.used_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-bold px-1">
                    <span className="text-gray-500">Tổng {usageHistory.length} lượt dùng</span>
                    <span className="text-green-600">
                      Đã tiết kiệm: {usageHistory.reduce((s, e) => s + Number(e.discount_applied || 0), 0).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={() => setUsageModal(null)}
                className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{editingId ? 'Sửa voucher' : 'Tạo voucher mới'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Điền thông tin mã giảm giá</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Mã voucher */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Mã voucher *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VD: GIAM10, FREESHIP..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 focus:bg-white outline-none text-sm font-bold tracking-widest uppercase"
                />
              </div>

              {/* Loại & Giá trị */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Loại giảm</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm({ ...form, discount_type: e.target.value as 'PERCENT' | 'FIXED' })}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm font-semibold"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Giá trị {form.discount_type === 'PERCENT' ? '(%)' : '(đ)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={form.discount_type === 'PERCENT' ? 100 : undefined}
                    value={form.discount_value}
                    onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Đơn tối thiểu & Giảm tối đa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Đơn tối thiểu (đ)</label>
                  <input
                    type="number" min={0}
                    value={form.min_order_value}
                    onChange={e => setForm({ ...form, min_order_value: Number(e.target.value) })}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm font-semibold"
                  />
                </div>
                {form.discount_type === 'PERCENT' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Giảm tối đa (đ)</label>
                    <input
                      type="number" min={0}
                      value={form.max_discount_amount}
                      onChange={e => setForm({ ...form, max_discount_amount: Number(e.target.value) })}
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Từ ngày *</label>
                  <input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={e => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Đến ngày *</label>
                  <input
                    type="datetime-local"
                    value={form.valid_to}
                    onChange={e => setForm({ ...form, valid_to: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Số lượt dùng */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Số lượt sử dụng tối đa</label>
                <input
                  type="number" min={1}
                  value={form.usage_limit}
                  onChange={e => setForm({ ...form, usage_limit: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-green-500 outline-none text-sm font-semibold"
                />
              </div>

              {/* Preview */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-bold text-green-700 uppercase mb-2">Xem trước</p>
                <p className="text-sm text-green-800">
                  Mã <strong>{form.code || 'VOUCHER'}</strong> — Giảm{' '}
                  <strong>{form.discount_type === 'PERCENT' ? `${form.discount_value}%` : `${Number(form.discount_value).toLocaleString()}đ`}</strong>
                  {form.discount_type === 'PERCENT' && form.max_discount_amount > 0 && ` (tối đa ${Number(form.max_discount_amount).toLocaleString()}đ)`}
                  {' '}cho đơn từ <strong>{Number(form.min_order_value).toLocaleString()}đ</strong>
                </p>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <AlertCircle size={16} /> {saveError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/20 disabled:opacity-70">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
