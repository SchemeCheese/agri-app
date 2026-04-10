import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  buildCategoriesFromProducts,
  getProductById,
  getProducts,
  Product,
} from '@/api/product';

export const useProducts = () => {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const categories = useMemo(
    () => buildCategoriesFromProducts(productsQuery.data ?? []),
    [productsQuery.data],
  );

  return {
    ...productsQuery,
    categories,
    products: productsQuery.data ?? [],
  };
};

export const useProductSearch = (
  products: Product[],
  keyword: string,
  selectedCategory?: string,
) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return useMemo(() => {
    return products.filter((product) => {
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.origin?.toLowerCase().includes(normalizedKeyword) ||
        product.shopName?.toLowerCase().includes(normalizedKeyword);

      const matchCategory =
        !selectedCategory || selectedCategory === 'Tất cả'
          ? true
          : product.category === selectedCategory;

      return matchKeyword && matchCategory;
    });
  }, [normalizedKeyword, products, selectedCategory]);
};

export const useProductDetail = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
  });
};
