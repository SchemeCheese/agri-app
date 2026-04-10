import { View, Text, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ProductInfoTabProps {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  stock?: number;
  shopName?: string;
  shopDescription?: string;
}

const InfoSection = ({ title, content }: { title: string; content: string | number | undefined }) => {
  if (!content) return null;
  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-slate-600 uppercase mb-2">{title}</Text>
      <Text className="text-sm text-slate-700 leading-6">{String(content)}</Text>
    </View>
  );
};

export function ProductInfoTab({
  name,
  description,
  category,
  unit,
  stock,
  shopName,
  shopDescription,
}: ProductInfoTabProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-slate-50">
      <View className="bg-white px-4 py-4 border-b border-slate-100">
        <Text className="text-base font-bold text-slate-900 mb-2">Giới thiệu sản phẩm</Text>
        <InfoSection title="Tên sản phẩm" content={name} />
        {description && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <View className="flex-row items-start">
              <FontAwesome name="info-circle" size={16} color="#3B82F6" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="flex-1 text-sm text-blue-900 leading-5">{description}</Text>
            </View>
          </View>
        )}
      </View>

      <View className="bg-white px-4 py-4 border-b border-slate-100 mt-2">
        <Text className="text-base font-bold text-slate-900 mb-4">Thông tin chi tiết</Text>

        <View className="space-y-4">
          <View className="pb-4 border-b border-slate-100">
            <View className="flex-row items-center mb-2">
              <FontAwesome name="list-alt" size={14} color="#64748B" style={{ marginRight: 8 }} />
              <Text className="text-xs font-bold text-slate-600 uppercase">Danh mục</Text>
            </View>
            <Text className="text-sm text-slate-700 ml-6">{category || 'Chưa xác định'}</Text>
          </View>

          <View className="pb-4 border-b border-slate-100">
            <View className="flex-row items-center mb-2">
              <FontAwesome name="cube" size={14} color="#64748B" style={{ marginRight: 8 }} />
              <Text className="text-xs font-bold text-slate-600 uppercase">Đơn vị tính</Text>
            </View>
            <Text className="text-sm text-slate-700 ml-6">{unit || 'kg'}</Text>
          </View>

          <View className="pb-4">
            <View className="flex-row items-center mb-2">
              <FontAwesome name="check-circle" size={14} color="#64748B" style={{ marginRight: 8 }} />
              <Text className="text-xs font-bold text-slate-600 uppercase">Tồn kho</Text>
            </View>
            <Text className={`text-sm ml-6 font-semibold ${(stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock ?? 0} {unit || 'kg'} có sẵn
            </Text>
          </View>
        </View>
      </View>

      {shopName && (
        <View className="bg-white px-4 py-4 border-b border-slate-100 mt-2">
          <Text className="text-base font-bold text-slate-900 mb-4">Thông tin cửa hàng</Text>

          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
              <FontAwesome name="store" size={20} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">{shopName}</Text>
              <Text className="text-xs text-slate-500">Cửa hàng nông sản</Text>
            </View>
          </View>

          {shopDescription && <InfoSection title="Mô tả cửa hàng" content={shopDescription} />}

          <View className="bg-green-50 border border-green-200 rounded-lg p-3">
            <View className="flex-row items-center mb-2">
              <FontAwesome name="shield" size={14} color="#15803D" style={{ marginRight: 6 }} />
              <Text className="text-xs font-bold text-green-900">CHẤT LƯỢNG ĐƯỢC ĐẢM BẢO</Text>
            </View>
            <Text className="text-xs text-green-900 leading-4">
              Tất cả sản phẩm đều được chọn lọc từ các nhà sản xuất uy tín để đảm bảo chất lượng tốt nhất cho khách hàng.
            </Text>
          </View>
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
