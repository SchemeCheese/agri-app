import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ProductBadge } from '@/components/product/ProductBadge';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSummary } from '@/components/product/ProductSummary';
import { ProductTabs } from '@/components/product/ProductTabs';
import { ProductInfoTab } from '@/components/product/ProductInfoTab';
import { useProductDetail, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

const statValue = (value?: string | number, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-3 border-b border-slate-100">
    <Text className="text-slate-500">{label}</Text>
    <Text className="text-slate-900 font-medium">{value}</Text>
  </View>
);

const SectionTitle = ({ title, actionLabel, onPressAction }: { title: string; actionLabel?: string; onPressAction?: () => void }) => (
  <View className="flex-row items-center justify-between mb-4">
    <Text className="text-base font-extrabold text-slate-900 uppercase">{title}</Text>
    {actionLabel && onPressAction ? (
      <TouchableOpacity onPress={onPressAction}>
        <Text className="text-xs font-semibold text-[#15803D]">{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const RelatedProductCard = ({
  name,
  image,
  price,
  sold,
  onPress,
}: {
  name: string;
  image?: string;
  price?: number;
  sold?: number;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className="w-[48%] bg-white rounded-2xl border border-slate-100 mb-3 overflow-hidden"
    activeOpacity={0.85}
    onPress={onPress}
  >
    <Image source={{ uri: resolveImageUrl(image) }} className="w-full h-24" />
    <View className="p-2.5">
      <Text className="text-xs font-semibold text-slate-800" numberOfLines={2}>
        {name}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-[#15803D] font-bold text-xs">{formatPrice(price)}</Text>
        <Text className="text-[10px] text-slate-400">Da ban {sold ?? 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const productId = params.id ?? '';
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('Chi tiết');

  const { data: product, isLoading, isError } = useProductDetail(productId);
  const { products } = useProducts();
  const addItem = useCartStore((state) => state.addItem);

  const sameShopProducts = useMemo(() => {
    if (!product) return [];
    const shopId = product.shop?.id ?? product.seller_id;
    if (!shopId) return [];

    return products
      .filter((item) => (item.shop?.id ?? item.seller_id) === shopId && item.id !== product.id)
      .slice(0, 6);
  }, [product, products]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 6);
  }, [product, products]);

  const isUnavailable = (product?.is_active === false) || (product?.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    Alert.alert('Thanh cong', `Da them ${quantity} ${product.unit ?? 'sp'} vao gio hang.`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    router.push('/(tabs)/cart');
  };

  const handleChatOrNegotiate = () => {
    Alert.alert('Thong bao', 'Tinh nang chat/thuong luong se duoc ket noi o buoc tiep theo.');
  };

  return (
    <ScreenContainer>
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <FontAwesome name="chevron-left" size={14} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-slate-900">Chi tiet san pham</Text>
        <View className="w-9" />
      </View>

      {isLoading ? <LoadingState /> : null}
      {isError ? <EmptyState title="Khong tai duoc chi tiet san pham" /> : null}

      {product ? (
        <>
          {/* Tabs Navigation */}
          <ProductTabs tabs={['Chi tiết', 'Giới thiệu']} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'Chi tiết' ? (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
              <ProductGallery images={product.images ?? []} name={product.name} />

              <View className="mt-4">
                <ProductSummary product={product} />
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-slate-500">So luong</Text>
                  <Text className="text-xs text-slate-400">{product.stock ?? 0} san pham co san</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center border border-slate-300 rounded-lg">
                    <TouchableOpacity
                      className="px-3 py-2"
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <FontAwesome name="minus" size={14} color="#374151" />
                    </TouchableOpacity>

                    <View className="px-4 py-2 border-x border-slate-200">
                      <Text className="font-semibold text-slate-900">{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      className="px-3 py-2"
                      onPress={() => setQuantity((q) => Math.min(Math.max(1, product.stock ?? 1), q + 1))}
                    >
                      <FontAwesome name="plus" size={14} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mt-4 flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-[#15803D] bg-green-50 rounded-xl py-3 items-center"
                    onPress={handleAddToCart}
                    disabled={isUnavailable}
                  >
                    <Text className="text-[#15803D] font-bold">Them vao gio hang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-[#16A34A] rounded-xl py-3 items-center"
                    onPress={handleBuyNow}
                    disabled={isUnavailable}
                  >
                    <Text className="text-white font-bold">Mua ngay</Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-2 flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-orange-500 rounded-xl py-3 items-center"
                    onPress={handleChatOrNegotiate}
                  >
                    <Text className="text-orange-600 font-bold">Thuong luong</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 border border-teal-600 rounded-xl py-3 items-center"
                    onPress={handleChatOrNegotiate}
                  >
                    <Text className="text-teal-700 font-bold">Chat ngay</Text>
                  </TouchableOpacity>
                </View>

                {isUnavailable ? (
                  <Text className="mt-3 text-sm font-semibold text-red-600">San pham tam het hang / ngung ban.</Text>
                ) : null}
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <Text className="text-base font-bold text-slate-900">{product.shop?.store_name ?? product.shopName ?? 'Nong trai Agri'}</Text>
                <Text className="text-xs text-slate-500 mt-1">{product.shop?.location ?? 'TP. Da Lat, Lam Dong'}</Text>

                <View className="mt-4 flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-[11px] text-slate-500">Danh gia</Text>
                    <Text className="text-green-600 font-extrabold">{statValue(product.rating, '4.8')}/5.0</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[11px] text-slate-500">Phan hoi</Text>
                    <Text className="text-slate-900 font-extrabold">98%</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-[11px] text-slate-500">Tham gia</Text>
                    <Text className="text-slate-900 font-extrabold">1 nam truoc</Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <SectionTitle title="Chi tiet san pham" />
                <InfoRow label="Danh muc" value={`Agri Connect > ${product.category ?? 'Khac'}`} />
                <InfoRow label="Thuong hieu" value="Nong Trai Cau Dat" />
                <InfoRow label="Nguon goc" value={product.origin ?? 'Viet Nam'} />
                <InfoRow label="Kho hang" value={String(product.stock ?? 0)} />
                <InfoRow label="Gui tu" value={product.shop?.location ?? 'TP. Da Lat, Lam Dong'} />
                <InfoRow label="Mua vu" value="Quanh nam" />
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <SectionTitle title="Mo ta san pham" />
                <Text className="text-slate-600 leading-6">{product.description || 'Dang cap nhat mo ta san pham.'}</Text>
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <SectionTitle title="Danh gia san pham" />
                <Text className="text-slate-500">Chua co danh gia nao.</Text>
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <SectionTitle
                  title="San pham khac cua shop"
                  actionLabel="Xem tat ca"
                  onPressAction={() => router.push('/(tabs)/search')}
                />

                <View className="flex-row flex-wrap justify-between">
                  {sameShopProducts.length > 0 ? (
                    sameShopProducts.map((item) => (
                      <RelatedProductCard
                        key={item.id}
                        name={item.name}
                        image={item.images?.[0]}
                        price={item.price}
                        sold={item.sold}
                        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                      />
                    ))
                  ) : (
                    <Text className="text-slate-500">Shop chua co san pham nao khac.</Text>
                  )}
                </View>
              </View>

              <View className="mt-4 bg-white rounded-[28px] border border-slate-100 p-4">
                <SectionTitle
                  title="Co the ban cung thich"
                  actionLabel="Xem them"
                  onPressAction={() => router.push('/(tabs)/search')}
                />

                <View className="flex-row flex-wrap justify-between">
                  {relatedProducts.map((item) => (
                    <RelatedProductCard
                      key={item.id}
                      name={item.name}
                      image={item.images?.[0]}
                      price={item.price}
                      sold={item.sold}
                      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <ProductInfoTab
              name={product.name}
              description={product.description}
              category={product.category}
              unit={product.unit}
              stock={product.stock}
              shopName={product.shop?.store_name}
              shopDescription={product.shop?.description}
            />
          )}

          <View className="px-4 py-3 border-t border-slate-100 bg-white">
            <View className="flex-row gap-2 mb-2">
              <ProductBadge label={product.is_active === false ? 'Tam dung ban' : 'Dang ban'} tone={product.is_active === false ? 'slate' : 'green'} />
              <ProductBadge label={product.stock && product.stock > 0 ? 'Con hang' : 'Het hang'} tone={product.stock && product.stock > 0 ? 'green' : 'orange'} />
            </View>
            <TouchableOpacity onPress={handleAddToCart} className="bg-[#15803D] rounded-2xl py-4 items-center" disabled={isUnavailable}>
              <Text className="text-white font-bold text-base">Them vao gio hang</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}
