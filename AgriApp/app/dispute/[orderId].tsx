import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { disputeApi } from '@/services/disputeApi';
import { useAuthStore } from '@/store/authStore';

// Hiển thị ảnh: URL trả về là tương đối (/uploads/...) → ghép base để render.
const absUrl = (url: string) =>
  url.startsWith('http') ? url : `${(api.defaults.baseURL ?? '').replace(/\/$/, '')}${url}`;

export default function DisputeScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [reason, setReason] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const pickImages = async () => {
    if (!accessToken || images.length >= 6) return;
    setErrorText('');
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setErrorText('Cần cấp quyền truy cập thư viện ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 6 - images.length,
        quality: 0.7,
      });
      if (result.canceled) return;

      setUploading(true);
      for (const asset of result.assets) {
        const url = await disputeApi.uploadEvidence(accessToken, {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
        setImages((prev) => (prev.length >= 6 ? prev : [...prev, url]));
      }
    } catch (e: any) {
      setErrorText(e?.message ?? 'Tải ảnh thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!accessToken || !orderId) return;
    if (reason.trim().length < 5) {
      setErrorText('Vui lòng nhập lý do (ít nhất 5 ký tự).');
      return;
    }
    setSubmitting(true);
    setErrorText('');
    try {
      await disputeApi.create(accessToken, orderId, { reason: reason.trim(), images });
      Alert.alert(
        'Đã gửi khiếu nại',
        'Người bán sẽ giải trình và Admin sẽ phân xử. Hệ thống không tự hoàn tiền.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Gửi khiếu nại thất bại.';
      setErrorText(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingVertical: 24 }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-slate-900">Gửi khiếu nại</Text>
        </View>

        <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
          <Text className="text-sm text-orange-700">
            Mô tả vấn đề và tải ảnh bóc hàng làm bằng chứng. Admin sẽ phân xử dựa trên bằng chứng — hệ thống KHÔNG tự
            hoàn tiền.
          </Text>
        </View>

        <Text className="text-sm font-bold text-slate-700 mb-1">Lý do khiếu nại</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          placeholder="VD: Hàng giao thiếu, hư hỏng, sai mô tả…"
          className="rounded-xl border border-slate-300 px-4 py-3 bg-slate-50 text-slate-800 mb-4"
          style={{ textAlignVertical: 'top', minHeight: 100 }}
        />

        <Text className="text-sm font-bold text-slate-700 mb-2">Ảnh bằng chứng (tối đa 6)</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {images.map((url, i) => (
            <View key={i} className="relative">
              <Image source={{ uri: absUrl(url) }} style={{ width: 80, height: 80, borderRadius: 10 }} />
              <TouchableOpacity
                onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
              >
                <FontAwesome name="times" size={11} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 6 ? (
            <TouchableOpacity
              onPress={pickImages}
              disabled={uploading}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 items-center justify-center"
            >
              {uploading ? <ActivityIndicator color="#16A34A" /> : <FontAwesome name="plus" size={18} color="#94A3B8" />}
            </TouchableOpacity>
          ) : null}
        </View>

        {errorText ? <Text className="text-red-500 text-sm mb-3">{errorText}</Text> : null}

        <TouchableOpacity
          onPress={submit}
          disabled={submitting || uploading}
          className={`rounded-xl py-4 items-center ${submitting || uploading ? 'bg-slate-300' : 'bg-[#16A34A]'}`}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-extrabold text-base">GỬI KHIẾU NẠI</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
