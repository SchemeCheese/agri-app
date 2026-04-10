import { useState, useCallback } from 'react';
import api from '@/lib/axios';

export interface SellerProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  stock: number;
  description?: string;
  images: string[];
  category?: string;
  unit?: string;
  origin?: string;
  rating?: number;
  sold?: number;
  is_active?: boolean;
  created_at: string;
  /** null = không cho phép thương lượng; > 0 = ngưỡng tối thiểu */
  min_negotiation_qty?: number | null;
}

export interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  description?: string;
  unit?: string;
  category?: string;
  origin?: string;
  images?: string[];
  image_urls?: string[]; // optional remote URLs user pasted
  /** null = không cho phép thương lượng; số > 0 = ngưỡng tối thiểu */
  min_negotiation_qty?: number | null;
}

export function useSellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products/my-products');
      setProducts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (data: ProductFormData, imageFiles: File[]) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', String(data.price));
    formData.append('stock', String(data.stock));
    if (data.description) formData.append('description', data.description);
    if (data.unit)        formData.append('unit', data.unit);
    if (data.category)    formData.append('category', data.category);
    if (data.origin)      formData.append('origin', data.origin);
    if (data.min_negotiation_qty != null)
      formData.append('min_negotiation_qty', String(data.min_negotiation_qty));
    data.image_urls?.forEach((url) => formData.append('image_urls', url));
    imageFiles.forEach(f => formData.append('images', f));

    const res = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // refresh list so dashboard cập nhật ngay
    await fetchProducts();
    return res.data;
  };

  const updateProduct = async (id: string, data: Partial<ProductFormData>, imageFiles?: File[]) => {
    const formData = new FormData();
    if (data.name !== undefined)        formData.append('name', data.name);
    if (data.price !== undefined)       formData.append('price', String(data.price));
    if (data.stock !== undefined)       formData.append('stock', String(data.stock));
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.unit !== undefined)        formData.append('unit', data.unit);
    if (data.category !== undefined)    formData.append('category', data.category);
    if (data.origin !== undefined)      formData.append('origin', data.origin);
    if (data.min_negotiation_qty !== undefined)
      formData.append('min_negotiation_qty',
        data.min_negotiation_qty == null ? '' : String(data.min_negotiation_qty));
    data.image_urls?.forEach((url) => formData.append('image_urls', url));
    imageFiles?.forEach(f => formData.append('images', f));

    const res = await api.patch(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await fetchProducts();
    return res.data;
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const fetchProductById = async (id: string): Promise<SellerProduct> => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductById,
    setProducts,
  };
}
