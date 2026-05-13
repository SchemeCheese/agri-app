import api from './client';
import { Product } from './product';

export type RecommendationContext = 'home' | 'detail' | 'product_detail' | 'chat' | 'cart';

type RecommendationApiItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  images?: string[];
  shop?: {
    id: string;
    store_name?: string;
    avatar_url?: string | null;
  };
  recommendation?: {
    reason?: string;
  };
};

type RecommendationResponse = {
  items?: RecommendationApiItem[];
};

const mapRecommendationToProduct = (item: RecommendationApiItem): Product => ({
  id: item.id,
  name: item.name,
  price: Number(item.price || 0),
  unit: item.unit,
  category: item.category,
  images: item.images ?? [],
  shopName: item.shop?.store_name,
  shop: item.shop
    ? {
        id: item.shop.id,
        store_name: item.shop.store_name,
        avatar_url: item.shop.avatar_url,
      }
    : undefined,
});

export const getRecommendations = async (
  accessToken: string,
  context: RecommendationContext,
  targetId?: string,
): Promise<Product[]> => {
  const normalizedContext = context === 'detail' ? 'detail' : context;

  const { data } = await api.get<RecommendationResponse>('/recommendations/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      context: normalizedContext,
      targetId,
      limit: 12,
    },
  });

  return (data.items ?? []).map(mapRecommendationToProduct);
};
