import api from './client';

export type ProductReview = {
  id: string;
  userName: string;
  avatar?: string | null;
  rating: number;
  comment?: string | null;
  date: string;
  images?: string[];
};

export type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  category: string;
  origin?: string;
  images: string[];
  description?: string;
  stock?: number;
  shopName?: string;
  seller_id?: string;
  is_active?: boolean;
  rating?: number;
  reviewCount?: number;
  averageRating?: number;
  reviews?: ProductReview[];
  sold?: number;
  min_negotiation_qty?: number | null;
  shop?: {
    id: string;
    store_name?: string;
    avatar_url?: string | null;
    location?: string | null;
    description?: string | null;
    isVerified?: boolean;
  };
};

export type CategorySummary = {
  id: string;
  name: string;
  count: number;
};

export type ShopSearchResult = {
  id: string;
  store_name: string;
  owner_name?: string;
  is_verified?: boolean;
  avatar_url?: string | null;
  rating?: number;
  total_reviews?: number;
  product_count?: number;
};

export type CombinedSearchResult = {
  shops: ShopSearchResult[];
  products: Product[];
  categories: { id: number; name: string; product_count: number }[];
};

export type SellerDetail = {
  id: string;
  full_name?: string;
  averageRating?: number;
  totalSold?: number;
  shop?: {
    name?: string;
    store_name?: string;
    avatar?: string | null;
    avatar_url?: string | null;
    location?: string;
    store_address?: string;
    address?: string;
    description?: string;
    store_description?: string;
    isVerified?: boolean;
    trust_status?: 'VERIFIED' | 'NORMAL' | 'WARNING' | 'RESTRICTED';
    rating?: number;
    reviewCount?: number;
    totalSold?: number;
    totalProducts?: number;
    joinDate?: string;
    banners?: string[];
  };
  products?: Product[];
};

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<Product[]>('/products');
  return data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
};

export const getSellerById = async (id: string): Promise<SellerDetail> => {
  const { data } = await api.get<any>(`/shops/${id}`);
  return {
    id: data.id,
    full_name: data.owner_name ?? data.full_name,
    averageRating: data.avg_rating,
    totalSold: data.total_sales,
    shop: {
      name: data.store_name,
      store_name: data.store_name,
      avatar: data.avatar_url,
      avatar_url: data.avatar_url,
      location: data.shop_location_name ?? data.address ?? data.store_address,
      store_address: data.store_address,
      address: data.address,
      description: data.description,
      store_description: data.description,
      isVerified: data.is_verified,
      trust_status: data.trust_status,
      rating: data.avg_rating,
      reviewCount: data.total_reviews,
      totalSold: data.total_sales,
      totalProducts: data.products?.length ?? 0,
      banners: Array.isArray(data.banners) ? data.banners.slice(0, 3) : [],
    },
    products: data.products ?? [],
  };
};

export const searchAll = async (keyword: string): Promise<CombinedSearchResult> => {
  const { data } = await api.get<CombinedSearchResult>('/search', { params: { q: keyword } });
  return {
    shops: data.shops ?? [],
    products: data.products ?? [],
    categories: data.categories ?? [],
  };
};

export const buildCategoriesFromProducts = (products: Product[]): CategorySummary[] => {
  const groups = new Map<string, number>();

  products.forEach((product) => {
    const category = product.category?.trim() || 'Khac';
    groups.set(category, (groups.get(category) ?? 0) + 1);
  });

  return Array.from(groups.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], index) => ({
      id: `${name}-${index}`,
      name,
      count,
    }));
};
