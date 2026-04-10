// src/data/products.ts
import { ShopInfo, TOP_SHOPS } from './shops';

export interface Review {
    id: string;
    userName: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
    images?: string[];
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    category: 'trai-cay' | 'rau-cu' | 'ngu-coc' | 'gia-vi' | 'khac';
    origin: 'da-lat' | 'tay-bac' | 'mien-tay' | 'nhap-khau' | 'khac';
    seasons: ('xuan' | 'ha' | 'thu' | 'dong' | 'quanh-nam')[];
    images: string[];
    description: string;

    // --- Fields Mới ---
    rating: number;
    reviewCount: number;
    sold: number;
    stock: number;
    brand: string;
    shop: ShopInfo;
    vouchers?: string[];
    reviews?: Review[];
    createdAt: string;

    returnCount?: number;
}

// Helper lấy shop cho nhanh
const DALAT_SHOP = TOP_SHOPS.find(s => s.id === 'shop-1') || TOP_SHOPS[0];
const MIENTAY_SHOP = TOP_SHOPS.find(s => s.id === 'shop-2') || TOP_SHOPS[1];
const HAT_SHOP = TOP_SHOPS.find(s => s.id === 'shop-3') || TOP_SHOPS[2];
const TAYBAC_SHOP = TOP_SHOPS.find(s => s.id === 'shop-4') || TOP_SHOPS[3];
const DEFAULT_SHOP = TOP_SHOPS.find(s => s.id === 'shop-5') || TOP_SHOPS[4];

export const MOCK_PRODUCTS: Product[] = [
    // --- 1. TRÁI CÂY (FRUITS) ---
    {
        id: 'tc-1',
        name: 'Dâu tây Đà Lạt',
        slug: 'dau-tay-da-lat',
        price: 120000,
        originalPrice: 150000,
        category: 'trai-cay',
        origin: 'da-lat',
        seasons: ['xuan', 'dong'],
        images: [
           'https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1622143365323-b6f297a72df3?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1648141294431-1f1d49becd1a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1622143365323-b6f297a72df3?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1716209290705-7333e99e3434?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        description: 'Dâu tây tươi ngon, đỏ mọng, vị ngọt thanh. Hái tại vườn vào sáng sớm.',
        rating: 4.9, reviewCount: 120, sold: 530, stock: 50, brand: 'VietGAP', shop: DALAT_SHOP,
        vouchers: ['GIAM10K', 'FREESHIP'],
        reviews: [
            { id: 'r1', userName: 'Lan Anh', avatar: '', rating: 5, comment: 'Dâu rất tươi, đóng gói cẩn thận.', date: '2023-12-01' },
            { id: 'r2', userName: 'Minh Tuấn', avatar: '', rating: 4, comment: 'Ăn ngon, nhưng giao hàng hơi chậm.', date: '2023-12-03' },
            { id: 'r3', userName: 'Hồng Nhung', avatar: '', rating: 5, comment: 'Rất hài lòng với chất lượng sản phẩm!', date: '2023-12-05', images: ['https://images.unsplash.com/photo-1587393855524-087f83d95bc9?q=80&w=920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'] },
            { id: 'r4', userName: 'Quang Huy', avatar: '', rating: 4, comment: 'Dâu ngọt nhưng hơi ít quả to.', date: '2023-12-10',images: ['https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'] },    
            { id: 'r5', userName: 'Thúy Vân', avatar: '', rating: 5, comment: 'Sẽ tiếp tục ủng hộ shop!', date: '2023-12-12' }, 
        ],
        createdAt: '2024-01-15',

        returnCount: 12,
    },
    {
        id: 'tc-2',
        name: 'Bơ sáp 034',
        slug: 'bo-sap-034',
        price: 80000,
        category: 'trai-cay',
        origin: 'da-lat',
        seasons: ['ha'],
        images: [
            'https://images.unsplash.com/photo-1653819370651-e5d283ec84aa?q=80&w=1160&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1612215047504-a6c07dbe4f7f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1580823673284-e911e30564b6?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1580823673202-ef0405ae5b52?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1616485828923-2640a1ee48b4?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1691657915865-d7b9a6a54e6f?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1741515045437-97682aa96a2d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        description: 'Bơ sáp dẻo quánh, béo ngậy, hạt nhỏ. Đặc sản Lâm Đồng.',
        rating: 4.7, reviewCount: 85, sold: 210, stock: 100, brand: 'Organic Dalat', shop: DALAT_SHOP,
        reviews: [
            { id: 'r6', userName: 'Phương Linh', avatar: '', rating: 5, comment: 'Bơ rất ngon, ăn mê luôn!', date: '2024-01-20' },
            { id: 'r7', userName: 'Minh Khang', avatar: '', rating: 4, comment: 'Bơ ngon nhưng giao hàng lâu.', date: '2024-01-22', images: ['https://images.unsplash.com/photo-1653819370651-e5d283ec84aa?q=80&w=1160&auto=format&fit=crop', 'https://images.unsplash.com/photo-1612215047504-a6c07dbe4f7f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'] },
            { id: 'r8', userName: 'Thu Hương', avatar: '', rating: 5, comment: 'Sẽ mua lại lần nữa.', date: '2024-01-25' },
            { id: 'r9', userName: 'Văn Đức', avatar: '', rating: 4, comment: 'Bơ ngon, nhưng hơi nhỏ quả.', date: '2024-01-28' },
        ],
        createdAt: '2024-05-20',

        returnCount: 5,
    },
    {
        id: 'tc-3',
        name: 'Xoài cát Hòa Lộc',
        slug: 'xoai-cat',
        price: 95000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['ha', 'thu'],
        images: [
            'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80',
            'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1635716279493-d1e30afc25a0?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1582655299221-2b6bff351df0?q=80&w=1162&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1669207334420-66d0e3450283?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1605027990121-cbae9e0642df?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',

        ],
        description: 'Xoài cát vỏ vàng, thịt ngọt lịm, thơm lừng.',
        rating: 4.8, reviewCount: 50, sold: 150, stock: 40, brand: 'Vựa Trái Cây Miền Tây', shop: MIENTAY_SHOP,
        reviews: [
            { id: 'r10', userName: 'Lan Anh', avatar: '', rating: 5, comment: 'Xoài rất ngọt và thơm.', date: '2024-06-05' },
            { id: 'r11', userName: 'Minh Tuấn', avatar: '', rating: 4, comment: 'Giao hàng nhanh, sản phẩm tươi.', date: '2024-06-07' },
        ],
        createdAt: '2024-06-01',

        returnCount: 2,
    },
    {
        id: 'tc-4',
        name: 'Chuối già hương',
        slug: 'chuoi-gia',
        price: 25000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: [
            'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
            'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1587920523737-556db3c49174?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1676495706102-ca1be8fdf676?q=80&w=1630&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1580750587717-115f648f5402?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        description: 'Chuối già hương chín cây, giàu năng lượng.',
        rating: 4.5, reviewCount: 200, sold: 1000, stock: 500, brand: 'Nhà Vườn', shop: MIENTAY_SHOP,
        createdAt: '2024-04-10',

        returnCount: 20,
    },
    {
        id: 'tc-5',
        name: 'Dưa hấu đỏ',
        slug: 'dua-hau',
        price: 15000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['ha'],
        images: [
            'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
            'https://images.unsplash.com/photo-1563114773-84221bd62daa?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1622208489373-1fe93e2c6720?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1630081015918-8a21078e5cee?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1708982553355-794739c6693e?q=80&w=1825&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
        ],
        description: 'Dưa hấu giải nhiệt, ruột đỏ cát, ngọt mát.',
        rating: 4.6, reviewCount: 30, sold: 300, stock: 50, brand: 'Long An Farm', shop: MIENTAY_SHOP,
        createdAt: '2024-03-25',

        returnCount: 8,
    },
    {
        id: 'tc-6',
        name: 'Cam sành vắt nước',
        slug: 'cam-sanh',
        price: 30000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: [
            'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80',
            'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1586439702132-55ce0da661dd?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1605986723344-f60873d873fa?q=80&w=656&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        description: 'Cam mọng nước, nhiều vitamin C, tốt cho sức khỏe.',
        rating: 4.8, reviewCount: 90, sold: 600, stock: 200, brand: 'Vinh Long', shop: MIENTAY_SHOP,
        createdAt: '2024-02-18',

        returnCount: 15,
    },
    {
        id: 'tc-7',
        name: 'Nho đen không hạt',
        slug: 'nho-den',
        price: 150000,
        category: 'trai-cay',
        origin: 'nhap-khau',
        seasons: ['thu'],
        images: ['https://images.unsplash.com/photo-1516876319496-d5a849a2e89b?q=80&w=1160&auto=format&fit=crop'],
        description: 'Nho đen giòn ngọt, chùm to, không hạt. Nhập khẩu Mỹ.',
        rating: 5.0, reviewCount: 45, sold: 120, stock: 30, brand: 'Import Fruit', shop: TAYBAC_SHOP,
        createdAt: '2024-01-30',
    },
    {
        id: 'tc-8',
        name: 'Táo Envy',
        slug: 'tao-envy',
        price: 110000,
        category: 'trai-cay',
        origin: 'nhap-khau',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80'],
        description: 'Táo nhập khẩu, giòn tan, vị ngọt đậm.',
        rating: 4.9, reviewCount: 60, sold: 180, stock: 40, brand: 'Envy New Zealand', shop: TAYBAC_SHOP,
        createdAt: '2024-05-05',

        returnCount: 3,
    },

    // --- 2. RAU CỦ (VEGETABLES) ---
    {
        id: 'rc-1',
        name: 'Xà lách thủy canh',
        slug: 'xa-lach',
        price: 50000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80'],
        description: 'Rau sạch thủy canh, an toàn, tươi mát. Dùng làm salad cực ngon.',
        rating: 4.8, reviewCount: 40, sold: 300, stock: 20, brand: 'Dalat Gap', shop: DALAT_SHOP,
        createdAt: '2024-03-12',

        returnCount: 12,
    },
    {
        id: 'rc-2',
        name: 'Cà chua bi',
        slug: 'ca-chua-bi',
        price: 45000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1561136594-7f68413baa99?w=600&q=80'],
        description: 'Cà chua nhỏ, giòn ngọt, thích hợp ăn sống.',
        rating: 4.7, reviewCount: 55, sold: 400, stock: 50, brand: 'Organic', shop: DALAT_SHOP,
        createdAt: '2024-04-08',

        returnCount: 7,
    },
    {
        id: 'rc-3',
        name: 'Cà rốt Đà Lạt',
        slug: 'ca-rot',
        price: 25000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['dong', 'xuan'],
        images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80'],
        description: 'Cà rốt củ to, màu cam đẹp, ngọt tự nhiên.',
        rating: 4.6, reviewCount: 30, sold: 150, stock: 100, brand: 'Local Farm', shop: DALAT_SHOP,
        createdAt: '2024-02-22',

        returnCount: 4,
    },
    {
        id: 'rc-4',
        name: 'Súp lơ xanh',
        slug: 'sup-lo',
        price: 55000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['dong'],
        images: ['https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=600&q=80'],
        description: 'Bông cải xanh giàu chất xơ, tốt cho tiêu hóa.',
        rating: 4.9, reviewCount: 20, sold: 100, stock: 30, brand: 'Dalat Gap', shop: DALAT_SHOP,
        createdAt: '2024-01-18',

        returnCount: 2,
    },
    {
        id: 'rc-5',
        name: 'Khoai tây vàng',
        slug: 'khoai-tay',
        price: 35000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['dong'],
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80'],
        description: 'Khoai tây bở, thích hợp nấu canh, chiên.',
        rating: 4.5, reviewCount: 25, sold: 200, stock: 150, brand: 'Local Farm', shop: DALAT_SHOP,
        createdAt: '2024-02-10',

        returnCount: 6,
    },
    {
        id: 'rc-6',
        name: 'Ớt chuông đỏ',
        slug: 'ot-chuong',
        price: 70000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1592548868664-f8b4e4b1cfb7?q=80&w=691&auto=format&fit=crop'],
        description: 'Ớt chuông dày cơm, ngọt, không hăng.',
        rating: 4.8, reviewCount: 15, sold: 80, stock: 40, brand: 'Green House', shop: DALAT_SHOP,
        createdAt: '2024-03-05',

        returnCount: 1,
    },
    {
        id: 'rc-7',
        name: 'Dưa leo Baby',
        slug: 'dua-leo',
        price: 30000,
        category: 'rau-cu',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&q=80'],
        description: 'Dưa leo nhỏ, đặc ruột, giòn tan.',
        rating: 4.7, reviewCount: 60, sold: 500, stock: 100, brand: 'Mekong Fresh', shop: MIENTAY_SHOP,
        createdAt: '2024-04-15',

        returnCount: 9,
    },
    {
        id: 'rc-8',
        name: 'Hành tây tím',
        slug: 'hanh-tay',
        price: 28000,
        category: 'rau-cu',
        origin: 'da-lat',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&q=80'],
        description: 'Hành tây tím, vị hăng nhẹ, làm salad rất ngon.',
        rating: 4.6, reviewCount: 10, sold: 90, stock: 80, brand: 'Dalat Onion', shop: DALAT_SHOP,
        createdAt: '2024-05-22',

        returnCount: 0,
    },

    // --- 3. NGŨ CỐC (GRAINS) ---
    {
        id: 'nc-1',
        name: 'Gạo ST25',
        slug: 'gao-st25',
        price: 180000,
        category: 'ngu-coc',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'],
        description: 'Gạo ngon nhất thế giới, dẻo thơm.',
        rating: 5.0, reviewCount: 300, sold: 2000, stock: 500, brand: 'Ông Cua', shop: HAT_SHOP,
        createdAt: '2024-02-28',

        returnCount: 25,
    },
    {
        id: 'nc-2',
        name: 'Yến mạch nguyên hạt',
        slug: 'yen-mach',
        price: 90000,
        category: 'ngu-coc',
        origin: 'nhap-khau',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1614373532018-92a75430a0da?q=80&w=687&auto=format&fit=crop'],
        description: 'Yến mạch nhập khẩu, tốt cho tim mạch.',
        rating: 4.8, reviewCount: 45, sold: 200, stock: 50, brand: 'Quaker', shop: TAYBAC_SHOP,
        createdAt: '2024-03-15',

        returnCount: 5,
    },
    {
        id: 'nc-3',
        name: 'Đậu đen xanh lòng',
        slug: 'dau-den',
        price: 45000,
        category: 'ngu-coc',
        origin: 'tay-bac',
        seasons: ['thu'],
        images: [
            'https://images.unsplash.com/photo-1543831113-c823c4a606b6?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1647545401750-6dd5539879ac?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            'https://images.unsplash.com/photo-1734771771447-d943e2b5f4d5?q=80&w=1040&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            ],
        description: 'Đậu đen hạt nhỏ, nấu chè bở tơi.',
        rating: 4.6, reviewCount: 20, sold: 150, stock: 60, brand: 'Local', shop: TAYBAC_SHOP,
        createdAt: '2024-04-18',

        returnCount: 3,
    },
    {
        id: 'nc-4',
        name: 'Ngô ngọt (Bắp)',
        slug: 'ngo-ngot',
        price: 15000,
        category: 'ngu-coc',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&q=80'],
        description: 'Bắp ngô ngọt, hạt đều, luộc hay nướng đều ngon.',
        rating: 4.5, reviewCount: 50, sold: 400, stock: 100, brand: 'Local', shop: MIENTAY_SHOP,
        createdAt: '2024-05-10',

        returnCount: 10,
    },
    {
        id: 'nc-5',
        name: 'Hạt Quinoa (Diêm mạch)',
        slug: 'hat-quinoa',
        price: 250000,
        category: 'ngu-coc',
        origin: 'nhap-khau',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1722882270052-e132567e9f70?q=80&w=808&auto=format&fit=crop'],
        description: 'Siêu thực phẩm, giàu protein, thay thế cơm.',
        rating: 4.9, reviewCount: 15, sold: 60, stock: 20, brand: 'Organic Life', shop: TAYBAC_SHOP,
        createdAt: '2024-01-25',

        returnCount: 2,
    },
    {
        id: 'nc-6',
        name: 'Gạo lứt đỏ',
        slug: 'gao-lut',
        price: 50000,
        category: 'ngu-coc',
        origin: 'tay-bac',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1675150303909-1bb94e33132f?q=80&w=687&auto=format&fit=crop'],
        description: 'Gạo lứt đỏ Điện Biên, dẻo, tốt cho người ăn kiêng.',
        rating: 4.7, reviewCount: 80, sold: 350, stock: 100, brand: 'Điện Biên', shop: TAYBAC_SHOP,
        createdAt: '2024-06-12',

        returnCount: 6,
    },

    // --- 4. GIA VỊ (SPICES) ---
    {
        id: 'gv-1',
        name: 'Tỏi cô đơn',
        slug: 'toi-co-don',
        price: 1200000,
        category: 'gia-vi',
        origin: 'mien-tay',
        seasons: ['xuan'],
        images: ['https://images.unsplash.com/photo-1620101680127-557e93569b1a?q=80&w=1325&auto=format&fit=crop'],
        description: 'Tỏi một nhánh thơm nồng, dược tính cao.',
        rating: 5.0, reviewCount: 10, sold: 25, stock: 10, brand: 'Lý Sơn', shop: MIENTAY_SHOP,
        createdAt: '2024-02-05',

        returnCount: 4,
    },
    {
        id: 'gv-2',
        name: 'Tiêu đen Phú Quốc',
        slug: 'tieu-den',
        price: 220000,
        category: 'gia-vi',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80'],
        description: 'Hạt tiêu chắc, cay nồng đặc trưng.',
        rating: 4.8, reviewCount: 40, sold: 120, stock: 50, brand: 'Phú Quốc', shop: MIENTAY_SHOP,
        createdAt: '2024-03-20',

        returnCount: 7,
    },
    {
        id: 'gv-3',
        name: 'Ớt bột Hàn Quốc',
        slug: 'ot-bot',
        price: 150000,
        category: 'gia-vi',
        origin: 'nhap-khau',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1568481276363-88d890339390?q=80&w=870&auto=format&fit=crop'],
        description: 'Ớt bột làm kim chi, màu đỏ đẹp, cay vừa.',
        rating: 4.7, reviewCount: 20, sold: 100, stock: 30, brand: 'Korea Red', shop: DEFAULT_SHOP,
        createdAt: '2025-04-28',

        returnCount: 3,
    },
    {
        id: 'gv-4',
        name: 'Quế thanh',
        slug: 'que-thanh',
        price: 180000,
        category: 'gia-vi',
        origin: 'tay-bac',
        seasons: ['thu'],
        images: ['https://images.unsplash.com/photo-1611256243212-48a03787ea01?q=80&w=1754&auto=format&fit=crop'],
        description: 'Quế thanh cạo vỏ, thơm ngọt, dùng nấu phở.',
        rating: 4.6, reviewCount: 15, sold: 60, stock: 20, brand: 'Yên Bái', shop: HAT_SHOP,
        createdAt: '2025-05-30',

        returnCount: 2,
    },
    {
        id: 'gv-5',
        name: 'Gừng sẻ',
        slug: 'gung-se',
        price: 40000,
        category: 'gia-vi',
        origin: 'tay-bac',
        seasons: ['dong'],
        images: ['https://images.unsplash.com/photo-1630623093145-f606591c2546?q=80&w=930&auto=format&fit=crop'],
        description: 'Gừng củ nhỏ, cay nồng, ấm bụng.',
        rating: 4.7, reviewCount: 25, sold: 80, stock: 40, brand: 'Local', shop: HAT_SHOP,
        createdAt: '2025-12-15',

        returnCount: 9,
    },
    {
        id: 'gv-6',
        name: 'Nghệ tươi',
        slug: 'nghe-tuoi',
        price: 30000,
        category: 'gia-vi',
        origin: 'khac',
        seasons: ['xuan'],
        images: ['https://images.unsplash.com/photo-1666818398897-381dd5eb9139?q=80&w=1748&auto=format&fit=crop'],
        description: 'Nghệ vàng tươi, dùng kho cá hoặc làm đẹp.',
        rating: 4.5, reviewCount: 18, sold: 70, stock: 50, brand: 'Local', shop: DEFAULT_SHOP,
        createdAt: '2025-06-10',

        returnCount: 1,
    },

    // --- 5. KHÁC (OTHERS) ---
    {
        id: 'kh-1',
        name: 'Mật ong rừng',
        slug: 'mat-ong',
        price: 350000,
        category: 'khac',
        origin: 'tay-bac',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=1788&auto=format&fit=crop'],
        description: 'Mật ong nguyên chất, sánh đặc.',
        rating: 4.9, reviewCount: 50, sold: 150, stock: 20, brand: 'Forest Honey', shop: DEFAULT_SHOP,
        createdAt: '2024-03-08',

        returnCount: 4,
    },
    {
        id: 'kh-2',
        name: 'Trà xanh Thái Nguyên',
        slug: 'tra-xanh',
        price: 200000,
        category: 'khac',
        origin: 'tay-bac',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1641997829221-a7d363722a1b?q=80&w=687&auto=format&fit=crop'],
        description: 'Trà búp sao khô, nước xanh, vị chát hậu ngọt.',
        rating: 4.8, reviewCount: 70, sold: 220, stock: 60, brand: 'Tân Cương', shop: TAYBAC_SHOP,
        createdAt: '2024-04-12',

        returnCount: 5,
    }
];