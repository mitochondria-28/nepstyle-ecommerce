import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import { aiChat } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';

const WELCOME = "Hi! I'm **Nep**, your NepStyle shopping assistant. Ask me anything — product suggestions, sizing advice, store policies, or your orders.";

const QUICK_PROMPTS = [
  "What's popular right now?",
  "Show me winter jackets under Rs.3,000",
  "What's your return policy?",
];

export default function AIChatWidget() {
  const { user } = useAuth();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [unread, setUnread]       = useState(false);
  const messagesEndRef             = useRef(null);
  const inputRef                   = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnread(false);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    const userMsg = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await aiChat(
        [...history, { role: 'user', content }],
        user?.user_id ?? null,
      );
      const assistantMsg = { role: 'assistant', content: res.data.response };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!open) setUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* ── Floating button ───────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 ${
          open
            ? 'bg-gray-700 text-white'
            : 'bg-gradient-to-r from-primary to-primary2 text-white hover:shadow-xl hover:-translate-y-0.5'
        }`}
        aria-label="Toggle AI assistant"
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
        <span className="text-sm font-bold">{open ? 'Close' : 'Ask Nep'}</span>
        {!open && unread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Chat panel ───────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary2 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">Nep</p>
            <p className="text-white/70 text-xs">NepStyle AI Assistant</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-white/60 hover:text-white text-xs transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50">
          {/* Welcome */}
          <BubbleAssistant content={WELCOME} />

          {/* Quick prompts (only before first message) */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-[11px] bg-white border border-gray-200 hover:border-primary hover:bg-primary4 hover:text-primary text-gray-600 px-2.5 py-1.5 rounded-xl transition-all font-medium"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Chat history */}
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <BubbleUser key={i} content={m.content} />
            ) : (
              <BubbleAssistant key={i} content={m.content} />
            ),
          )}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white flex-shrink-0"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask about products, policies…"
            rows={1}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white leading-snug"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex-shrink-0 bg-primary hover:bg-primary1 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </>
  );
}

/* ── Small helper components ──────────────────────────────── */

function BubbleUser({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-primary text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}

function BubbleAssistant({ content }) {
  // Simple markdown: **bold**, newlines
  const formatted = content
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={i} className={i > 0 ? 'mt-1' : ''}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
          )}
        </p>
      );
    });

  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="max-w-[82%] bg-white border border-gray-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed shadow-sm">
        {formatted}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
