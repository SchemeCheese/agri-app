'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { Container } from '@/components/ui/Container';
import { API_BASE_URL, SOCKET_BASE_URL, resolveImageUrl } from '@/lib/runtime-config';
import {
  MessageCircle, Send, Search, ChevronLeft,
  Loader2, Store, Handshake, XCircle, RotateCcw, ShoppingBag, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/utils/vi';

const BACKEND_URL = API_BASE_URL;
const SOCKET_URL = `${SOCKET_BASE_URL.replace(/\/$/, '')}/chat`;
const fixImg = (url: string) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};
import { NegotiationQuoteCard } from '@/components/chat/NegotiationQuoteCard';
import { Message, Conversation, QuoteData, CheckoutData, extractQuote, extractNegotiationMsg } from '@/types/chat';

// ─── helpers ─────────────────────────────────────────────────────────────────
const getPartnerName = (conv: Conversation) =>
  conv.partner?.profile?.store_name || conv.partner?.full_name || 'Người dùng';

const formatTime = (dateStr: string) => {
  const d      = new Date(dateStr);
  const diffM  = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffM < 1)    return 'Vừa xong';
  if (diffM < 60)   return `${diffM} phút`;
  if (diffM < 1440) return `${Math.floor(diffM / 60)} giờ`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// ─────────────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-600">Đang tải chat...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router       = useRouter();
  const { user }     = useAuth();
  const searchParams = useSearchParams();

  // URL params
  const sellerIdParam    = searchParams?.get('sellerId');
  const convIdParam      = searchParams?.get('conversationId');
  const isNegotiate      = searchParams?.get('negotiate') === '1';
  const productIdParam   = searchParams?.get('productId');
  const qtyParam         = Number(searchParams?.get('qty') || 0);
  const proposedPriceParam = Number(searchParams?.get('proposedPrice') || 0);
  // Product context passed from product detail page
  const refProductName   = searchParams?.get('productName');
  const refProductImg    = searchParams?.get('productImg');
  const refProductPrice  = searchParams?.get('productPrice');
  const refProductUnit   = searchParams?.get('productUnit');

  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [loadingConvs,   setLoadingConvs]   = useState(false);
  const [activeConv,     setActiveConv]     = useState<Conversation | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [inputText,      setInputText]      = useState('');
  const [sending,        setSending]        = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [mobileView,     setMobileView]     = useState<'list' | 'chat'>('list');
  const [negotiationCancelledFor, setNegotiationCancelledFor] = useState<Set<string>>(new Set());
  const negotiationStartedRef = useRef(false);

  const socketRef      = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  // Track active conversation id for socket re-join on reconnect
  const activeConvIdRef = useRef<string | null>(null);


  // ── Load conversations ───────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await api.get('/chat/conversations');
      const data: Conversation[] = res.data;
      setConversations(data);
      return data;
    } catch (err) {
      console.error('[Chat] loadConversations error:', err);
      return [] as Conversation[];
    } finally { setLoadingConvs(false); }
  }, []);

  // ── Load messages ────────────────────────────────────────────────────────
  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('[Chat] loadMessages error:', err);
    } finally { setLoadingMsgs(false); }
  }, []);

  // ── Select conversation ──────────────────────────────────────────────────
  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setMobileView('chat');
    activeConvIdRef.current = conv.id;
    socketRef.current?.emit('joinRoom', { conversationId: conv.id });
    await loadMessages(conv.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [loadMessages]);
  // ── Emit startNegotiation (only once per mount) ─────────────────────
  const emitStartNegotiation = useCallback((conversationId: string) => {
    if (negotiationStartedRef.current) return;
    if (!productIdParam || !qtyParam)  return;
    negotiationStartedRef.current = true;
    socketRef.current?.emit('startNegotiation', {
      conversationId,
      productId:     productIdParam,
      quantity:      qtyParam,
      proposedPrice: proposedPriceParam || undefined,
    });
  }, [productIdParam, qtyParam, proposedPriceParam]);

  // ── Cancel negotiation ──────────────────────────────────────
  const handleCancelNegotiation = () => {
    if (!activeConv) return;
    socketRef.current?.emit('cancelNegotiation', { conversationId: activeConv.id });
  };

  // ── Respond to quote ────────────────────────────────────────
  const respondToQuote = (messageId: string, action: 'ACCEPTED' | 'REJECTED') => {
    if (!activeConv) return;
    socketRef.current?.emit('respondToQuote', {
      messageId,
      action,
      conversationId: activeConv.id,
    });
  };
  // ── Socket setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Chat] Socket connected');
      // Re-join room on reconnect if there's an active conversation
      if (activeConvIdRef.current) {
        socket.emit('joinRoom', { conversationId: activeConvIdRef.current });
      }
    });
    socket.on('disconnect', () => console.log('[Chat] Socket disconnected'));

    socket.on('newMessage', (msg: Message) => {
      // Normalize: some older emits may use `content` instead of `message_content`
      const normalized: Message = {
        ...msg,
        message_content: (msg as any).message_content ?? (msg as any).content ?? '',
        message_type:    (msg as any).message_type ?? 'TEXT',
      };
      setMessages(prev =>
        prev.find(m => m.id === normalized.id) ? prev : [...prev, normalized]
      );
    });

    // Quote status updated (works for both nested + flat quote messages)
    socket.on('quoteUpdated', ({ messageId, status }: { messageId: string; status: QuoteData['status'] }) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId) return m;
          // Update nested quote
          if (m.quote) return { ...m, quote: { ...m.quote, status } };
          // Update flat quote fields
          if (m.quote_status !== undefined) return { ...m, quote_status: status };
          return m;
        })
      );
    });

    // Buyer accepted → redirect to checkout
    socket.on('negotiationAccepted', ({ checkoutData }: { checkoutData: CheckoutData }) => {
      const { productId, productName, quantity, negotiatedPrice, unit, sellerId: sId } = checkoutData;
      router.push(
        `/checkout?ng=1` +
        `&id=${encodeURIComponent(productId)}` +
        `&name=${encodeURIComponent(productName)}` +
        `&qty=${quantity}` +
        `&price=${encodeURIComponent(negotiatedPrice)}` +
        `&unit=${encodeURIComponent(unit)}` +
        `&sellerId=${encodeURIComponent(sId)}`
      );
    });

    // Negotiation cancelled
    socket.on('negotiationCancelled', ({ conversationId }: { conversationId: string }) => {
      setNegotiationCancelledFor(prev => new Set([...prev, conversationId]));
    });

    socket.on('conversationReady', ({ conversationId }: { conversationId: string }) => {
      socket.emit('joinRoom', { conversationId });
      loadConversations().then(convs => {
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
          selectConversation(conv).then(() => {
            if (isNegotiate) emitStartNegotiation(conversationId);
          });
        }
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user, loadConversations, selectConversation]);

  // ── Init: load convs + handle URL params ─────────────────────────────────
  useEffect(() => {
    loadConversations().then(convs => {
      if (convIdParam) {
        const conv = convs.find(c => c.id === convIdParam);
        if (conv) selectConversation(conv);
        return;
      }
      if (sellerIdParam) {
        const existing = convs.find(c => c.partner?.id === sellerIdParam);
        const openConv = (conv: Conversation) => {
          selectConversation(conv).then(() => {
            if (isNegotiate) emitStartNegotiation(conv.id);
          });
        };
        if (existing) { openConv(existing); return; }
        api
          .post('/chat/initiate', { partnerId: sellerIdParam })
          .then(res => {
            socketRef.current?.emit('joinRoom', { conversationId: res.data.conversationId });
            return loadConversations().then(fresh => {
              const c = fresh.find(f => f.id === res.data.conversationId)
                     || fresh.find(f => f.partner?.id === sellerIdParam);
              if (c) openConv(c);
            });
          })
          .catch(() => {
            const tryStart = () =>
              socketRef.current?.emit('startConversation', { partnerId: sellerIdParam });
            if (socketRef.current?.connected) tryStart();
            else {
              const iv = setInterval(() => {
                if (socketRef.current?.connected) { tryStart(); clearInterval(iv); }
              }, 300);
            }
          });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerIdParam, convIdParam]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeConv || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit('sendMessage', {
      conversationId: activeConv.id,
      content:        inputText.trim(),
    });
    setInputText('');
    setSending(false);
  }, [inputText, activeConv]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConvs = conversations.filter(c =>
    getPartnerName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const negotiationMsg    = extractNegotiationMsg(messages);
  const isNegotiationConv = !!negotiationMsg;
  const isCancelled       = activeConv ? negotiationCancelledFor.has(activeConv.id) : false;

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-10">
      <Container>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-green-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Tin nhắn</span>
        </div>

        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ height: 'calc(100vh - 160px)', minHeight: 520 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full">

            {/* ══════════ LEFT: CONVERSATION LIST ══════════ */}
            <div className={`border-r border-gray-100 flex flex-col h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-600"/> Tin nhắn
                </h2>
                <div className="mt-3 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loadingConvs && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-green-600" size={24}/>
                  </div>
                )}

                {!loadingConvs && filteredConvs.length === 0 && (
                  <div className="text-center py-16 px-4">
                    <MessageCircle size={48} className="mx-auto text-gray-200 mb-3"/>
                    <p className="text-sm font-semibold text-gray-500">Chưa có cuộc trò chuyện</p>
                    <p className="text-xs text-gray-400 mt-1">Bấm &quot;Chat ngay&quot; trên trang sản phẩm để bắt đầu</p>
                  </div>
                )}

                {filteredConvs.map(conv => {
                  const name     = getPartnerName(conv);
                  const isActive = activeConv?.id === conv.id;
                  const lastMsg  = conv.lastMessage;
                  const isMyMsg  = lastMsg?.sender_id === user?.id;
                  const isNeg    = false; // negotiation badge derived per-message, not per-conversation
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 ${
                        isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-black text-lg border border-gray-100">
                        {conv.partner?.avatar
                          ? <img src={resolveImageUrl(conv.partner.avatar)} alt="" className="w-full h-full object-cover"/>
                          : name.charAt(0).toUpperCase()
                        }
                        {/* Badge icon overlay for negotiation */}
                        {isNeg && (
                          <span className="absolute -bottom-0.5 -right-0.5 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">🤝</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p className={`font-bold text-sm truncate ${isActive ? 'text-green-700' : 'text-gray-900'}`}>{name}</p>
                          {lastMsg && (
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(lastMsg.created_at)}</span>
                          )}
                        </div>

                        {lastMsg && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {isMyMsg ? 'Bạn: ' : ''}{lastMsg.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════ RIGHT: CHAT WINDOW ══════════ */}
            <div className={`flex flex-col h-full ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-4">
                    <MessageCircle size={36} className="text-green-400"/>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">Chọn cuộc trò chuyện</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Hoặc tìm sản phẩm và bấm &quot;Chat ngay&quot;<br/>để bắt đầu nhắn tin với người bán.
                  </p>
                  <Link
                    href="/products"
                    className="mt-6 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                  >
                    Khám phá sản phẩm
                  </Link>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
                    <button
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                      <ChevronLeft size={20}/>
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100 flex-shrink-0 flex items-center justify-center text-green-700 font-black border border-gray-100">
                      {activeConv.partner?.avatar
                        ? <img src={resolveImageUrl(activeConv.partner.avatar)} alt="" className="w-full h-full object-cover"/>
                        : getPartnerName(activeConv).charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{getPartnerName(activeConv)}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"/>
                        Đang hoạt động
                        {isNegotiationConv && (
                          <span className="ml-2 bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            Đang đàm phán
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isNegotiationConv && !isCancelled && (
                        <button
                          onClick={handleCancelNegotiation}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          <XCircle size={13}/> Hủy đàm phán
                        </button>
                      )}
                      <Link
                        href={`/shop/${activeConv.partner?.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-green-600 border border-gray-200 hover:border-green-300 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Store size={13}/> Xem shop
                      </Link>
                    </div>
                  </div>

                  {/* Negotiation info banner */}
                  {isNegotiationConv && negotiationMsg?.context_product && (
                    <div className="px-5 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2 text-xs text-orange-700">
                      <Handshake size={13}/>
                      <span>Đàm phán giá: <strong>{negotiationMsg.context_product.name}</strong></span>
                    </div>
                  )}

                  {/* Cancelled banner */}
                  {isCancelled && (
                    <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs text-red-600 font-medium">
                      <RotateCcw size={13}/> Đàm phán đã kết thúc. Bạn có thể tiếp tục nhắn tin bình thường.
                    </div>
                  )}

                  {/* Product reference card — hiển thị khi chat có kèm sản phẩm (non-negotiation) */}
                  {(() => {
                    // Ưu tiên dataURL params; nếu không có thì dùng context_product từ negotiation message
                    const convProduct  = negotiationMsg?.context_product ?? null;
                    const displayName  = refProductName ? decodeURIComponent(refProductName) : convProduct?.name;
                    const displayImg   = refProductImg  ? fixImg(decodeURIComponent(refProductImg)) : (convProduct?.image ? fixImg(convProduct.image) : null);
                    const displayPrice = refProductPrice ? Number(refProductPrice) : (convProduct?.reference_price ?? convProduct?.price ?? null);
                    const displayUnit  = refProductUnit  ? decodeURIComponent(refProductUnit) : convProduct?.unit ?? null;
                    const displayId    = productIdParam ?? convProduct?.id ?? null;

                    if (isNegotiationConv || !displayName) return null;

                    return (
                      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                          {displayImg ? (
                            <img src={displayImg} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={20} className="text-gray-300"/>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">Đang hỏi về sản phẩm</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          {displayPrice != null && (
                            <p className="text-sm text-green-600 font-bold mt-0.5">
                              {formatCurrency(displayPrice)}
                              {displayUnit && <span className="text-xs text-gray-400 font-normal ml-1">/ {displayUnit}</span>}
                            </p>
                          )}
                        </div>
                        {displayId && (
                          <Link
                            href={`/products/${displayId}`}
                            className="text-xs text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 px-2.5 py-1.5 rounded-lg font-semibold flex-shrink-0 transition-all"
                          >
                            Xem SP
                          </Link>
                        )}
                      </div>
                    );
                  })()}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50/50">
                    {loadingMsgs && (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-green-600" size={24}/>
                      </div>
                    )}
                    {!loadingMsgs && messages.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-sm text-gray-400">Hãy gửi tin nhắn đầu tiên! 👋</p>
                      </div>
                    )}

                    {messages.map((msg, idx) => {
                      const isMe    = msg.sender?.id === user?.id;
                      const prevMsg = messages[idx - 1];
                      const showTime = !prevMsg ||
                        (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000;

                      const TimeDiv = showTime ? (
                        <div className="text-center my-3">
                          <span className="text-[11px] text-gray-400 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}{new Date(msg.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ) : null;

                      // SYSTEM message
                      if (msg.message_type === 'SYSTEM') {
                        const cp = msg.context_product;
                        // SYSTEM + context_product + proposed_* → Nương thương lượng request card (buyer view)
                        if (cp && msg.proposed_quantity) {
                          return (
                            <div key={msg.id || idx}>
                              {TimeDiv}
                              <div className="flex justify-center my-3">
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 w-full max-w-[340px] shadow-sm">
                                  <p className="text-xs text-orange-600 font-bold mb-2 flex items-center gap-1.5">
                                    <Handshake size={13}/> Yêu cầu thương lượng đã gửi
                                  </p>
                                  {/* Product badge */}
                                  <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                                    <div className="flex items-center gap-2 min-w-max">
                                      {cp.image && (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                          <img src={fixImg(cp.image)} alt={cp.name} className="w-full h-full object-cover" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs font-bold text-gray-900">{cp.name}</p>
                                        <p className="text-xs text-green-600 font-semibold">{formatCurrency(cp.reference_price ?? cp.price ?? 0)}/{cp.unit || 'kg'}</p>
                                      </div>
                                      <Link href={`/products/${cp.id}`} className="ml-2 text-green-600 hover:text-green-700">
                                        <ExternalLink size={12}/>
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-orange-100 px-3 py-2 text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Số lượng muốn mua:</span>
                                      <span className="font-bold">{msg.proposed_quantity} {cp.unit || 'kg'}</span>
                                    </div>
                                    {msg.proposed_price && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Giá đề xuất:</span>
                                        <span className="font-bold text-orange-600">{formatCurrency(msg.proposed_price)}/{cp.unit || 'kg'}</span>
                                      </div>
                                    )}
                                    {msg.proposed_price && (
                                      <div className="flex justify-between border-t border-orange-100 pt-1">
                                        <span className="text-gray-600 font-medium">Tổng dự kiến:</span>
                                        <span className="font-black text-orange-700">{formatCurrency(msg.proposed_price * msg.proposed_quantity)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        // SYSTEM + context_product (no proposed) → Badge sản phẩm khối hỏi
                        if (cp) {
                          return (
                            <div key={msg.id || idx}>
                              {TimeDiv}
                              <div className="flex justify-center my-2">
                                <div className="border border-gray-200 bg-white rounded-full shadow-sm overflow-x-auto max-w-[90%]">
                                  <Link href={`/products/${cp.id}`} className="flex items-center gap-2 px-3 py-1.5 min-w-max hover:bg-gray-50 transition">
                                    {cp.image && (
                                      <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                                        <img src={fixImg(cp.image)} alt={cp.name} className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <span className="text-xs text-gray-500">Đang hỏi về:</span>
                                    <span className="text-xs font-bold text-gray-900">{cp.name}</span>
                                    <span className="text-xs text-green-600 font-semibold">{formatCurrency(cp.reference_price ?? cp.price ?? 0)}</span>
                                    <ExternalLink size={11} className="text-gray-300"/>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        // Plain SYSTEM message
                        return (
                          <div key={msg.id || idx}>
                            {TimeDiv}
                            <div className="flex justify-center my-2">
                              <div className="bg-green-50 border border-green-100 text-green-700 text-xs font-medium px-4 py-1.5 rounded-full max-w-[85%] text-center">
                                {msg.message_content}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // NEGOTIATION_QUOTE card
                      const quote = extractQuote(msg);
                      if (msg.message_type === 'NEGOTIATION_QUOTE' && quote) {
                        return (
                          <div key={msg.id || idx}>
                            {TimeDiv}
                            <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isMe && (
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0 border border-gray-100">
                                  {getPartnerName(activeConv).charAt(0)}
                                </div>
                              )}
                              <NegotiationQuoteCard
                                quote={quote}
                                isBuyer={!isMe}
                                onAccept={() => respondToQuote(quote.messageId, 'ACCEPTED')}
                                onReject={() => respondToQuote(quote.messageId, 'REJECTED')}
                              />
                            </div>
                          </div>
                        );
                      }

                      // TEXT message
                      return (
                        <div key={msg.id || idx}>
                          {TimeDiv}
                          <div className={`flex items-end gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0 border border-gray-100 mb-0.5">
                                {getPartnerName(activeConv).charAt(0)}
                              </div>
                            )}
                            <div className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-green-600 text-white rounded-br-sm shadow-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                            }`}>
                              {msg.message_content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef}/>
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none text-sm bg-gray-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-all flex-shrink-0 shadow-sm"
                    >
                      {sending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </Container>
    </div>
  );
}
