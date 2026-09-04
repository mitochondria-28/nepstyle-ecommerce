import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, ShoppingBag, Package, Headphones, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiAgent } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';

const WELCOME = "Hi! I'm **Nep**, your NepStyle AI assistant. I can help you find products, track orders, or answer any store questions.";

const QUICK_PROMPTS = [
  "Show me popular jackets",
  "Where is my order?",
  "What's your return policy?",
  "Recommend something under Rs.2,000",
];

const INTENT_CONFIG = {
  shopping: { icon: ShoppingBag, label: 'Shopping',  color: 'text-primary  bg-primary4'  },
  order:    { icon: Package,     label: 'Orders',    color: 'text-blue-600 bg-blue-50'   },
  support:  { icon: Headphones,  label: 'Support',   color: 'text-amber-600 bg-amber-50' },
  general:  { icon: Sparkles,    label: 'Assistant', color: 'text-purple-600 bg-purple-50'},
};

// ── Markdown-ish renderer (bold + newlines) ───────────────────────
function Formatted({ content }) {
  return content.split('\n').map((line, i) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    return (
      <p key={i} className={i > 0 ? 'mt-1' : ''}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

// ── Inline product mini-card ──────────────────────────────────────
function ProductCard({ product, onNavigate }) {
  const discount = product.normal_price > product.sell_price
    ? Math.round((1 - product.sell_price / product.normal_price) * 100)
    : 0;

  return (
    <button
      onClick={() => onNavigate(product.product_id)}
      className="flex-shrink-0 w-28 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left"
    >
      <div className="w-full h-20 bg-gray-100 overflow-hidden relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={20} className="text-gray-300" /></div>
        }
        {discount > 0 && (
          <span className="absolute top-1 left-1 text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-1.5">
        <p className="text-[10px] font-semibold text-gray-800 leading-tight line-clamp-2">{product.product_name}</p>
        <p className="text-[10px] font-bold text-primary mt-0.5">Rs.{product.sell_price.toLocaleString()}</p>
      </div>
    </button>
  );
}

// ── Bubble: user ──────────────────────────────────────────────────
function BubbleUser({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-primary text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}

// ── Bubble: assistant ─────────────────────────────────────────────
function BubbleAssistant({ content, intent, products, onNavigate }) {
  const cfg   = INTENT_CONFIG[intent] || INTENT_CONFIG.general;
  const Icon  = cfg.icon;

  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="max-w-[85%] flex flex-col gap-1.5">
        {/* Intent badge */}
        {intent && intent !== 'general' && (
          <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
            <Icon size={8} />{cfg.label}
          </span>
        )}
        {/* Text */}
        <div className="bg-white border border-gray-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed shadow-sm">
          <Formatted content={content} />
        </div>
        {/* Product cards */}
        {products?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {products.map(p => (
              <ProductCard key={p.product_id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator with contextual label ───────────────────────
function Typing({ label }) {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
        {label && <span className="text-[10px] text-gray-400 font-medium">{label}</span>}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────
export default function AIChatWidget() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [toolLabel, setToolLabel] = useState('Thinking…');
  const [unread, setUnread]     = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 150); setUnread(false); }
  }, [open]);

  const goToProduct = (id) => {
    setOpen(false);
    navigate(`/product?id=${id}`);
  };

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);
    setToolLabel('Thinking…');

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiAgent(content, user?.user_id ?? null, history);
      const { response, intent, tool_activity, products } = res.data;
      setToolLabel(tool_activity || 'Thinking…');
      setMessages(prev => [...prev, { role: 'assistant', content: response, intent, products }]);
      if (!open) setUnread(true);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble right now. Please try again.",
        intent: 'general',
        products: null,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 ${
          open
            ? 'bg-gray-700 text-white'
            : 'bg-gradient-to-r from-primary to-primary2 text-white hover:shadow-xl hover:-translate-y-0.5'
        }`}
        aria-label="Toggle AI assistant"
      >
        {open ? <X size={20} /> : <Zap size={20} />}
        <span className="text-sm font-bold">{open ? 'Close' : 'Ask Nep'}</span>
        {!open && unread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ height: '540px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary2 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">Nep</p>
            <p className="text-white/70 text-xs">AI Shopping · Orders · Support</p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-white/60 hover:text-white text-xs transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50">
          <BubbleAssistant content={WELCOME} intent="general" products={null} onNavigate={goToProduct} />

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 pl-9">
              {QUICK_PROMPTS.map(p => (
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

          {messages.map((m, i) =>
            m.role === 'user'
              ? <BubbleUser key={i} content={m.content} />
              : <BubbleAssistant key={i} content={m.content} intent={m.intent} products={m.products} onNavigate={goToProduct} />
          )}

          {loading && <Typing label={toolLabel} />}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white flex-shrink-0"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Find products, track orders, get help…"
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
