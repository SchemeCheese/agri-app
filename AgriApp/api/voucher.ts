import api from './client';

export type VoucherDiscountType = 'PERCENT' | 'FIXED';

export type ShopVoucher = {
  id: string;
  code: string;
  discount_type: VoucherDiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount_amount: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  used_count?: number;
  is_active?: boolean;
};

export const getShopVouchers = async (accessToken: string, shopId: string) => {
  const response = await api.get<ShopVoucher[]>(`/vouchers/shop/${shopId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return Array.isArray(response.data) ? response.data : [];
};

export const saveVoucher = async (accessToken: string, voucherId: string) => {
  return api.post(
    `/vouchers/save/${voucherId}`,
    {},
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
};
