import { MOCK_PRODUCTS, Product } from '../data/mockData';

const ITEMS_PER_PAGE = 6;

interface PaginationResult {
  data: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Hàm lấy sản phẩm theo loại và trang
 * @param category : Loại sản phẩm ('all', 'trai-cay', 'rau-cu', ...)
 * @param page : Trang hiện tại (bắt đầu từ 1)
 */
export const getProductsByCategory = (
  category: string = 'all', 
  page: number = 1
): PaginationResult => {
  
  let filteredData = MOCK_PRODUCTS;
  if (category !== 'all') {
    filteredData = MOCK_PRODUCTS.filter(p => p.category === category);
  }

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  const validPage = Math.max(1, Math.min(page, totalPages > 0 ? totalPages : 1));

  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totalItems,
    totalPages,
    currentPage: validPage
  };
};