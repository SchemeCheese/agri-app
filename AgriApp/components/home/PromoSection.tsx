import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';

export const PromoSection = () => {
  return (
    <View className="mb-5 px-4">
      <View className="rounded-[32px] overflow-hidden border border-slate-100 bg-white">
        <View className="flex-row">
          <View className="flex-1 p-5 justify-center bg-white">
            <View className="self-start bg-red-100 px-3 py-1 rounded-full mb-3">
              <Text className="text-red-600 text-[11px] font-bold uppercase">Hot deal</Text>
            </View>
            <Text className="text-3xl font-extrabold text-slate-900 leading-tight">
              Giam 20%{`\n`}Rau cu huu co
            </Text>
            <Text className="text-slate-500 mt-3 text-sm leading-5">
              Nhan uu dai cho don dau tien va nhan hang nhanh ngay hom nay.
            </Text>
            <TouchableOpacity className="mt-4 self-start bg-[#15803D] px-4 py-3 rounded-2xl">
              <Text className="text-white font-semibold">Mua ngay</Text>
            </TouchableOpacity>
          </View>

          <View className="w-[36%] min-h-[180px]">
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop' }}
              className="flex-1"
            />
          </View>
        </View>
      </View>
    </View>
  );
};