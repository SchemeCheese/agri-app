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
  const normalizeText = (value?: string) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const normalizedKeyword = normalizeText(keyword);

  return useMemo(() => {
    return products.filter((product) => {
      const productName = normalizeText(product.name);
      const origin = normalizeText(product.origin);
      const shopName = normalizeText(product.shopName ?? product.shop?.store_name);

      const matchKeyword =
        normalizedKeyword.length === 0 ||
        productName.includes(normalizedKeyword) ||
        origin.includes(normalizedKeyword) ||
        shopName.includes(normalizedKeyword);

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
