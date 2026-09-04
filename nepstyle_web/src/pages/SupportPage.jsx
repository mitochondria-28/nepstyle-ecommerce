import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Headphones, RefreshCw } from 'lucide-react';
import { aiSupportChat } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';

const QUICK_QUESTIONS = [
  'How do I return a product?',
  'When will my order arrive?',
  'What payment methods do you accept?',
  'How do I cancel my order?',
  'What is your refund policy?',
  'How to exchange a product?',
];

const WELCOME = "Hello! I'm Nep, your NepStyle support assistant. I can help with returns, refunds, delivery, payments, order cancellations, and more. What can I help you with today?";

function Bubble({ role, content }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  const formatted = content.split('\n').map((line, i) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    return (
      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Headphones size={14} className="text-white" />
      </div>
      <div className="max-w-[78%] bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed shadow-sm">
        {formatted}
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex gap-3 items-center">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0">
        <Headphones size={14} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    setShowQuick(false);
    setMessages(prev => [...prev, { role: 'user', content }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiSupportChat(content, user?.user_id ?? null, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I couldn't respond right now. Please email us at support@nepstyle.com or try again shortly.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setInput('');
    setShowQuick(true);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary2 flex items-center justify-center shadow">
            <Headphones size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-primary">Customer Support</h1>
            <p className="text-xs text-gray-400 mt-0.5">AI-powered · Instant responses</p>
          </div>
        </div>
        <button
          onClick={reset}
          title="Start new conversation"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary border border-gray-200 hover:border-primary px-3 py-1.5 rounded-xl transition-all"
        >
          <RefreshCw size={12} /> New chat
        </button>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-gray-50/60 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-[400px] max-h-[55vh]">
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}

          {/* Quick question chips */}
          {showQuick && messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pl-11">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-white border border-gray-200 hover:border-primary hover:bg-primary4 hover:text-primary text-gray-600 px-3 py-1.5 rounded-xl transition-all font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {loading && <Typing />}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={e => { e.preventDefault(); send(); }}
          className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about returns, delivery, payments…"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex-shrink-0 bg-primary hover:bg-primary1 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-gray-400 mt-4">
        Can't find what you need? Email{' '}
        <a href="mailto:support@nepstyle.com" className="text-primary hover:underline font-medium">
          support@nepstyle.com
        </a>
      </p>
    </div>
  );
}
