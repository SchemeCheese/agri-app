import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';

type RegisterRole = 'BUYER' | 'SELLER';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; ids?: string }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<RegisterRole>('BUYER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorText('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorText('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorText('');
    setSuccessText('');

    try {
      const response = await api.post<{ userId: string; message: string }>('/auth/register', {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
      });

      setUserId(response.data.userId);
      setSuccessText('Mã OTP đã được gửi tới email của bạn.');
      setStep(2);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Đăng ký thất bại.';
      setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setErrorText('Vui lòng nhập đủ 6 số OTP.');
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      await api.post('/auth/verify-email', {
        userId,
        code: otp,
      });

      setSuccessText('Xác thực thành công. Mời bạn đăng nhập.');
      router.replace({ pathname: '/auth/login', params: params.returnTo ? { returnTo: params.returnTo, ids: params.ids } : undefined });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center px-6 bg-[#F8FAFC]">
        <View className="bg-white rounded-[28px] border border-slate-200 p-5">
          <Text className="text-4xl font-extrabold text-slate-900 text-center">
            {step === 1 ? 'Tạo tài khoản mới' : 'Xác thực OTP'}
          </Text>
          <Text className="text-base text-slate-500 text-center mt-2">
            {step === 1
              ? 'Chọn vai trò và nhập thông tin để bắt đầu.'
              : `Mã OTP đã gửi đến ${email}.`}
          </Text>

          {errorText ? <Text className="text-red-500 text-sm text-center mt-3">{errorText}</Text> : null}
          {successText ? <Text className="text-green-600 text-sm text-center mt-3">{successText}</Text> : null}

          {step === 1 ? (
            <>
              <View className="flex-row gap-3 mt-5">
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-3 items-center border ${role === 'BUYER' ? 'bg-green-50 border-green-600' : 'bg-white border-slate-300'}`}
                  onPress={() => setRole('BUYER')}
                >
                  <FontAwesome name="user-o" size={18} color={role === 'BUYER' ? '#16A34A' : '#64748B'} />
                  <Text className={`mt-1 font-bold ${role === 'BUYER' ? 'text-green-700' : 'text-slate-500'}`}>Người mua</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-3 items-center border ${role === 'SELLER' ? 'bg-green-50 border-green-600' : 'bg-white border-slate-300'}`}
                  onPress={() => setRole('SELLER')}
                >
                  <FontAwesome name="shopping-bag" size={18} color={role === 'SELLER' ? '#16A34A' : '#64748B'} />
                  <Text className={`mt-1 font-bold ${role === 'SELLER' ? 'text-green-700' : 'text-slate-500'}`}>Người bán</Text>
                </TouchableOpacity>
              </View>

              <View className="mt-5 gap-3">
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Họ và tên"
                  className="rounded-xl border border-slate-300 px-4 py-3 bg-slate-50"
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Địa chỉ Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="rounded-xl border border-slate-300 px-4 py-3 bg-slate-50"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mật khẩu (ít nhất 6 ký tự)"
                  secureTextEntry
                  className="rounded-xl border border-slate-300 px-4 py-3 bg-slate-50"
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu"
                  secureTextEntry
                  className="rounded-xl border border-slate-300 px-4 py-3 bg-slate-50"
                />
              </View>

              <TouchableOpacity className="mt-5 bg-[#16A34A] rounded-xl py-4 items-center" onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-extrabold text-base">ĐĂNG KÝ TÀI KHOẢN</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="mt-6 items-center">
                <TextInput
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="------"
                  className="text-4xl tracking-[8px] font-extrabold text-green-700 text-center border-b-2 border-slate-300 px-6 py-3"
                />
              </View>

              <TouchableOpacity className="mt-6 bg-[#16A34A] rounded-xl py-4 items-center" onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white font-extrabold text-base">XÁC NHẬN MÃ OTP</Text>}
              </TouchableOpacity>
            </>
          )}

          <View className="mt-5 flex-row justify-center">
            <Text className="text-slate-600">Đã có tài khoản? </Text>
            <TouchableOpacity
              onPress={() =>
                router.replace({ pathname: '/auth/login', params: params.returnTo ? { returnTo: params.returnTo, ids: params.ids } : undefined })
              }
            >
              <Text className="text-[#16A34A] font-bold">Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
