// src/data/orders.ts

export type OrderStatus = 'pending' | 'shipping' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  date: string;
  avatar?: string; // Avatar khách hàng
}

export const MOCK_ORDERS: Order[] = [
  { id: 'DH001', customer: 'Nguyễn Văn A', avatar: '', product: 'Dâu tây Đà Lạt', quantity: 2, total: 240000, status: 'pending', date: '2024-06-20' },
  { id: 'DH002', customer: 'Trần Thị B', avatar: '', product: 'Gạo ST25', quantity: 10, total: 1800000, status: 'shipping', date: '2024-06-19' },
  { id: 'DH003', customer: 'Lê Văn C', avatar: '', product: 'Cà chua bi', quantity: 5, total: 225000, status: 'completed', date: '2024-06-18' },
  { id: 'DH004', customer: 'Phạm Thị D', avatar: '', product: 'Khoai lang mật', quantity: 3, total: 150000, status: 'cancelled', date: '2024-06-15' },
  { id: 'DH005', customer: 'Hoàng Văn E', avatar: '', product: 'Sầu riêng Ri6', quantity: 1, total: 500000, status: 'pending', date: '2024-06-21' },
];