import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import axios from 'axios';

const AI_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'https://ai-service-production-7d9f.up.railway.app';
const AI_KEY  = import.meta.env.VITE_AI_API_KEY  || '';

const aiAxios = axios.create({
  baseURL: AI_BASE,
  headers: { 'Content-Type': 'application/json', ...(AI_KEY ? { 'X-AI-Key': AI_KEY } : {}) },
  timeout: 30000,
});

const QUICK = [
  'What is the status of my latest order?',
  'How much have I spent in total?',
  'Can I cancel my pending order?',
  'Show me my order history',
];

function Bubble({ role, content }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  // Format **bold** and newlines
  const formatted = content.split('\n').map((line, i) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    return (
      <p key={i} className={i > 0 ? 'mt-1' : ''}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Package size={13} className="text-white" />
      </div>
      <div className="max-w-[82%] bg-white border border-gray-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed shadow-sm">
        {formatted}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0">
        <Package size={13} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function AIOrderAssistant({ userId, orderCount = 0 }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const endRef                = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiAxios.post('/ai/order-assistant', {
        message: content,
        user_id: userId,
        history,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't retrieve your order details right now. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary2 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-primary text-sm">Ask About Your Orders</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {orderCount > 0 ? `${orderCount} order${orderCount !== 1 ? 's' : ''} · AI-powered support` : 'AI-powered order assistant'}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        }
      </button>

      {/* Chat body */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Messages */}
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {messages.length === 0 && (
              <>
                <Bubble role="assistant" content="Hi! I can help you track orders, check your spending, or answer questions about your purchase history. What would you like to know?" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-[11px] bg-white border border-gray-200 hover:border-primary hover:bg-primary4 hover:text-primary text-gray-600 px-2.5 py-1.5 rounded-xl transition-all font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
            {loading && <Typing />}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(); }}
            className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              placeholder="Ask about your orders…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex-shrink-0 bg-primary hover:bg-primary1 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
