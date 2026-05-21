import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ScreenContainer } from '@/components/common/ScreenContainer';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View className="px-4 py-3 flex-row items-center border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
          <FontAwesome name="chevron-left" size={14} color="#374151" />
        </TouchableOpacity>
        <Text className="ml-3 text-base font-bold text-slate-900">Thong tin & ho tro</Text>
      </View>

      <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl border border-slate-100 p-5">
          <View className="w-14 h-14 rounded-2xl bg-emerald-100 items-center justify-center">
            <FontAwesome name="leaf" size={26} color="#16A34A" />
          </View>
          <Text className="text-2xl font-black text-slate-900 mt-3">Agri Connect</Text>
          <Text className="text-slate-600 leading-6 mt-2">
            Nen tang ket noi nguoi trong va nguoi mua nong san truc tiep, ho tro thuong luong gia,
            theo doi don hang real-time, va tro ly AI tu van san pham.
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 p-5 mt-4">
          <Text className="text-base font-bold text-slate-900 mb-3">Lien he</Text>

          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-slate-100"
            onPress={() => Linking.openURL('mailto:hoangkimchi46@gmail.com')}
          >
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <FontAwesome name="envelope-o" size={14} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Email</Text>
              <Text className="text-slate-800 font-semibold">hoangkimchi46@gmail.com</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-slate-100"
            onPress={() => Linking.openURL('tel:0123456789')}
          >
            <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mr-3">
              <FontAwesome name="phone" size={14} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Hotline</Text>
              <Text className="text-slate-800 font-semibold">0123 456 789</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => Linking.openURL('https://agri-connect-be-production.up.railway.app')}
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center mr-3">
              <FontAwesome name="globe" size={14} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500">Website</Text>
              <Text className="text-slate-800 font-semibold">agri-connect.app</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 p-5 mt-4">
          <Text className="text-base font-bold text-slate-900 mb-3">Phien ban</Text>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-slate-500">App version</Text>
            <Text className="text-slate-800 font-semibold">1.0.0</Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-slate-500">Platform</Text>
            <Text className="text-slate-800 font-semibold">Expo Go</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
