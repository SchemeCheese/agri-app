// src/data/seller.ts

export interface RevenueStat {
  name: string; // Tên ngày/tháng
  revenue: number; // Doanh thu
  orders: number; // Số đơn
}

export interface SellerProductStat {
  id: string;
  name: string;
  image: string;
  sold: number;
  revenue: number;
  stock: number;
}

// 1. Dữ liệu biểu đồ doanh thu (Giả lập theo 12 tháng)
export const REVENUE_DATA: RevenueStat[] = [
  { name: 'T1', revenue: 15000000, orders: 45 },
  { name: 'T2', revenue: 12000000, orders: 38 },
  { name: 'T3', revenue: 18500000, orders: 60 },
  { name: 'T4', revenue: 22000000, orders: 75 },
  { name: 'T5', revenue: 25000000, orders: 90 },
  { name: 'T6', revenue: 32000000, orders: 110 }, // Mùa cao điểm
  { name: 'T7', revenue: 28000000, orders: 95 },
  { name: 'T8', revenue: 24000000, orders: 80 },
  { name: 'T9', revenue: 19000000, orders: 65 },
  { name: 'T10', revenue: 16000000, orders: 50 },
  { name: 'T11', revenue: 21000000, orders: 70 },
  { name: 'T12', revenue: 35000000, orders: 120 }, // Tết
];

// 2. Top sản phẩm bán chạy
export const BEST_SELLING_PRODUCTS: SellerProductStat[] = [
  { id: '1', name: 'Dâu tây Đà Lạt', image: 'https://images.unsplash.com/photo-1518635017498-87f514b751ba?w=100', sold: 1200, revenue: 144000000, stock: 50 },
  { id: '2', name: 'Gạo ST25', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100', sold: 850, revenue: 153000000, stock: 200 },
  { id: '3', name: 'Khoai lang mật', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100', sold: 600, revenue: 30000000, stock: 150 },
];

// 3. Sản phẩm doanh thu thấp (Cần đẩy hàng)
export const LOW_PERFORMING_PRODUCTS: SellerProductStat[] = [
  { id: '4', name: 'Hành tây tím', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=100', sold: 15, revenue: 450000, stock: 300 },
  { id: '5', name: 'Cà rốt baby', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100', sold: 20, revenue: 800000, stock: 120 },
];

// 4. Danh sách chat giả lập
export const CHAT_LIST = [
  { id: 'u1', name: 'Nguyễn Văn A', lastMsg: 'Sản phẩm này còn không shop?', time: '10:30 AM', unread: 2, type: 'buyer' },
  { id: 'u2', name: 'Trần Thị B', lastMsg: 'Mình muốn mua sỉ 50kg', time: 'Yesterday', unread: 0, type: 'buyer' },
  { id: 'ai', name: 'Trợ lý AgriBot', lastMsg: 'Dự báo: Nhu cầu Dâu tây sẽ tăng 20% tuần tới.', time: 'Now', unread: 1, type: 'ai' },
];