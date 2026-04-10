import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode; // Nút bấm bên phải (VD: Thêm mới)
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};