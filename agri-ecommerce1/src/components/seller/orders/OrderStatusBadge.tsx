import React from 'react';
import { OrderStatus } from '@/data/orders';

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  shipping: { label: 'Đang giao', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Hoàn thành', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${config.className}`}>
      {config.label}
    </span>
  );
};