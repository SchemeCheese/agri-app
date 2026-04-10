import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
  isNegative?: boolean;
  loading?: boolean;
}

export const StatCard = ({ title, value, trend, trendLabel = 'so với tháng trước', icon, color, isNegative, loading }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
      ) : (
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      )}
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full mt-2 inline-block ${
          isNegative ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {trend} {trendLabel}
        </span>
      )}
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} shadow-lg`}>
      {icon}
    </div>
  </div>
);
