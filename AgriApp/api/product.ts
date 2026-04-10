import api from './client';

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
  sold?: number;
  min_negotiation_qty?: number | null;
  shop?: {
    id: string;
    store_name?: string;
    avatar_url?: string | null;
    location?: string | null;
  };
};

export type CategorySummary = {
  id: string;
  name: string;
  count: number;
};

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get<Product[]>('/products');
  return data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
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