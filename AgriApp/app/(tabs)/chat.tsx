import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ChatMessage, ConversationSummary, getConversationMessages, getConversations, uploadChatImage } from '@/api/chat';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import * as ImagePicker from 'expo-image-picker';
import {
  cancelNegotiation,
  joinChatRoom,
  respondToQuote,
  sendChatImage,
  sendChatMessage,
  sendNegotiationQuote,
  subscribeNegotiationAccepted,
  subscribeNegotiationCancelled,
  subscribeNewMessages,
  subscribeQuoteUpdated,
  subscribeUnreadUpdated,
} from '@/services/chatSocket';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/utils/format';
import { resolveImageUrl } from '@/utils/image';

const formatMessageTime = (value?: string) => {
  if (!value) return '';

  try {
    return new Date(value).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const formatQuoteStatus = (status?: string | null) => {
  if (status === 'PENDING') return 'Cho phan hoi';
  if (status === 'ACCEPTED') return 'Da chap nhan';
  if (status === 'REJECTED') return 'Da tu choi';
  return 'Khong xac dinh';
};

const statusClassName = (status?: string | null) => {
  if (status === 'ACCEPTED') return 'text-emerald-700';
  if (status === 'REJECTED') return 'text-red-600';
  return 'text-amber-700';
};

export default function ChatTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [quoteTargetMessage, setQuoteTargetMessage] = useState<ChatMessage | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [processingQuoteMessageId, setProcessingQuoteMessageId] = useState<string | null>(null);
  const [cancelingNegotiation, setCancelingNegotiation] = useState(false);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [sellerNegotiationDecision, setSellerNegotiationDecision] = useState<Record<string, 'accepted' | 'rejected'>>({});

  const initialConversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;
  const isSeller = user?.role === 'SELLER';

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const fetchConversationList = useCallback(async () => {
    if (!accessToken) return;

    setLoadingConversations(true);
    try {
      const data = await getConversations(accessToken);
      setConversations(data);
      // Hydrate unread từ BE — source of truth, đồng bộ qua reload/restart
      const fromServer: Record<string, number> = {};
      for (const c of data) {
        if (typeof (c as any).unread_count === 'number') {
          fromServer[c.id] = (c as any).unread_count;
        }
      }
      setUnreadByConversation((current) => {
        const activeIds = new Set(data.map((item) => item.id));
        // BE value thắng — local optimistic chỉ dùng để hiển thị tức thì giữa các tick BE chưa kịp emit
        const merged: Record<string, number> = {};
        for (const id of activeIds) {
          merged[id] = fromServer[id] ?? current[id] ?? 0;
        }
        return merged;
      });

      if (data.length === 0) {
        setSelectedConversationId('');
        return;
      }

      setSelectedConversationId((current) => {
        if (initialConversationId && data.some((item) => item.id === initialConversationId)) {
          return initialConversationId;
        }
        if (current && data.some((item) => item.id === current)) return current;
        return data[0].id;
      });
    } catch {
      setConversations([]);
      setSelectedConversationId('');
    } finally {
      setLoadingConversations(false);
    }
  }, [accessToken, initialConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    setUnreadByConversation((current) => ({ ...current, [selectedConversationId]: 0 }));
  }, [selectedConversationId]);

  const nextCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const fetchMessageHistory = useCallback(async () => {
    if (!accessToken || !selectedConversationId) {
      setMessages([]);
      nextCursorRef.current = null;
      setHasMoreMessages(false);
      return;
    }

    setLoadingMessages(true);
    try {
      const { items, nextCursor, hasMore } = await getConversationMessages(
        accessToken,
        selectedConversationId,
        { limit: 30 },
      );
      setMessages(items);
      nextCursorRef.current = nextCursor;
      setHasMoreMessages(hasMore);
    } catch {
      setMessages([]);
      nextCursorRef.current = null;
      setHasMoreMessages(false);
    } finally {
      setLoadingMessages(false);
    }
  }, [accessToken, selectedConversationId]);

  const loadMoreHistory = useCallback(async () => {
    if (!accessToken || !selectedConversationId) return;
    const cursor = nextCursorRef.current;
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    try {
      const { items, nextCursor, hasMore } = await getConversationMessages(
        accessToken,
        selectedConversationId,
        { limit: 30, before: cursor },
      );
      setMessages((prev) => [...items, ...prev]);
      nextCursorRef.current = nextCursor;
      setHasMoreMessages(hasMore);
    } catch {
      // giữ trạng thái cũ
    } finally {
      loadingMoreRef.current = false;
    }
  }, [accessToken, selectedConversationId]);

  useFocusEffect(
    useCallback(() => {
      void fetchConversationList();

      const timer = setInterval(() => {
        void fetchConversationList();
      }, 8000);

      return () => {
        clearInterval(timer);
      };
    }, [fetchConversationList]),
  );

  useEffect(() => {
    void fetchMessageHistory();
  }, [fetchMessageHistory]);

  useEffect(() => {
    if (!accessToken || conversations.length === 0) return;

    let mounted = true;

    const joinAllRooms = async () => {
      for (const conversation of conversations) {
        if (!mounted) return;
        try {
          await joinChatRoom(accessToken, { conversationId: conversation.id });
        } catch {
          // Keep joining remaining rooms.
        }
      }
    };

    void joinAllRooms();

    return () => {
      mounted = false;
    };
  }, [accessToken, conversations]);

  useEffect(() => {
    if (!accessToken) return;

    let mounted = true;
    let unsubscribeNewMessage: (() => void) | null = null;
    let unsubscribeQuoteUpdated: (() => void) | null = null;
    let unsubscribeCancelled: (() => void) | null = null;
    let unsubscribeAccepted: (() => void) | null = null;
    let unsubscribeUnread: (() => void) | null = null;

    const setupRealtime = async () => {
      try {
        unsubscribeNewMessage = await subscribeNewMessages(accessToken, (incomingMessage) => {
          if (!mounted || !incomingMessage?.conversationId) return;
          const isIncomingFromOther = incomingMessage.sender?.id && incomingMessage.sender.id !== user?.id;

          if (isIncomingFromOther && incomingMessage.conversationId !== selectedConversationId) {
            setUnreadByConversation((current) => ({
              ...current,
              [incomingMessage.conversationId!]: (current[incomingMessage.conversationId!] ?? 0) + 1,
            }));
          }

          setConversations((current) => {
            const index = current.findIndex((item) => item.id === incomingMessage.conversationId);
            if (index < 0) {
              void fetchConversationList();
              return current;
            }

            const next = [...current];
            const updated = {
              ...next[index],
              lastMessage: {
                id: incomingMessage.id,
                content: incomingMessage.message_content,
                message_type: incomingMessage.message_type,
                created_at: incomingMessage.created_at,
              },
            };

            next.splice(index, 1);
            return [updated, ...next];
          });

          setMessages((current) => {
            if (incomingMessage.conversationId !== selectedConversationId) return current;
            if (current.some((item) => item.id === incomingMessage.id)) return current;
            return [...current, incomingMessage];
          });
        });

        unsubscribeQuoteUpdated = await subscribeQuoteUpdated(accessToken, (event) => {
          if (!mounted) return;

          setMessages((current) =>
            current.map((item) =>
              item.id === event.messageId
                ? {
                    ...item,
                    quote: {
                      ...(item.quote ?? {}),
                      status: event.status,
                    },
                  }
                : item,
            ),
          );
        });

        unsubscribeCancelled = await subscribeNegotiationCancelled(accessToken, (event) => {
          if (!mounted) return;
          if (event.conversationId !== selectedConversationId) return;
          void fetchMessageHistory();
        });

        unsubscribeAccepted = await subscribeNegotiationAccepted(accessToken, (event) => {
          if (!mounted) return;
          if (!event.checkoutData) return;

          Alert.alert(
            'Bao gia da duoc chap nhan',
            `${event.checkoutData.productName ?? 'San pham'} - ${event.checkoutData.quantity ?? 0} ${event.checkoutData.unit ?? 'sp'}`,
          );
        });

        unsubscribeUnread = await subscribeUnreadUpdated(accessToken, (payload) => {
          if (!mounted) return;
          setUnreadByConversation((current) => ({
            ...current,
            [payload.conversationId]: payload.unread,
          }));
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.conversationId ? { ...c, unread_count: payload.unread } as any : c)),
          );
        });
      } catch {
        // Fallback to REST polling/history.
      }
    };

    void setupRealtime();

    return () => {
      mounted = false;
      if (unsubscribeNewMessage) unsubscribeNewMessage();
      if (unsubscribeQuoteUpdated) unsubscribeQuoteUpdated();
      if (unsubscribeCancelled) unsubscribeCancelled();
      if (unsubscribeAccepted) unsubscribeAccepted();
      if (unsubscribeUnread) unsubscribeUnread();
    };
  }, [accessToken, fetchConversationList, fetchMessageHistory, selectedConversationId, user?.id]);

  const handleSendMessage = async () => {
    if (!accessToken || !selectedConversationId) return;

    const content = draftMessage.trim();
    if (!content) return;

    setDraftMessage('');
    try {
      await sendChatMessage(accessToken, {
        conversationId: selectedConversationId,
        content,
      });
    } catch {
      setDraftMessage(content);
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────
  const [uploadingImage, setUploadingImage] = useState(false);
  const handlePickAndSendImage = async () => {
    if (!accessToken || !selectedConversationId || uploadingImage) return;

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Can quyen truy cap anh', 'Vui long cap quyen de gui anh trong chat.');
        return;
      }
    } catch {
      // Trên Web Expo, permission API có thể không tồn tại.
    }

    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
      base64: false,
    });

    if (picker.canceled) return;
    const asset = picker.assets?.[0];
    if (!asset?.uri) return;

    // Client-side size guard (asset.fileSize có thể null trên iOS)
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Anh qua lon', 'Vui long chon anh duoi 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const { url } = await uploadChatImage(accessToken, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? null,
      });
      await sendChatImage(accessToken, {
        conversationId: selectedConversationId,
        imageUrl: url,
      });
    } catch (err: any) {
      Alert.alert('Khong gui duoc anh', err?.response?.data?.message ?? err?.message ?? 'Vui long thu lai.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenQuoteDialog = (message: ChatMessage) => {
    const basePrice = Number(message.proposed_price || message.context_product?.reference_price || 0);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      Alert.alert('Khong hop le', 'Khong tim thay gia de xuat hop le de bao gia.');
      return;
    }

    setQuoteTargetMessage(message);
    setQuotePrice(String(Math.round(basePrice)));
  };

  const handleSendQuote = async () => {
    if (!accessToken || !selectedConversationId || !quoteTargetMessage) return;

    const productId = quoteTargetMessage.context_product?.id;
    const productName = quoteTargetMessage.context_product?.name;
    const unit = quoteTargetMessage.context_product?.unit || 'kg';
    const quantity = Number(quoteTargetMessage.proposed_quantity || 0);
    const numericPrice = Number(quotePrice);

    if (!productId || !productName || quantity <= 0) {
      Alert.alert('Khong hop le', 'Thieu thong tin de gui bao gia.');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert('Khong hop le', 'Gia bao gia phai lon hon 0.');
      return;
    }

    setSendingQuote(true);
    try {
      await sendNegotiationQuote(accessToken, {
        conversationId: selectedConversationId,
        productId,
        productName,
        quantity,
        price: numericPrice,
        unit,
      });

      setSellerNegotiationDecision((current) => ({ ...current, [quoteTargetMessage.id]: 'accepted' }));

      setQuoteTargetMessage(null);
      setQuotePrice('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the gui bao gia. Vui long thu lai.';
      Alert.alert('Gui bao gia that bai', message);
    } finally {
      setSendingQuote(false);
    }
  };

  const handleRejectNegotiation = async () => {
    if (!accessToken || !selectedConversationId) return;

    setCancelingNegotiation(true);
    try {
      await cancelNegotiation(accessToken, {
        conversationId: selectedConversationId,
      });

      const latestNegotiationRequest = [...messages]
        .reverse()
        .find((item) =>
          item.message_type === 'SYSTEM' &&
          Boolean(item.context_product?.id) &&
          Number(item.proposed_quantity || 0) > 0 &&
          Number(item.proposed_price || 0) > 0,
        );

      if (latestNegotiationRequest?.id) {
        setSellerNegotiationDecision((current) => ({ ...current, [latestNegotiationRequest.id]: 'rejected' }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the tu choi dam phan. Vui long thu lai.';
      Alert.alert('That bai', message);
    } finally {
      setCancelingNegotiation(false);
    }
  };

  const handleBuyerQuoteAction = async (messageId: string, action: 'ACCEPTED' | 'REJECTED') => {
    if (!accessToken || !selectedConversationId) return;

    setProcessingQuoteMessageId(messageId);
    try {
      await respondToQuote(accessToken, {
        conversationId: selectedConversationId,
        messageId,
        action,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the xu ly bao gia. Vui long thu lai.';
      Alert.alert('That bai', message);
    } finally {
      setProcessingQuoteMessageId(null);
    }
  };

  const renderMessageBubble = (message: ChatMessage) => {
    const isMine = message.sender?.id === user?.id;
    const isNegotiationRequest =
      message.message_type === 'SYSTEM' &&
      Boolean(message.context_product?.id) &&
      Number(message.proposed_quantity || 0) > 0 &&
      Number(message.proposed_price || 0) > 0;

    if (isNegotiationRequest) {
      const quantity = Number(message.proposed_quantity || 0);
      const proposedPrice = Number(message.proposed_price || 0);
      const total = quantity * proposedPrice;
      const productImage = message.context_product?.image;
      const hasQuoteForRequest = messages.some(
        (item) =>
          item.message_type === 'NEGOTIATION_QUOTE' &&
          item.quote?.productId &&
          item.quote.productId === message.context_product?.id,
      );
      const hasCancelForRequest = messages.some(
        (item) =>
          item.message_type === 'SYSTEM' &&
          (item.message_content || '').toLowerCase().includes('huy cuoc dam phan'),
      );
      const localDecision = sellerNegotiationDecision[message.id];
      const finalDecision = localDecision ?? (hasQuoteForRequest ? 'accepted' : hasCancelForRequest ? 'rejected' : null);
      const showSellerActionButtons = isSeller && !finalDecision;

      return (
        <View key={message.id} className="mb-3">
          <View className="bg-[#FFF8EE] border border-[#F6C89A] rounded-2xl px-3 py-3 shadow-sm shadow-orange-100/60">
            <Text className="text-[#E85D04] font-black text-xs mb-2">
              {isSeller ? 'Khach hang muon thuong luong gia ve:' : 'Yeu cau thuong luong da gui'}
            </Text>

            <View className="flex-row items-center">
              <Image source={{ uri: resolveImageUrl(productImage) }} className="w-11 h-11 rounded-xl" />
              <View className="ml-2.5 flex-1">
                <Text className="text-slate-900 font-bold" numberOfLines={1}>{message.context_product?.name || 'San pham'}</Text>
                <Text className="text-emerald-700 font-semibold text-xs mt-0.5">{formatPrice(message.context_product?.reference_price || 0)}/{message.context_product?.unit || 'kg'}</Text>
              </View>
              <FontAwesome name="external-link" size={12} color="#16A34A" />
            </View>

            <View className="mt-2.5 bg-white rounded-xl border border-orange-100 px-2.5 py-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-500 text-xs">So luong muon mua:</Text>
                <Text className="text-slate-800 font-bold">{quantity} {message.context_product?.unit || 'kg'}</Text>
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-slate-500 text-xs">Gia de xuat:</Text>
                <Text className="text-orange-600 font-black">{formatPrice(proposedPrice)}/{message.context_product?.unit || 'kg'}</Text>
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-slate-500 text-xs">Tong du kien:</Text>
                <Text className="text-orange-600 font-black">{formatPrice(total)}</Text>
              </View>
            </View>

            {showSellerActionButtons ? (
              <View className="flex-row mt-3 gap-2">
                <TouchableOpacity className="flex-1 rounded-xl bg-emerald-600 py-2.5 items-center" onPress={() => handleOpenQuoteDialog(message)}>
                  <Text className="text-white font-black">Chap nhan dam phan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 rounded-xl border py-2.5 items-center ${cancelingNegotiation ? 'border-slate-300 bg-slate-100' : 'border-rose-200 bg-rose-50'}`}
                  onPress={() => void handleRejectNegotiation()}
                  disabled={cancelingNegotiation}
                >
                  <Text className={`font-black ${cancelingNegotiation ? 'text-slate-500' : 'text-rose-600'}`}>Tu choi</Text>
                </TouchableOpacity>
              </View>
            ) : isSeller ? (
              <View className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5">
                <Text className={`text-xs font-bold ${finalDecision === 'accepted' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {finalDecision === 'accepted'
                    ? 'Ban da chon chap nhan dam phan. Vui long theo doi phan hoi bao gia o ben duoi.'
                    : 'Ban da chon tu choi dam phan. Khong the thao tac lai yeu cau nay.'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[10px] text-slate-400 mt-1">{formatMessageTime(message.created_at)}</Text>
        </View>
      );
    }

    if (message.message_type === 'NEGOTIATION_QUOTE' && message.quote) {
      const quantity = Number(message.quote.quantity || 0);
      const price = Number(message.quote.price || 0);
      const total = quantity * price;
      const canBuyerRespond = !isSeller && !isMine && message.quote.status === 'PENDING';
      const quoteImage =
        messages.find(
          (item) =>
            item.context_product?.id &&
            item.context_product.id === message.quote?.productId &&
            item.context_product?.image,
        )?.context_product?.image ?? null;

      return (
        <View key={message.id} className="mb-3">
          <View className="bg-white border border-[#E6E8EC] rounded-2xl px-3 py-3 shadow-sm shadow-slate-200/60">
            <Text className="text-slate-900 font-black text-xs mb-2">Bao gia thuong luong</Text>

            <View className="flex-row items-center">
              <Image source={{ uri: resolveImageUrl(quoteImage || undefined) }} className="w-10 h-10 rounded-lg" />
              <View className="ml-2.5 flex-1">
                <Text className="text-slate-800 font-bold" numberOfLines={1}>{message.quote.productName || 'San pham'}</Text>
                <Text className="text-xs text-slate-500 mt-0.5">{quantity} {message.quote.unit || 'kg'} x {formatPrice(price)}/{message.quote.unit || 'kg'}</Text>
              </View>
            </View>

            <Text className="text-sm font-black text-emerald-700 mt-2">Tong: {formatPrice(total)}</Text>

            <Text className={`text-xs font-bold mt-2 ${statusClassName(message.quote.status)}`}>
              Trang thai: {formatQuoteStatus(message.quote.status)}
            </Text>

            {canBuyerRespond ? (
              <View className="mt-3 flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-2.5 items-center ${processingQuoteMessageId === message.id ? 'bg-slate-300' : 'bg-emerald-600'}`}
                  onPress={() => void handleBuyerQuoteAction(message.id, 'ACCEPTED')}
                  disabled={processingQuoteMessageId === message.id}
                >
                  <Text className="text-white font-bold">Chap nhan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl border py-2.5 items-center ${processingQuoteMessageId === message.id ? 'bg-slate-100 border-slate-300' : 'bg-rose-50 border-rose-200'}`}
                  onPress={() => void handleBuyerQuoteAction(message.id, 'REJECTED')}
                  disabled={processingQuoteMessageId === message.id}
                >
                  <Text className={`font-bold ${processingQuoteMessageId === message.id ? 'text-slate-500' : 'text-rose-600'}`}>Tu choi</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          <Text className="text-[10px] text-slate-400 mt-1">{formatMessageTime(message.created_at)}</Text>
        </View>
      );
    }

    // IMAGE bubble
    if (message.message_type === 'IMAGE' && message.image_url) {
      const imgUri = resolveImageUrl(message.image_url);
      return (
        <View key={message.id} className={`mb-2.5 ${isMine ? 'items-end' : 'items-start'}`}>
          <View className={`max-w-[80%] rounded-2xl overflow-hidden ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} bg-white border border-slate-200`}>
            <Image
              source={{ uri: imgUri }}
              style={{ width: 220, height: 220 }}
              resizeMode="cover"
            />
            {message.message_content ? (
              <Text className="px-2.5 py-1.5 text-slate-700 text-xs">{message.message_content}</Text>
            ) : null}
          </View>
          <Text className="text-[10px] text-slate-400 mt-1">{formatMessageTime(message.created_at)}</Text>
        </View>
      );
    }

    return (
      <View key={message.id} className={`mb-2.5 ${isMine ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[85%] px-3 py-2 rounded-2xl ${isMine ? 'bg-emerald-600 rounded-br-md' : 'bg-white border border-slate-200 rounded-bl-md'}`}>
          <Text className={`${isMine ? 'text-white' : 'text-slate-800'}`}>
            {message.message_content || 'Tin nhan'}
          </Text>
        </View>
        <Text className="text-[10px] text-slate-400 mt-1">{formatMessageTime(message.created_at)}</Text>
      </View>
    );
  };

  if (!user || !accessToken) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState title="Can dang nhap" description="Vui long dang nhap de su dung chat giua nguoi mua va nguoi ban." />
          <TouchableOpacity className="mt-4 bg-emerald-600 px-4 py-2.5 rounded-xl" onPress={() => router.push('/auth/login')}>
            <Text className="text-white font-bold">Dang nhap</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 py-3 border-b border-slate-100 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-900">Chat</Text>
            <Text className="text-sm text-slate-500 mt-1">{isSeller ? 'Chon khach hang de tra loi tin nhan' : 'Nhan tin voi shop'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/ai-chat')}
            className="bg-green-600 rounded-full px-3 py-2 flex-row items-center"
          >
            <FontAwesome name="comments" size={14} color="#FFFFFF" />
            <Text className="text-white font-bold text-xs ml-1.5">Tro ly AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-white border-b border-slate-100 py-3">
        {loadingConversations ? (
          <View className="px-4 py-5 items-center">
            <ActivityIndicator size="small" color="#16A34A" />
          </View>
        ) : conversations.length === 0 ? (
          <View className="px-4 py-4">
            <Text className="text-slate-500">Chua co cuoc tro chuyen nao.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            <View className="flex-row gap-2">
              {conversations.map((conversation) => {
                const active = conversation.id === selectedConversationId;
                const unreadCount = unreadByConversation[conversation.id] ?? 0;

                return (
                  <TouchableOpacity
                    key={conversation.id}
                    className={`rounded-2xl border px-3 py-2 min-w-[180px] ${active ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-slate-200'}`}
                    onPress={() => setSelectedConversationId(conversation.id)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className={`font-bold flex-1 pr-2 ${active ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>
                        {conversation.partner?.full_name || 'Nguoi dung'}
                      </Text>
                      {unreadCount > 0 ? (
                        <View className={`rounded-full min-w-[20px] px-1.5 py-0.5 items-center ${active ? 'bg-white/30' : 'bg-rose-500'}`}>
                          <Text className="text-white text-[10px] font-black">{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className={`text-xs mt-1 ${active ? 'text-emerald-100' : 'text-slate-500'}`} numberOfLines={1}>
                      {conversation.lastMessage?.content || 'Chua co tin nhan'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <View className="flex-1 bg-slate-50">
        {!selectedConversationId ? (
          <View className="flex-1 items-center justify-center px-6">
            <FontAwesome name="comments-o" size={44} color="#CBD5E1" />
            <Text className="text-slate-700 font-bold text-lg mt-4">Chon cuoc tro chuyen</Text>
            <Text className="text-slate-400 mt-1 text-center">Moi cap khach hang va shop chi co 1 doan chat.</Text>
          </View>
        ) : (
          <>
            <View className="px-4 py-2.5 border-b border-slate-100 bg-white">
              <Text className="font-bold text-slate-900" numberOfLines={1}>{selectedConversation?.partner?.full_name || 'Hoi thoai'}</Text>
            </View>

            <ScrollView
              className="flex-1 px-4 py-3"
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                if (e.nativeEvent.contentOffset.y < 60 && hasMoreMessages && !loadingMoreRef.current) {
                  void loadMoreHistory();
                }
              }}
              scrollEventThrottle={200}
            >
              {hasMoreMessages && !loadingMessages && (
                <TouchableOpacity
                  onPress={() => void loadMoreHistory()}
                  className="py-2 items-center"
                >
                  <Text className="text-xs text-green-700">⬆ Tải tin nhắn cũ hơn</Text>
                </TouchableOpacity>
              )}
              {loadingMessages ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#16A34A" />
                </View>
              ) : messages.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-slate-400">Chua co tin nhan nao.</Text>
                </View>
              ) : (
                messages.map((message) => renderMessageBubble(message))
              )}
            </ScrollView>

            <View className="px-4 py-3 border-t border-slate-200 bg-white flex-row items-center">
              <TouchableOpacity
                onPress={() => void handlePickAndSendImage()}
                disabled={uploadingImage}
                className={`mr-2 w-10 h-10 rounded-xl items-center justify-center ${uploadingImage ? 'bg-slate-200' : 'bg-slate-100'}`}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <FontAwesome name="picture-o" size={16} color="#16A34A" />
                )}
              </TouchableOpacity>
              <TextInput
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Nhap tin nhan..."
                value={draftMessage}
                onChangeText={setDraftMessage}
                onSubmitEditing={() => void handleSendMessage()}
                returnKeyType="send"
              />
              <TouchableOpacity className="ml-2 w-10 h-10 rounded-xl bg-emerald-600 items-center justify-center" onPress={() => void handleSendMessage()}>
                <FontAwesome name="send" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={Boolean(quoteTargetMessage)}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteTargetMessage(null)}
      >
        <TouchableOpacity className="flex-1 bg-black/45 justify-end" activeOpacity={1} onPress={() => setQuoteTargetMessage(null)}>
          <TouchableOpacity className="bg-white rounded-t-3xl p-4 pb-8" activeOpacity={1} onPress={() => {}}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-black text-slate-900">Gui bao gia dam phan</Text>
              <TouchableOpacity onPress={() => setQuoteTargetMessage(null)}>
                <FontAwesome name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {quoteTargetMessage ? (
              <View className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                <Text className="font-bold text-slate-900" numberOfLines={1}>{quoteTargetMessage.context_product?.name || 'San pham'}</Text>
                <Text className="text-xs text-slate-500 mt-1">So luong: {Number(quoteTargetMessage.proposed_quantity || 0)} {quoteTargetMessage.context_product?.unit || 'kg'}</Text>
                <Text className="text-xs text-slate-500 mt-1">Gia khach de xuat: {formatPrice(Number(quoteTargetMessage.proposed_price || 0))}/{quoteTargetMessage.context_product?.unit || 'kg'}</Text>
              </View>
            ) : null}

            <Text className="text-xs font-semibold text-slate-600 mb-1">Gia bao gia /{quoteTargetMessage?.context_product?.unit || 'kg'}</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-3 py-3 mb-4"
              keyboardType="numeric"
              value={quotePrice}
              onChangeText={setQuotePrice}
              placeholder="Nhap gia ban chap nhan"
            />

            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${sendingQuote ? 'bg-slate-300' : 'bg-emerald-600'}`}
              onPress={() => void handleSendQuote()}
              disabled={sendingQuote}
            >
              <Text className="text-white font-bold">{sendingQuote ? 'Dang gui...' : 'Gui bao gia'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}
