import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import api from '@/api/client';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { ensureGoogleConfigured, GOOGLE_EXPO_GO_IOS_MESSAGE, useGoogleAuth } from '@/services/googleAuth';
import { useAuthStore } from '@/store/authStore';

type LoginResponse = {
  // Phiên đầy đủ:
  access_token?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    avatar?: string;
  };
  // Hoặc yêu cầu chọn workspace (sở hữu cả BUYER + SELLER):
  requiresRoleSelection?: boolean;
  tempToken?: string;
  allowedRoles?: ('BUYER' | 'SELLER' | 'ADMIN')[];
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; ids?: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const { response: googleResponse, promptAsync, isConfigured: googleConfigured, isUnsupportedEnv: googleUnsupported, syncWithBackend } = useGoogleAuth();

  // Sau khi có phiên đầy đủ: về tab gốc — tab layout tự đổi theo activeRole
  // (BUYER → Trang chủ; SELLER → Tổng quan + tab Quản lý bán hàng; ADMIN → về trang
  // chủ vì app không có portal admin, admin dùng web). Giữ luồng checkout.
  const goAfterSession = () => {
    if (params.returnTo === '/checkout') {
      router.replace({ pathname: '/checkout', params: params.ids ? { ids: params.ids } : undefined });
    } else {
      router.replace('/');
    }
  };

  // Tài khoản sở hữu cả BUYER + SELLER: KHÔNG hỏi chọn vai trò nữa — tự vào
  // workspace MUA HÀNG. Muốn sang bán hàng: dùng nút "Đổi vai trò" ở tab Tài khoản.
  const autoSelectBuyer = async (tempToken: string) => {
    const { data } = await api.post('/auth/select-role', { tempToken, role: 'BUYER' });
    setSession({ user: data.user, accessToken: data.access_token });
    goAfterSession();
  };

  // expo-auth-session promptAsync resolves *before* the response state lands —
  // wait for the response effect to fire so we can read idToken safely.
  useEffect(() => {
    const handle = async () => {
      if (!googleResponse) return;
      if (googleResponse.type !== 'success') {
        if (googleResponse.type === 'error') {
          setErrorText(googleResponse.error?.message ?? 'Đăng nhập Google thất bại.');
        }
        setGoogleLoading(false);
        return;
      }
      const idToken = googleResponse.params?.id_token || googleResponse.authentication?.idToken;
      if (!idToken) {
        setErrorText('Không lấy được Google idToken.');
        setGoogleLoading(false);
        return;
      }
      try {
        const synced = await syncWithBackend(idToken);
        if (synced.requiresRoleSelection && synced.tempToken) {
          await autoSelectBuyer(synced.tempToken);
          return;
        }
        setSession({ user: synced.user, accessToken: synced.access_token! });
        goAfterSession();
      } catch (err: any) {
        const message = err?.response?.data?.message ?? 'Đồng bộ tài khoản Google thất bại.';
        setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
      } finally {
        setGoogleLoading(false);
      }
    };
    void handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    // Shared guard: chặn iOS Expo Go (hiện thông báo Email/OTP) + cảnh báo khi
    // chưa cấu hình env. Không bao giờ crash.
    if (!ensureGoogleConfigured(googleConfigured, googleUnsupported)) return;
    setErrorText('');
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err: any) {
      setErrorText(err?.message ?? 'Không mở được Google sign-in.');
      setGoogleLoading(false);
    }
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

      const data = response.data;
      // Sở hữu cả 2 vai trò → tự vào workspace MUA HÀNG (không hỏi chọn vai trò).
      if (data.requiresRoleSelection && data.tempToken) {
        await autoSelectBuyer(data.tempToken);
        return;
      }

      setSession({ user: data.user, accessToken: data.access_token! });
      goAfterSession();
    } catch (error: any) {
      // 403 = email chưa xác thực OTP (OTP hard-gate ở BE).
      if (error?.response?.status === 403) {
        setErrorText('Tài khoản chưa xác thực OTP. Vui lòng kiểm tra email để kích hoạt.');
      } else {
        const message = error?.response?.data?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.';
        setErrorText(Array.isArray(message) ? message.join(', ') : String(message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-[28px] border border-slate-200 p-6">
          <Text className="text-4xl font-extrabold text-slate-900 text-center">Chào mừng trở lại!</Text>
          <Text className="text-base text-slate-500 text-center mt-2">
            Vui lòng đăng nhập để quản lý đơn hàng và thanh toán.
          </Text>

          <View className="mt-6 gap-3">
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
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-extrabold text-base">ĐĂNG NHẬP NGAY</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-3 text-xs text-slate-400">HOẶC</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          <TouchableOpacity
            className="bg-white border border-slate-300 rounded-xl py-4 items-center flex-row justify-center"
            activeOpacity={0.85}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#16A34A" />
            ) : (
              <>
                <FontAwesome name="google" size={18} color="#DB4437" />
                <Text className="ml-2 text-slate-700 font-bold">Đăng nhập với Google</Text>
              </>
            )}
          </TouchableOpacity>

          {googleUnsupported ? (
            <Text className="text-xs text-amber-600 text-center mt-2">{GOOGLE_EXPO_GO_IOS_MESSAGE}</Text>
          ) : null}

          <View className="mt-6 flex-row justify-center items-center">
            <Text className="text-slate-600">Chưa có tài khoản? </Text>
            <TouchableOpacity
              className="py-2 px-1"
              activeOpacity={0.7}
              onPress={() =>
                router.push({ pathname: '/auth/register', params: params.returnTo ? { returnTo: params.returnTo, ids: params.ids } : undefined })
              }
            >
              <Text className="text-[#16A34A] font-bold">Đăng ký miễn phí</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="mt-1 py-2 items-center"
            activeOpacity={0.7}
            onPress={() => Alert.alert('Thông báo', 'Tính năng quên mật khẩu sẽ bổ sung sau.')}
          >
            <Text className="text-center text-[#16A34A]">Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
