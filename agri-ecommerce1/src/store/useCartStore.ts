import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug?: string;
  quantity: number;
  stock?: number;
  seller_id: string;
  unit: string;
  shop?: {
    id: string;
    store_name: string;
    avatar_url: string | null;
  };
}

interface CartState {
  // Lưu trữ giỏ hàng của TẤT CẢ user. Khóa là UserID (hoặc 'guest')
  carts: Record<string, CartItem[]>;
  activeUserId: string; // ID của user đang đăng nhập, mặc định là 'guest'
  getItems: () => CartItem[];
  getTotalPrice: () => number;

  // Actions
  setActiveUser: (userId: string | null) => void;
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  removeItems: (productIds: string[]) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {
        'guest': []
      },
      activeUserId: 'guest',

      getItems: () => {
        const state = get();
        return state.carts[state.activeUserId] || [];
      },

      getTotalPrice: () => {
        const items = get().getItems();
        return items.reduce((sum, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          return sum + price * qty;
        }, 0);
      },

      // 1. Cập nhật User đang hoạt động
      setActiveUser: (userId) => {
        const id = userId || 'guest';
        set((state) => {
          // Nếu chuyển từ 'guest' sang 1 tài khoản User thực sự
          if (state.activeUserId === 'guest' && id !== 'guest') {
            const guestCart = state.carts['guest'] || [];
            const userCart = state.carts[id] || [];

            // GỘP GIỎ HÀNG: Mang đồ từ guest sang tài khoản vừa đăng nhập
            let mergedCart = [...userCart];
            guestCart.forEach(gItem => {
              const existingIndex = mergedCart.findIndex(uItem => uItem.id === gItem.id);
              if (existingIndex >= 0) {
                mergedCart[existingIndex].quantity += gItem.quantity;
              } else {
                mergedCart.push(gItem);
              }
            });

            return {
              activeUserId: id,
              carts: {
                ...state.carts,
                [id]: mergedCart, // Cập nhật giỏ mới cho user
                'guest': [] // Xóa sạch giỏ guest
              }
            };
          }

          // Trường hợp đăng xuất (về lại guest) hoặc load trang
          return {
            activeUserId: id,
            carts: {
              ...state.carts,
              [id]: state.carts[id] || []
            }
          };
        });
      },

      // 2. Thêm vào giỏ
      addToCart: (product, quantity) => set((state) => {
        const userId = state.activeUserId;
        const currentCart = state.carts[userId] || [];
        const existingItemIndex = currentCart.findIndex((item) => item.id === product.id);

        // ÉP KIỂU SỐ LƯỢNG ĐỂ CHỐNG LỖI NaN
        const validQty = (typeof quantity === 'number' && !isNaN(quantity)) ? quantity : 1;
        const validPrice = Number(product.price) || 0; // Đảm bảo giá cũng là số

        let updatedCart;
        if (existingItemIndex >= 0) {
          updatedCart = [...currentCart];
          // Đảm bảo item.quantity cũ cũng là số trước khi cộng
          const oldQty = Number(updatedCart[existingItemIndex].quantity) || 0;
          updatedCart[existingItemIndex].quantity = oldQty + validQty;
        } else {
          updatedCart = [...currentCart, {
            ...product,
            price: validPrice,
            quantity: validQty,
            // Chống lỗi nếu images không phải mảng
            images: Array.isArray(product.images) ? product.images : [product.images || '/images/placeholder.jpg']
          }];
        }

        return {
          carts: { ...state.carts, [userId]: updatedCart }
        };
      }),

      // 3. Xóa khỏi giỏ
      removeFromCart: (productId) => set((state) => {
        const userId = state.activeUserId;
        const currentCart = state.carts[userId] || [];
        return {
          carts: {
            ...state.carts,
            [userId]: currentCart.filter(item => item.id !== productId)
          }
        };
      }),

      // 3b. Xóa nhiều sản phẩm cùng lúc
      removeItems: (productIds) => set((state) => {
        const userId = state.activeUserId;
        const currentCart = state.carts[userId] || [];
        return {
          carts: {
            ...state.carts,
            [userId]: currentCart.filter(item => !productIds.includes(item.id))
          }
        };
      }),

      // 4. Cập nhật số lượng
      updateQuantity: (productId, quantity) => set((state) => {
        const userId = state.activeUserId;
        const currentCart = state.carts[userId] || [];

        // Không cho số lượng giảm xuống dưới 1
        const validQty = Math.max(1, (typeof quantity === 'number' && !isNaN(quantity)) ? quantity : 1);

        return {
          carts: {
            ...state.carts,
            [userId]: currentCart.map(item =>
              item.id === productId ? { ...item, quantity: validQty } : item
            )
          }
        };
      }),

      // 5. Xóa sạch giỏ
      clearCart: () => set((state) => {
        const userId = state.activeUserId;
        return {
          carts: { ...state.carts, [userId]: [] }
        };
      })
    }),
    {
      name: 'agri-cart-storage', // Tên lưu trong LocalStorage
      version: 2, // Tăng version => tự động xóa cache cũ (shop.id không nhất quán)
      migrate: () => ({ carts: { guest: [] }, activeUserId: 'guest' }),
    }
  )
);