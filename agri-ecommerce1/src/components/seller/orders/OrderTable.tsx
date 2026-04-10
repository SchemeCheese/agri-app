import React from 'react';
import { Order } from '@/data/orders';
import { formatCurrency } from '@/utils/vi';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Eye, Printer, MoreHorizontal } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
}

export const OrderTable = ({ orders }: OrderTableProps) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500">Không tìm thấy đơn hàng nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="p-4 pl-6">Mã Đơn</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 pr-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="p-4 pl-6 font-mono font-bold text-gray-900">{order.id}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {order.customer.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-700">{order.customer}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.product}</p>
                    <p className="text-xs text-gray-400">Số lượng: x{order.quantity}</p>
                  </div>
                </td>
                <td className="p-4 font-bold text-green-600">{formatCurrency(order.total)}</td>
                <td className="p-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="In phiếu">
                      <Printer size={18} />
                    </button>
                    <button className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="Xem chi tiết">
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};