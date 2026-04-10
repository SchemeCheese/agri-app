"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios'; 
import { Mail, Lock, User, ArrowRight, CheckCircle, Store, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Điền Form | Step 2: Nhập OTP
  const [userId, setUserId] = useState(''); // Lưu ID để xác thực
  const [otp, setOtp] = useState(''); // Mã OTP 6 số
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER' 
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectRole = (role: 'BUYER' | 'SELLER') => {
    setFormData({ ...formData, role });
  };

  // --- HÀM SUBMIT BƯỚC 1: TẠO TÀI KHOẢN & NHẬN OTP ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role 
      });

      // Thành công -> Lưu userId lại và chuyển sang Bước 2
      setUserId(response.data.userId);
      setSuccess("Mã OTP đã được gửi đến Email của bạn!");
      setStep(2); // Chuyển giao diện
      
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.status === 400) {
        setError(error.response?.data?.message || 'Email này đã được sử dụng.');
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM SUBMIT BƯỚC 2: XÁC THỰC MÃ OTP ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP.");
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify-email', {
        userId: userId,
        code: otp
      });

      setSuccess("Xác thực thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* CỘT TRÁI: ẢNH */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-900">
        <Image 
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop" 
          alt="Agriculture" 
          fill className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Gia nhập cộng đồng <br/> Nông sản sạch</h2>
          <p className="text-lg opacity-90">Tạo tài khoản để nhận ưu đãi và theo dõi đơn hàng dễ dàng hơn.</p>
        </div>
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-gray-50 lg:bg-white">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header thay đổi theo Step */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-sans flex items-center gap-2 lg:justify-start justify-center">
              {step === 1 ? 'Tạo tài khoản mới' : <><ShieldCheck className="text-green-600" size={32}/> Xác thực Email</>}
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-sans">
              {step === 1 ? 'Chọn vai trò và nhập thông tin để bắt đầu.' : `Chúng tôi đã gửi mã 6 số tới ${formData.email}`}
            </p>
          </div>

          {/* Hiển thị thông báo */}
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          {success && <p className="text-green-700 text-sm text-center font-medium bg-green-50 p-3 rounded-lg border border-green-100">{success}</p>}

          {/* ================= GIAO DIỆN BƯỚC 1: ĐIỀN FORM ================= */}
          {step === 1 && (
            <form className="mt-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" onSubmit={handleRegister}>
              {/* Chọn Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bạn là ai?</label>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => selectRole('BUYER')} className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${formData.role === 'BUYER' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-green-300'}`}>
                    <User className={`h-6 w-6 mb-2 ${formData.role === 'BUYER' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${formData.role === 'BUYER' ? 'text-green-700' : 'text-gray-500'}`}>Người mua</span>
                  </div>
                  <div onClick={() => selectRole('SELLER')} className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${formData.role === 'SELLER' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-gray-200 hover:border-green-300'}`}>
                    <Store className={`h-6 w-6 mb-2 ${formData.role === 'SELLER' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${formData.role === 'SELLER' ? 'text-green-700' : 'text-gray-500'}`}>Người bán</span>
                  </div>
                </div>
              </div>

              {/* Các Input Fields */}
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={20} /></div>
                <input name="fullName" type="text" required placeholder="Họ và tên" className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" onChange={handleChange} />
              </div>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={20} /></div>
                <input name="email" type="email" required placeholder="Địa chỉ Email" className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" onChange={handleChange} />
              </div>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={20} /></div>
                <input name="password" type="password" required minLength={6} placeholder="Mật khẩu (ít nhất 6 ký tự)" className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" onChange={handleChange} />
              </div>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><CheckCircle size={20} /></div>
                <input name="confirmPassword" type="password" required placeholder="Nhập lại mật khẩu" className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" onChange={handleChange} />
              </div>

              <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-all shadow-lg shadow-green-200 disabled:opacity-70">
                {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ TÀI KHOẢN'}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {/* ================= GIAO DIỆN BƯỚC 2: NHẬP OTP ================= */}
          {step === 2 && (
            <form className="mt-8 space-y-6 animate-in zoom-in-95 duration-300" onSubmit={handleVerifyOTP}>
              <div className="flex justify-center">
                <input 
                  type="text" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Chỉ cho phép nhập số
                  placeholder="------"
                  className="w-full max-w-[250px] text-center text-4xl tracking-[0.5em] font-bold text-green-700 border-b-2 border-gray-300 focus:border-green-600 outline-none bg-transparent py-4 transition-colors placeholder:text-gray-200"
                  autoFocus
                />
              </div>
              <p className="text-center text-sm text-gray-500">Mã có hiệu lực trong 5 phút.</p>

              <button type="submit" disabled={loading || otp.length < 6} className="w-full py-3 px-4 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Đang kiểm tra...' : 'XÁC NHẬN MÃ OTP'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
             <p className="text-sm text-gray-600">
               Đã có tài khoản?{' '}
               <Link href="/login" className="font-semibold text-green-600 hover:text-green-500 transition-colors">
                 Đăng nhập ngay
               </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}