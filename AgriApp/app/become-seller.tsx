import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';

type BecomeSellerResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    avatar?: string;
  };
};

export default function BecomeSellerScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace({ pathname: '/auth/login', params: { returnTo: '/become-seller' } });
    } else if (user.role === 'SELLER') {
      router.replace('/(tabs)/profile');
    }
  }, [user, router]);

  const handleConfirm = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<BecomeSellerResponse>(
        '/auth/become-seller',
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setSession({ user: res.data.user, accessToken: res.data.access_token });
      router.replace('/(tabs)/profile');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Không thể kích hoạt vai trò bán hàng. Vui lòng thử lại.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
      setSubmitting(false);
    }
  };

  if (!user || user.role === 'SELLER') {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="px-6">
          <View className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <View className="w-16 h-16 rounded-2xl bg-emerald-100 items-center justify-center mb-5">
              <FontAwesome name="shopping-cart" size={28} color="#16A34A" />
            </View>

            <Text className="text-2xl font-black text-slate-900 mb-2">Mở gian hàng trên Agri-Connect</Text>
            <Text className="text-slate-600 leading-relaxed mb-5">
              Sau khi xác nhận, tài khoản của bạn sẽ được kích hoạt thêm vai trò Người bán.
              Bạn vẫn dùng được chức năng mua hàng như bình thường, đồng thời được quyền:
            </Text>

            <View className="gap-2 mb-6">
              {[
                'Đăng & quản lý sản phẩm',
                'Nhận đơn, xử lý đơn hàng',
                'Chat thương lượng giá với người mua',
                'Tạo voucher giảm giá riêng cho shop',
              ].map((item) => (
                <View key={item} className="flex-row items-center">
                  <FontAwesome name="check-circle" size={14} color="#16A34A" />
                  <Text className="ml-2 text-slate-700">{item}</Text>
                </View>
              ))}
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-red-700 text-sm">⚠️ {error}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 py-3 rounded-xl border border-slate-200 items-center"
                disabled={submitting}
              >
                <Text className="text-slate-700 font-bold">Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={submitting}
                className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${submitting ? 'bg-slate-300' : 'bg-emerald-600'}`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-bold mr-2">Đăng ký bán hàng</Text>
                    <FontAwesome name="arrow-right" size={14} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
