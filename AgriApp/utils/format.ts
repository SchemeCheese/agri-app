export const formatPrice = (value?: number) => {
  if (typeof value !== 'number') return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
};

export const formatUnitPrice = (price?: number, unit?: string) => {
  return `${formatPrice(price)}/${unit ?? 'kg'}`;
};
