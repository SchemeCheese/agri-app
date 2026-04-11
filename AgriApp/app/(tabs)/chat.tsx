import { FontAwesome } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useAuthStore } from '@/store/authStore';

export default function ChatTabScreen() {
  const user = useAuthStore((state) => state.user);
  const isSeller = user?.role === 'SELLER';

  if (!isSeller) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState title="Chuc nang chi danh cho Seller" description="Vui long dang nhap tai khoan nguoi ban." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-3 border-b border-slate-100 bg-white">
        <Text className="text-2xl font-bold text-slate-900">Chat</Text>
        <Text className="text-sm text-slate-500 mt-1">Hoi thoai voi khach hang</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <FontAwesome name="comment-o" size={44} color="#CBD5E1" />
        <Text className="text-slate-700 font-bold text-lg mt-4">Chon cuoc tro chuyen</Text>
        <Text className="text-slate-400 mt-1 text-center">Tab nay da tach rieng cho Seller. Co the ket noi truc tiep voi module chat hien tai.</Text>
      </View>
    </ScreenContainer>
  );
}
