import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/common/ScreenContainer';
import {
  askAI,
  ensureAISocket,
  fetchAISession,
  fetchAISessions,
  subscribeAIEvents,
  type AISessionSummary,
} from '@/services/aiSocket';
import { useAuthStore } from '@/store/authStore';
import { ImagePickPermissionError, pickAndProcessImage, type ProcessedImage } from '@/utils/pickImage';

type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  imageUri?: string;
  pending?: boolean;
  error?: boolean;
};

export default function AIChatScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const mode: 'BUYER' | 'SELLER' = user?.role === 'SELLER' ? 'SELLER' : 'BUYER';

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AISessionSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingImage, setPendingImage] = useState<ProcessedImage | null>(null);
  const [attaching, setAttaching] = useState(false);

  const streamingIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  // ── Connect + subscribe ───────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) {
      setConnecting(false);
      setError('Vui long dang nhap de dung tro ly AI.');
      return;
    }
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setup = async () => {
      try {
        await ensureAISocket(accessToken);
        if (!mounted) return;
        setConnecting(false);
        unsubscribe = await subscribeAIEvents(accessToken, {
          onThinking: () => {
            setThinking(true);
            setThinkingLabel(null);
          },
          onToolStart: ({ label }) => setThinkingLabel(label),
          onToken: ({ chunk, sessionId: sid }) => {
            if (thinkingLabel) setThinkingLabel(null);
            setSessionId((cur) => cur ?? sid);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingIdRef.current ? { ...m, content: m.content + chunk } : m,
              ),
            );
          },
          onComplete: ({ sessionId: sid }) => {
            setThinking(false);
            setThinkingLabel(null);
            setSessionId(sid);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingIdRef.current ? { ...m, pending: false } : m,
              ),
            );
            streamingIdRef.current = null;
          },
          onError: ({ message }) => {
            setThinking(false);
            setError(message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingIdRef.current
                  ? { ...m, content: message, pending: false, error: true }
                  : m,
              ),
            );
            streamingIdRef.current = null;
          },
        });
      } catch (err: any) {
        if (!mounted) return;
        setConnecting(false);
        setError(err?.message ?? 'Khong ket noi duoc tro ly AI.');
      }
    };

    void setup();
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [accessToken]);

  // ── Attach image ────────────────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    if (thinking || attaching) return;
    setAttaching(true);
    try {
      // Smaller ceiling than chat: the base64 travels over the socket, and
      // Gemini vision does not need full resolution.
      const image = await pickAndProcessImage({ maxWidth: 1024, compress: 0.6, includeBase64: true });
      if (image) {
        setPendingImage(image);
        setError(null);
      }
    } catch (err: any) {
      if (err instanceof ImagePickPermissionError) {
        Alert.alert('Can quyen truy cap anh', 'Vui long cap quyen thu vien anh trong Cai dat de gui anh cho AI.');
      } else {
        Alert.alert('Khong chon duoc anh', err?.message ?? 'Vui long thu lai.');
      }
    } finally {
      setAttaching(false);
    }
  }, [thinking, attaching]);

  // ── Send ──────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!accessToken) return;
    const content = draft.trim();
    // Allow sending when there is text OR an attached image.
    if ((!content && !pendingImage) || thinking) return;

    const image = pendingImage;
    // Give the model a prompt even when the user only sent an image.
    const outgoingContent = content || (image ? 'Phan tich giup toi hinh anh nong san nay.' : '');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'USER',
      content,
      imageUri: image?.uri,
    };
    const placeholderId = `a-${Date.now()}`;
    streamingIdRef.current = placeholderId;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: placeholderId, role: 'ASSISTANT', content: '', pending: true },
    ]);
    setDraft('');
    setPendingImage(null);
    setError(null);

    try {
      await askAI(accessToken, {
        content: outgoingContent,
        sessionId: sessionId ?? undefined,
        mode,
        ...(image?.base64
          ? { imageBase64: image.base64, imageMimeType: 'image/jpeg' as const }
          : {}),
      });
    } catch (err: any) {
      setError(err?.message ?? 'Khong gui duoc.');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: err?.message ?? 'Loi', pending: false, error: true }
            : m,
        ),
      );
      streamingIdRef.current = null;
    }
  }, [accessToken, draft, thinking, sessionId, mode, pendingImage]);

  // ── History ───────────────────────────────────────────────────────────
  const toggleHistory = useCallback(async () => {
    if (!accessToken) return;
    if (!showHistory) {
      try {
        const items = await fetchAISessions(accessToken);
        setSessions(items);
      } catch {
        /* ignore */
      }
    }
    setShowHistory((v) => !v);
  }, [accessToken, showHistory]);

  const openSession = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      try {
        const { messages: history } = await fetchAISession(accessToken, id);
        setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content })));
        setSessionId(id);
        setShowHistory(false);
      } catch {
        /* ignore */
      }
    },
    [accessToken],
  );

  const newSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    streamingIdRef.current = null;
    setShowHistory(false);
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  return (
    <ScreenContainer>
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <FontAwesome name="arrow-left" size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="font-bold text-slate-900">AgriBot · {mode === 'BUYER' ? 'Nguoi mua' : 'Nguoi ban'}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={newSession} className="p-1">
              <FontAwesome name="plus" size={16} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleHistory} className="p-1">
              <FontAwesome name="history" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* History panel */}
        {showHistory && (
          <View className="max-h-40 bg-slate-100 border-b border-slate-200">
            <ScrollView>
              {sessions.length === 0 ? (
                <Text className="text-center text-xs text-slate-400 py-4">Chua co lich su.</Text>
              ) : (
                sessions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => openSession(s.id)}
                    className="px-4 py-2 border-b border-slate-200"
                  >
                    <Text className="text-xs text-slate-700">
                      Phien · {s.mode} · {s._count?.messages ?? 0} tin
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {new Date(s.updated_at).toLocaleString('vi-VN')}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView ref={scrollRef} className="flex-1 px-4 py-3">
            {connecting && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#16A34A" />
                <Text className="text-xs text-slate-500 mt-1">Dang ket noi tro ly...</Text>
              </View>
            )}
            {!connecting && messages.length === 0 && (
              <View className="py-10 items-center">
                <FontAwesome name="comments-o" size={40} color="#94A3B8" />
                <Text className="text-slate-500 text-sm mt-3 text-center px-6">
                  Xin chao! Toi la AgriBot. Hoi toi ve san pham, gia ca, thuong luong nhe.
                </Text>
              </View>
            )}
            {messages.map((m) => (
              <View
                key={m.id}
                className={`mb-2 flex-row ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <View
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.role === 'USER'
                      ? 'bg-green-600'
                      : m.error
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  {m.role === 'ASSISTANT' && m.pending && !m.content ? (
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#64748B" />
                      <Text className="text-slate-500 text-xs">{thinkingLabel ?? 'dang soan...'}</Text>
                    </View>
                  ) : (
                    <>
                      {m.imageUri && (
                        <Image
                          source={{ uri: m.imageUri }}
                          className={`w-44 h-44 rounded-xl ${m.content ? 'mb-1.5' : ''}`}
                          resizeMode="cover"
                        />
                      )}
                      {!!m.content && (
                        <Text
                          className={`text-sm ${
                            m.role === 'USER'
                              ? 'text-white'
                              : m.error
                              ? 'text-red-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {m.content}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {error && (
            <View className="px-4 py-2 bg-red-50 border-t border-red-200">
              <Text className="text-red-700 text-xs">⚠️ {error}</Text>
            </View>
          )}

          {/* Selected image preview */}
          {pendingImage && (
            <View className="px-4 pt-2 bg-white border-t border-slate-200 flex-row items-center">
              <View className="relative">
                <Image
                  source={{ uri: pendingImage.uri }}
                  className="w-16 h-16 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setPendingImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 items-center justify-center"
                >
                  <FontAwesome name="times" size={11} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-slate-500 ml-3">Anh dinh kem · AgriBot se phan tich</Text>
            </View>
          )}

          {/* Composer */}
          <View className="flex-row items-center px-4 py-3 bg-white border-t border-slate-200">
            <TouchableOpacity
              onPress={pickImage}
              disabled={connecting || thinking || attaching}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                connecting || thinking || attaching ? 'bg-slate-200' : 'bg-slate-100'
              }`}
            >
              {attaching ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <FontAwesome name="image" size={16} color="#16A34A" />
              )}
            </TouchableOpacity>
            <TextInput
              className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 mr-2 bg-slate-50"
              placeholder={connecting ? 'Dang ket noi...' : thinking ? 'Dang cho...' : 'Nhap cau hoi...'}
              value={draft}
              onChangeText={setDraft}
              editable={!connecting && !thinking}
              maxLength={500}
              multiline={false}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={(!draft.trim() && !pendingImage) || connecting || thinking}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                (!draft.trim() && !pendingImage) || connecting || thinking ? 'bg-slate-300' : 'bg-green-600'
              }`}
            >
              <FontAwesome name="send" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}
