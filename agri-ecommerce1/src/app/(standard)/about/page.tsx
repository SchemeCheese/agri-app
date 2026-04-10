// src/app/(standard)/about/page.tsx
import React from 'react';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { Leaf, ShieldCheck, Truck, Award } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: <Leaf size={32} className="text-green-600" />,
      title: '100% Hữu Cơ',
      description: 'Sản phẩm được canh tác theo tiêu chuẩn hữu cơ, không thuốc trừ sâu.',
    },
    {
      icon: <ShieldCheck size={32} className="text-green-600" />,
      title: 'Minh Bạch Nguồn Gốc',
      description: 'Truy xuất nguồn gốc rõ ràng, từ nông trại đến bàn ăn của bạn.',
    },
    {
      icon: <Truck size={32} className="text-green-600" />,
      title: 'Giao Hàng Nhanh',
      description: 'Giữ trọn độ tươi ngon khi giao đến tay khách hàng trong 24h.',
    },
    {
      icon: <Award size={32} className="text-green-600" />,
      title: 'Chất Lượng Hàng Đầu',
      description: 'Cam kết chất lượng, hoàn tiền 100% nếu sản phẩm không đạt chuẩn.',
    },
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* --- BANNER ĐẦU TRANG ĐỒNG BỘ VỚI CONTACT & PRODUCTS --- */}
      <div className="relative w-full h-[35vh] min-h-[250px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2574&auto=format&fit=crop" // Ảnh cánh đồng tuyệt đẹp
          alt="Về Agri Connect"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div> {/* Lớp phủ tối để nổi bật Header và Chữ */}
        <div className="relative z-10 text-center text-white mt-16 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Về Agri Connect</h1>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Mang tinh hoa nông sản Việt sạch, an toàn và tươi ngon nhất đến mọi gia đình.
          </p>
        </div>
      </div>
      {/* -------------------------------------------------------- */}

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/nongsan/farmer.jpg"
                alt="Người nông dân"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Sứ Mệnh Của Chúng Tôi</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Chúng tôi tin rằng mọi người xứng đáng được thưởng thức những sản phẩm nông nghiệp
                tươi ngon và an toàn nhất. Sứ mệnh của Agri Connect là xây dựng cầu nối
                bền vững giữa những người nông dân tâm huyết và người tiêu dùng thành thị.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Bằng cách ứng dụng công nghệ, chúng tôi minh bạch hóa quy trình,
                tối ưu hóa vận hành để đảm bảo chất lượng và giữ trọn giá trị
                dinh dưỡng trong từng sản phẩm.
              </p>
            </div>
          </div>
        </Container>
      </section>
      
      <section className="py-16 md:py-24 bg-green-50/50">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Điều Chúng Tôi Cam Kết
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* --- QUY TRÌNH TIMELINE ĐẸP MẮT --- */}
      <section className="py-16 md:py-24">
         <Container>
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">
            Quy Trình Của Chúng Tôi
          </h2>
           
           <div className="max-w-4xl mx-auto relative px-4">
             {/* Đường kẻ ngang kết nối các bước (Chỉ hiện trên desktop) */}
             <div className="hidden md:block absolute top-6 left-12 right-12 h-1 bg-green-100 -z-10"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               {['Thu hoạch', 'Kiểm định', 'Đóng gói', 'Vận chuyển'].map((step, idx) => (
                 <div key={idx} className="flex flex-col items-center text-center relative group">
                    <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xl mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform duration-300">
                       {idx + 1}
                    </div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-2">{step}</h3>
                    <p className="text-sm text-gray-500">
                      {idx === 0 && 'Tuyển chọn kỹ lưỡng tại vườn'}
                      {idx === 1 && 'Đạt chuẩn an toàn thực phẩm'}
                      {idx === 2 && 'Vật liệu bảo vệ môi trường'}
                      {idx === 3 && 'Giao hàng hỏa tốc 24h'}
                    </p>
                 </div>
               ))}
             </div>
           </div>

         </Container>
      </section>
    </div>
  );
}