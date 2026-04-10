// src/data/shops.ts

export interface ShopInfo {
  id: string;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  responseRate: string;
  followers: number;
  following: number;
  joinDate: string;
  totalProducts: number;
  banners: string[];      
  banners2: string[];     
  shopVouchers: string[];
  // --- THÊM LẠI TRƯỜNG NÀY ---
  highlight: string; 
}

export const TOP_SHOPS: ShopInfo[] = [
  {
    id: 'shop-1',
    name: 'Nông Trại Cầu Đất',
    avatar: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=200&h=200&fit=crop',
    location: 'TP. Đà Lạt, Lâm Đồng',
    rating: 4.9,
    responseRate: '98%',
    followers: 12500,
    following: 12,
    joinDate: '3 năm trước',
    totalProducts: 56,
    shopVouchers: ['GIAM5K', 'GIAM10K', 'FREESHIP'],
    highlight: 'Chuyên Dâu tây & Rau củ', // Thêm highlight
    banners: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop', 
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=400&fit=crop'
    ],
    banners2: [
        'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&h=300&fit=crop'
    ]
  },
  {
    id: 'shop-2',
    name: 'Vựa Gạo Miền Tây',
    avatar: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
    location: 'TP. Cần Thơ',
    rating: 4.8,
    responseRate: '95%',
    followers: 8600,
    following: 5,
    joinDate: '2 năm trước',
    totalProducts: 42,
    shopVouchers: ['GAO_ST25', 'GIAM20K'],
    highlight: 'Gạo ngon ST25', // Thêm highlight
    banners: [
        'https://images.unsplash.com/photo-1536622476579-247d4e43e2c3?w=1200&h=400&fit=crop', 
    ],
    banners2: [
        'https://images.unsplash.com/photo-1626075253896-1077be6b2089?w=1200&h=300&fit=crop' 
    ]
  },
  {
    id: 'shop-3',
    name: 'Hạt Dinh Dưỡng Organic',
    avatar: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
    location: 'Bình Phước',
    rating: 5.0,
    responseRate: '100%',
    followers: 5400,
    following: 0,
    joinDate: '1 năm trước',
    totalProducts: 30,
    shopVouchers: ['NUT_SALE', 'MUA2TANG1'],
    highlight: 'Hạt điều & Granola', // Thêm highlight
    banners: [
        'https://images.unsplash.com/photo-1495147466023-ac2159299f43?w=1200&h=400&fit=crop',
    ],
    banners2: [
        'https://images.unsplash.com/photo-1536591375315-1988d6960991?w=1200&h=300&fit=crop'
    ]
  },
  {
    id: 'shop-4',
    name: 'Thảo Mộc Tây Bắc',
    avatar: 'https://images.unsplash.com/photo-1615485925694-a039744c4b69?w=200&h=200&fit=crop',
    location: 'Sapa, Lào Cai',
    rating: 4.7,
    responseRate: '88%',
    followers: 3200,
    following: 20,
    joinDate: '4 năm trước',
    totalProducts: 85,
    shopVouchers: ['TAYBAC_XANH'],
    highlight: 'Gia vị & Dược liệu', // Thêm highlight
    banners: [
        'https://images.unsplash.com/photo-1506095619733-3c3ea98fb968?w=1200&h=400&fit=crop',
    ],
    banners2: [
        'https://images.unsplash.com/photo-1611256243212-48a03787ea01?w=1200&h=300&fit=crop'
    ]
  },
  {
    id: 'shop-5',
    name: 'Nông Sản Miền Núi',
    avatar: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=200&h=200&fit=crop',
    location: 'Kon Tum',
    rating: 4.6,
    responseRate: '92%',
    followers: 4100,
    following: 8,
    joinDate: '2 năm trước',
    totalProducts: 40,
    shopVouchers: ['MOUNTAIN_FRESH'],
    highlight: 'Nông sản sạch miền núi',
    banners: [
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&h=400&fit=crop',
    ],
    banners2: [
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&h=300&fit=crop'
    ]
  }
];