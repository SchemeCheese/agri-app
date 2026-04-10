import React from 'react';

interface OrderFilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
];

export const OrderFilter = ({ currentFilter, onFilterChange }: OrderFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            currentFilter === f.id
              ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
              : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};