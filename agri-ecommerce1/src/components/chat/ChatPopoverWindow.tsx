'use client';

/**
 * ChatPopoverWindow — Mini chat panel mở từ nút "Chat ngay" trên trang sản phẩm.
 * Hiển thị dưới dạng floating panel (bottom-right).
 * Kết nối socket để realtime. Mỗi lần mở: POST /chat/initiate rồi load messages.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { X, Send, Loader2, MessageCircle, ChevronDown, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';
import { formatCurrency } from '@/utils/vi';
import { Message, extractQuote } from '@/types/chat';

interface ProductInfo {
  id:    string;
  name:  string;
  price: number;
  unit?: string;
  image?: string;
}

interface ShopInfo {
  id:         string;
  store_name: string;
  avatar_url?: string;
}

interface Props {
  product: ProductInfo;
  shop:    ShopInfo;
  onClose: () => void;
}

const BACKEND_URL = 'http://localhost:3001';
const fixImg = (url: string) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

export const ChatPopoverWindow = ({ product, shop, onClose }: Props) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [inputText,      setInputText]      = useState('');
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [currentUser,   setCurrentUser]    = useState<{ id: string } | null>(null);

  const socketRef      = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  // Ref mirrors state — callbacks always get latest conversationId without stale closure
  const convIdRef      = useRef<string>('');

  // Get current user id
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Init: create/find conversation, connect socket, load messages
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }

    const init = async (socket: Socket) => {
      try {
        const res = await api.post('/chat/initiate', {
          partnerId: shop.id,
          productId: product.id,
        });
        const convId: string = res.data.conversationId;
        convIdRef.current = convId;
        setConversationId(convId);

        // Join room — socket.io buffers if not connected yet, replays on connect
        socket.emit('joinRoom', { conversationId: convId });

        // Load existing messages; merge with any realtime that arrived during HTTP
        const msgRes = await api.get(`/chat/conversations/${convId}/messages`);
        const httpMsgs: Message[] = msgRes.data || [];
        setMessages(prev => {
          const idSet = new Set(prev.map(m => m.id));
          const extras = httpMsgs.filter(m => !idSet.has(m.id));
          const merged = [...prev, ...extras];
          merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          return merged;
        });
      } catch (err) {
        console.error('[ChatPopover] init error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Setup socket
    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    // On (re)connect: re-join room if conversation is already established
    socket.on('connect', () => {
      if (convIdRef.current) {
        socket.emit('joinRoom', { conversationId: convIdRef.current });
      }
    });

    socket.on('newMessage', (msg: Message) => {
      const normalized: Message = {
        ...msg,
        message_content: (msg as any).message_content ?? (msg as any).content ?? '',
        message_type:    (msg as any).message_type ?? 'TEXT',
      };
      setMessages(prev => prev.find(m => m.id === normalized.id) ? prev : [...prev, normalized]);
    });

    socketRef.current = socket;
    init(socket);

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id, product.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    // Use ref so this callback never captures a stale conversationId
    const convId = convIdRef.current;
    if (!inputText.trim() || !convId || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit('sendMessage', {
      conversationId: convId,
      content: inputText.trim(),
    });
    setInputText('');
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
      style={{ height: 520 }}
    >
      {/* ── Header ── */}
      <div className="bg-green-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-green-500 flex-shrink-0 border border-green-400">
          {shop.avatar_url
            ? <img src={fixImg(shop.avatar_url)} alt="" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{shop.store_name[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{shop.store_name}</p>
          <p className="text-green-200 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block animate-pulse" />
            Đang hoạt động
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/chat?conversationId=${conversationId || ''}`}
            className="p-1.5 hover:bg-green-500 rounded-lg transition text-green-200 hover:text-white"
            title="Mở chat đầy đủ"
          >
            <ExternalLink size={15} />
          </Link>
          <button onClick={onClose} className="p-1.5 hover:bg-green-500 rounded-lg transition text-green-200 hover:text-white">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Product badge (horizontal scrollable) ── */}
      <div className="flex-shrink-0 border-b border-gray-100 overflow-x-auto">
        <div className="flex items-center gap-3 px-3 py-2 min-w-max">
          <Link href={`/products/${product.id}`} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
              <img src={fixImg(product.image || '')} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wide">Đang hỏi về</p>
              <p className="text-xs font-bold text-gray-900 group-hover:text-green-600 transition truncate max-w-[180px]">{product.name}</p>
            </div>
            <div className="flex-shrink-0">
              <p className="text-xs font-bold text-green-600">
                {formatCurrency(product.price)}
                {product.unit && <span className="text-[10px] text-gray-400 font-normal ml-1">/ {product.unit}</span>}
              </p>
            </div>
            <ExternalLink size={12} className="text-gray-300 group-hover:text-green-500 flex-shrink-0 transition" />
          </Link>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-gray-50/60">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-green-600" size={22} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">Hãy gửi tin nhắn đầu tiên! 👋</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe    = currentUser ? msg.sender?.id === currentUser.id : false;
          const prevMsg = messages[idx - 1];
          const showTime = !prevMsg ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

          // SYSTEM message
          if (msg.message_type === 'SYSTEM') {
            return (
              <div key={msg.id || idx}>
                {showTime && (
                  <div className="text-center my-2">
                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                      {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                <div className="flex justify-center my-1.5">
                  <div className="bg-green-50 border border-green-100 text-green-700 text-xs px-3 py-1 rounded-full text-center max-w-[90%]">
                    {msg.message_content}
                  </div>
                </div>
              </div>
            );
          }

          // NEGOTIATION_QUOTE
          const quote = extractQuote(msg);
          if (msg.message_type === 'NEGOTIATION_QUOTE' && quote) {
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className="bg-white border border-green-200 rounded-xl p-3 max-w-[90%] text-xs shadow-sm">
                  <p className="font-bold text-gray-700 mb-1">📋 Báo giá từ người bán</p>
                  <p className="text-gray-600">{quote.productName} · {quote.quantity} {quote.unit}</p>
                  <p className="text-green-600 font-bold">{formatCurrency(quote.price)}/{quote.unit}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{quote.status === 'PENDING' ? '⏳ Đang chờ' : quote.status === 'ACCEPTED' ? '✅ Đã chấp nhận' : '❌ Đã từ chối'}</p>
                </div>
              </div>
            );
          }

          // TEXT
          return (
            <div key={msg.id || idx}>
              {showTime && (
                <div className="text-center my-2">
                  <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0 border border-gray-100">
                    {shop.store_name[0]}
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
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
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={!conversationId}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none text-sm bg-gray-50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending || !conversationId}
          className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-all flex-shrink-0"
        >
          {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};
