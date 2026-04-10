// src/data/gallery.ts

export interface GalleryImage {
    src: string;
    alt: string;
    caption?: string;
}

export const GALLERY_IMAGES: GalleryImage[] = [
  { 
    src: 'https://images.unsplash.com/photo-1621394988863-117a9fc6e77f?q=80&w=1932&auto=format&fit=crop', 
    alt: 'Cánh đồng lúa',
    caption: 'Vụ mùa bội thu trên cánh đồng mẫu lớn.'
  },
  { 
    src: 'https://images.unsplash.com/photo-1734313237467-1f93eb3abbe0?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Thu hoạch dâu tây',
    caption: 'Những trái dâu tây đỏ mọng vừa được hái.'
  },
  { 
    src: 'https://images.unsplash.com/photo-1519897831810-a9a01aceccd1?q=80&w=1931&auto=format&fit=crop', 
    alt: 'Vườn rau xà lách',
    caption: 'Rau xanh Organic được chăm sóc kỹ lưỡng.'
  },
  { 
    src: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Trái cây nhiệt đới',
    caption: 'Hương vị tươi ngon từ miền nhiệt đới.'
  },
  { 
    src: 'https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Người nông dân',
    caption: 'Nụ cười rạng rỡ trong ngày thu hoạch.'
  },
  { 
    src: 'https://images.unsplash.com/photo-1621955050136-8e1cd6ed72e9?q=80&w=1742&auto=format&fit=crop', 
    alt: 'Quy trình đóng gói',
    caption: 'Sản phẩm được đóng gói cẩn thận trước khi giao.'
  },
];