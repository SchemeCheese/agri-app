import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore, type UserRole } from '@/store/authStore';

// Bước 2 của login khi tài khoản sở hữu cả BUYER + SELLER. Nhận tempToken qua
// route params (ngắn hạn), đổi lấy token đầy đủ với activeRole đã chọn.
export default function SelectRoleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tempToken?: string; allowedRoles?: string; returnTo?: string; ids?: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const [loading, setLoading] = useState<UserRole | null>(null);
  const [errorText, setErrorText] = useState('');

  const allowed: UserRole[] = (params.allowedRoles?.split(',').filter(Boolean) as UserRole[]) ?? ['BUYER', 'SELLER'];

  const choose = async (role: UserRole) => {
    if (!params.tempToken) {
      setErrorText('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    setErrorText('');
    setLoading(role);
    try {
      const { data } = await api.post('/auth/select-role', { tempToken: params.tempToken, role });
      setSession({ user: data.user, accessToken: data.access_token });
      if (params.returnTo === '/checkout') {
        router.replace({ pathname: '/checkout', params: params.ids ? { ids: params.ids } : undefined });
      } else {
        router.replace('/profile');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Không thể chọn vai trò. Vui lòng thử lại.';
      setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
      setLoading(null);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 justify-center">
        <View className="bg-white rounded-[28px] border border-slate-200 p-6">
          <Text className="text-3xl font-extrabold text-slate-900 text-center">Chọn không gian làm việc</Text>
          <Text className="text-base text-slate-500 text-center mt-2">
            Tài khoản của bạn có nhiều vai trò. Hãy chọn để tiếp tục.
          </Text>

          {errorText ? <Text className="text-red-500 text-sm text-center mt-3">{errorText}</Text> : null}

          <View className="mt-6 gap-3">
            {allowed.includes('BUYER') && (
              <TouchableOpacity
                className="flex-row items-center rounded-2xl border border-slate-200 px-4 py-4 bg-slate-50"
                activeOpacity={0.85}
                onPress={() => choose('BUYER')}
                disabled={loading !== null}
              >
                {loading === 'BUYER' ? (
                  <ActivityIndicator color="#16A34A" />
                ) : (
                  <FontAwesome name="shopping-basket" size={20} color="#16A34A" />
                )}
                <Text className="ml-3 font-bold text-slate-800 text-base">Người mua</Text>
              </TouchableOpacity>
            )}
            {allowed.includes('SELLER') && (
              <TouchableOpacity
                className="flex-row items-center rounded-2xl border border-slate-200 px-4 py-4 bg-slate-50"
                activeOpacity={0.85}
                onPress={() => choose('SELLER')}
                disabled={loading !== null}
              >
                {loading === 'SELLER' ? (
                  <ActivityIndicator color="#16A34A" />
                ) : (
                  <FontAwesome name="shopping-bag" size={20} color="#16A34A" />
                )}
                <Text className="ml-3 font-bold text-slate-800 text-base">Người bán (Quản lý cửa hàng)</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity className="mt-5 py-2 items-center" activeOpacity={0.7} onPress={() => router.replace('/auth/login')}>
            <Text className="text-center text-slate-500">Hủy, đăng nhập lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
