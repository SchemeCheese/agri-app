import React from 'react';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { Instagram } from 'lucide-react';

const galleryImages = [
  { 
    src: 'https://images.unsplash.com/photo-1609412058473-c199497c3c5d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    alt: 'Cánh đồng lúa',
    caption: 'Vụ mùa bội thu' 
  },
  { 
    src: 'https://images.unsplash.com/photo-1734313237467-1f93eb3abbe0?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Thu hoạch dâu',
    caption: 'Dâu tây đỏ mọng'
  },
  { 
    src: 'https://images.unsplash.com/photo-1727099079513-952d40de9d78?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    alt: 'Vườn rau xà lách',
    caption: 'Rau xanh Organic'
  },
  { 
    src: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Trái cây',
    caption: 'Hương vị nhiệt đới'
  },
  { 
    src: 'https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?q=80&w=1740&auto=format&fit=crop', 
    alt: 'Người nông dân',
    caption: 'Niềm vui lao động'
  },
  { 
    src: 'https://images.unsplash.com/photo-1621955050136-8e1cd6ed72e9?q=80&w=1742&auto=format&fit=crop', 
    alt: 'Nông sản đóng gói',
    caption: 'Sẵn sàng giao hàng'
  },
];

export const Gallery = () => {
  return (
    <section id="gallery" className="py-20 bg-white font-sans">
      <Container>
        <div className="text-center mb-12">
            <h3 className="text-green-600 font-semibold tracking-wider uppercase mb-2">Thư viện ảnh</h3>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Khoảnh khắc tại nông trại
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
                Theo dõi hành trình từ nông trại đến bàn ăn qua những thước phim chân thực nhất.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {galleryImages.map((img, index) => (
            <div 
                key={index} 
                className="group relative break-inside-avoid rounded-2xl overflow-hidden shadow-lg cursor-pointer"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={600}
                height={800}
                className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                 <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-bold text-lg mb-1">{img.alt}</p>
                    <p className="text-gray-200 text-sm flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        {img.caption}
                    </p>
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
            <button className="px-8 py-3 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all">
                Xem tất cả ảnh trên Instagram
            </button>
        </div>

      </Container>
    </section>
  );
};