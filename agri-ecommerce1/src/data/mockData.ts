// src/data/mockData.ts

export interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    category: 'trai-cay' | 'rau-cu' | 'ngu-coc' | 'gia-vi' | 'khac';
    origin: 'da-lat' | 'tay-bac' | 'mien-tay' | 'nhap-khau' | 'khac'; // Mới
    seasons: ('xuan' | 'ha' | 'thu' | 'dong' | 'quanh-nam')[]; // Mới
    images: string[];
    description: string;
}

export const MOCK_PRODUCTS: Product[] = [
    // --- 1. TRÁI CÂY (FRUITS) ---
    {
        id: 'tc-1',
        name: 'Dâu tây Đà Lạt',
        slug: 'dau-tay-da-lat',
        price: 120000,
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
        description: 'Dâu tây tươi ngon, đỏ mọng, vị ngọt thanh.'
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
        description: 'Bơ sáp dẻo quánh, béo ngậy, hạt nhỏ.'
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
        description: 'Xoài cát vỏ vàng, thịt ngọt lịm, thơm lừng.'
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
        description: 'Chuối già hương chín cây, giàu năng lượng.'
    },
    {
        id: 'tc-5',
        name: 'Dưa hấu đỏ',
        slug: 'dua-hau',
        price: 15000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['ha'],
        images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80'],
        description: 'Dưa hấu giải nhiệt, ruột đỏ cát, ngọt mát.'
    },
    {
        id: 'tc-6',
        name: 'Cam sành vắt nước',
        slug: 'cam-sanh',
        price: 30000,
        category: 'trai-cay',
        origin: 'mien-tay',
        seasons: ['quanh-nam'],
        images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80'],
        description: 'Cam mọng nước, nhiều vitamin C, tốt cho sức khỏe.'
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
        description: 'Nho đen giòn ngọt, chùm to, không hạt.'
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
        description: 'Táo nhập khẩu, giòn tan, vị ngọt đậm.'
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
        description: 'Rau sạch thủy canh, an toàn, tươi mát.'
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
        description: 'Cà chua nhỏ, giòn ngọt, thích hợp ăn sống.'
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
        description: 'Cà rốt củ to, màu cam đẹp, ngọt tự nhiên.'
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
        description: 'Bông cải xanh giàu chất xơ, tốt cho tiêu hóa.'
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
        description: 'Khoai tây bở, thích hợp nấu canh, chiên.'
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
        description: 'Ớt chuông dày cơm, ngọt, không hăng.'
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
        description: 'Dưa leo nhỏ, đặc ruột, giòn tan.'
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
        description: 'Hành tây tím, vị hăng nhẹ, làm salad rất ngon.'
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
        description: 'Gạo ngon nhất thế giới, dẻo thơm.'
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
        description: 'Yến mạch nhập khẩu, tốt cho tim mạch.'
    },
    {
        id: 'nc-3',
        name: 'Đậu đen xanh lòng',
        slug: 'dau-den',
        price: 45000,
        category: 'ngu-coc',
        origin: 'tay-bac',
        seasons: ['thu'],
        images: ['https://images.unsplash.com/photo-1587393855524-087f83d95bc9?w=600&q=80'],
        description: 'Đậu đen hạt nhỏ, nấu chè bở tơi.'
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
        description: 'Bắp ngô ngọt, hạt đều, luộc hay nướng đều ngon.'
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
        description: 'Siêu thực phẩm, giàu protein, thay thế cơm.'
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
        description: 'Gạo lứt đỏ Điện Biên, dẻo, tốt cho người ăn kiêng.'
    },

    // --- 4. GIA VỊ (SPICES) ---
    {
        id: 'gv-1',
        name: 'Tỏi cô đơn',
        slug: 'toi-co-don',
        price: 1200000,
        category: 'gia-vi',
        origin: 'mien-tay', // Lý Sơn thuộc miền Trung nhưng ở đây gom vào nhóm gần đó hoặc thêm 'mien-trung'
        seasons: ['xuan'],
        images: ['https://images.unsplash.com/photo-1620101680127-557e93569b1a?q=80&w=1325&auto=format&fit=crop'],
        description: 'Tỏi một nhánh thơm nồng, dược tính cao.'
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
        description: 'Hạt tiêu chắc, cay nồng đặc trưng.'
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
        description: 'Ớt bột làm kim chi, màu đỏ đẹp, cay vừa.'
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
        description: 'Quế thanh cạo vỏ, thơm ngọt, dùng nấu phở.'
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
        description: 'Gừng củ nhỏ, cay nồng, ấm bụng.'
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
        description: 'Nghệ vàng tươi, dùng kho cá hoặc làm đẹp.'
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
        description: 'Mật ong nguyên chất, sánh đặc.'
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
        description: 'Trà búp sao khô, nước xanh, vị chát hậu ngọt.'
    }
];