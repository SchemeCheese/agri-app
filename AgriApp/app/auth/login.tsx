import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';

type LoginResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    avatar?: string;
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; ids?: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const fillCredential = (role: 'buyer' | 'seller') => {
    if (role === 'buyer') {
      setEmail('khach@gmail.com');
      setPassword('123456');
      return;
    }

    setEmail('shop2@gmail.com');
    setPassword('123456');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorText('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorText('');

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email: email.trim(),
        password,
      });

      setSession({
        user: response.data.user,
        accessToken: response.data.access_token,
      });

      if (params.returnTo) {
        router.replace({ pathname: params.returnTo, params: params.ids ? { ids: params.ids } : undefined });
        return;
      }

      router.replace('/(tabs)/profile');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center px-6 bg-[#F8FAFC]">
        <View className="bg-white rounded-[28px] border border-slate-200 p-5">
          <Text className="text-4xl font-extrabold text-slate-900 text-center">Chào mừng trở lại!</Text>
          <Text className="text-base text-slate-500 text-center mt-2">
            Vui lòng đăng nhập để quản lý đơn hàng và thanh toán.
          </Text>

          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              className="flex-1 bg-blue-50 border border-blue-100 rounded-xl py-3 items-center"
              onPress={() => fillCredential('buyer')}
            >
              <Text className="text-blue-700 font-bold">Test Khách</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-green-50 border border-green-100 rounded-xl py-3 items-center"
              onPress={() => fillCredential('seller')}
            >
              <Text className="text-green-700 font-bold">Test Chủ Shop</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-5 gap-3">
            <View className="flex-row items-center rounded-xl border border-slate-300 px-3 py-3 bg-slate-50">
              <FontAwesome name="envelope-o" size={16} color="#64748B" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Địa chỉ Email"
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 ml-2 text-slate-800"
              />
            </View>

            <View className="flex-row items-center rounded-xl border border-slate-300 px-3 py-3 bg-slate-50">
              <FontAwesome name="lock" size={18} color="#64748B" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mật khẩu"
                secureTextEntry
                className="flex-1 ml-2 text-slate-800"
              />
            </View>
          </View>

          {errorText ? <Text className="text-red-500 text-sm text-center mt-3">{errorText}</Text> : null}

          <TouchableOpacity
            className="mt-5 bg-[#16A34A] rounded-xl py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-extrabold text-base">ĐĂNG NHẬP NGAY</Text>
            )}
          </TouchableOpacity>

          <View className="mt-5 flex-row justify-center">
            <Text className="text-slate-600">Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/auth/register', params: params.returnTo ? { returnTo: params.returnTo, ids: params.ids } : undefined })
              }
            >
              <Text className="text-[#16A34A] font-bold">Đăng ký miễn phí</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="mt-4" onPress={() => Alert.alert('Thông báo', 'Tính năng quên mật khẩu sẽ bổ sung sau.') }>
            <Text className="text-center text-[#16A34A]">Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
