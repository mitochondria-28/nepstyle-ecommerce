import { useState } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';
import { aiSearch } from '../api/aiApi';

const SUGGESTED = [
  'Is this true to size?',
  'What material is it made of?',
  'Is it suitable for outdoor use?',
  'How does the quality compare?',
];

export default function ProductQA({ productId }) {
  const [question, setQuestion]   = useState('');
  const [answers, setAnswers]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(true);

  const ask = async (q) => {
    const text = (q || question).trim();
    if (!text || loading) return;
    setQuestion('');
    setLoading(true);
    try {
      // Import inline to avoid circular deps
      const { default: axios } = await import('axios');
      const AI_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'https://ai-service-production-7d9f.up.railway.app';
      const AI_KEY  = import.meta.env.VITE_AI_API_KEY || '';
      const res = await axios.post(
        `${AI_BASE}/ai/product/${productId}/ask`,
        { question: text },
        { headers: { 'Content-Type': 'application/json', ...(AI_KEY ? { 'X-AI-Key': AI_KEY } : {}) }, timeout: 20000 },
      );
      setAnswers((prev) => [{ question: text, answer: res.data.answer }, ...prev]);
    } catch {
      setAnswers((prev) => [
        { question: text, answer: "Sorry, I couldn't get an answer right now. Please try again." },
        ...prev,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary2 rounded-xl flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-primary text-sm">Ask AI About This Product</p>
            <p className="text-xs text-gray-400">Powered by Nep — NepStyle's AI assistant</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-50">
          {/* Input */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="e.g. Is this waterproof? What sizes are available?"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-gray-50 focus:bg-white"
            />
            <button
              onClick={() => ask()}
              disabled={!question.trim() || loading}
              className="w-10 h-10 flex-shrink-0 bg-primary hover:bg-primary1 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {/* Suggestions (show only if no answers yet) */}
          {answers.length === 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  disabled={loading}
                  className="text-xs bg-primary4 hover:bg-primary3/30 text-primary px-3 py-1.5 rounded-full transition-colors font-medium disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Answers */}
          {answers.length > 0 && (
            <div className="mt-4 space-y-4">
              {answers.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircleQuestion size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-700">{item.question}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={10} className="text-white" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center flex-shrink-0">
                <Sparkles size={10} className="text-white" />
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((j) => (
                  <span
                    key={j}
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${j * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400">Nep is thinking…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
