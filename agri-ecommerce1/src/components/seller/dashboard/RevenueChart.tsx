'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: { name: string; revenue: number }[];
}

const formatM = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;
const formatVND = (v: number | string | readonly (number | string)[] | null | undefined) => {
  const raw = Array.isArray(v) ? v[0] : v;
  const num = typeof raw === 'number' ? raw : raw ? Number(raw) : 0;
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('vi-VN') + 'đ';
};

export const RevenueChart = ({ data }: RevenueChartProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="font-bold text-gray-800 mb-6">Biểu đồ doanh thu theo tháng</h3>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={formatM} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [formatVND(value), 'Doanh thu']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#16a34a" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    {data.length === 0 && (
      <p className="text-center text-sm text-gray-400 py-8">Chưa có dữ liệu doanh thu.</p>
    )}
  </div>
);
