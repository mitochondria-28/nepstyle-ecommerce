import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw, ShoppingCart, Eye } from 'lucide-react';
import { submitStyleQuiz } from '../api/aiApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

/* ── Quiz data ─────────────────────────────────────────────────── */
const STYLES = [
  { value: 'casual',  label: 'Casual',  emoji: '🌿', desc: 'Everyday comfort & ease'   },
  { value: 'formal',  label: 'Formal',  emoji: '💼', desc: 'Sharp & professional'       },
  { value: 'sporty',  label: 'Sporty',  emoji: '⚡', desc: 'Active & performance-ready' },
  { value: 'trendy',  label: 'Trendy',  emoji: '✨', desc: 'Bold & fashion-forward'     },
];

const BUDGETS = [
  { value: 'budget',  label: 'Under Rs 1,000', emoji: '💚', desc: 'Great finds, low prices'     },
  { value: 'mid',     label: 'Rs 1,000–3,000', emoji: '🔵', desc: 'Quality at a fair price'     },
  { value: 'premium', label: 'Rs 3,000+',      emoji: '💜', desc: 'Premium & top brands'        },
];

const CATEGORIES = [
  { value: 'tops',        label: 'Tops',        emoji: '👕' },
  { value: 'bottoms',     label: 'Bottoms',     emoji: '👖' },
  { value: 'outerwear',   label: 'Outerwear',   emoji: '🧥' },
  { value: 'footwear',    label: 'Footwear',    emoji: '👟' },
  { value: 'accessories', label: 'Accessories', emoji: '👜' },
];

/* ── Step indicator ────────────────────────────────────────────── */
function StepDots({ step, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < step ? 'bg-primary w-6' : i === step ? 'bg-primary w-8' : 'bg-gray-200 w-2'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Loading screen ────────────────────────────────────────────── */
function FindingStyle() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/5 via-white to-primary2/5">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary2 flex items-center justify-center shadow-xl">
          <Sparkles size={36} className="text-white animate-pulse" />
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 animate-ping" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Crafting Your Style Profile</h2>
        <p className="text-sm text-gray-500">AI is picking your perfect looks…</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Results view ──────────────────────────────────────────────── */
function QuizResults({ result, onRetake }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAdd = async (product) => {
    try {
      await addToCart(product.product_id, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Could not add to cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Profile card */}
      <div className="bg-gradient-to-br from-primary via-primary1 to-primary2 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="text-5xl mb-3">{result.style_emoji}</div>
          <div className="inline-flex items-center gap-1.5 text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold mb-3">
            <Sparkles size={9} /> Your Style Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3">{result.profile_name}</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-md mx-auto">{result.profile_bio}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold capitalize">{result.style}</span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">{result.budget_label}</span>
            {result.categories.map(c => (
              <span key={c} className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold capitalize">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Your Picks</h2>
            <p className="text-sm text-gray-500">{result.products.length} items curated for your style</p>
          </div>
          <button
            onClick={onRetake}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <RotateCcw size={14} /> Retake Quiz
          </button>
        </div>

        {result.products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-4">No products matched your selections right now.</p>
            <button onClick={onRetake} className="text-primary font-semibold hover:underline">Try different preferences</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.products.map(p => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main quiz page ────────────────────────────────────────────── */
export default function StyleQuizPage() {
  const { user } = useAuth();
  const [step,       setStep]       = useState(0);
  const [style,      setStyle]      = useState(null);
  const [budget,     setBudget]     = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);

  const toggleCat = (val) =>
    setCategories(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitStyleQuiz({
        style,
        budget,
        categories: categories.length > 0 ? categories : ['tops'],
        userId: user?.user_id || null,
      });
      setResult(res.data);
    } catch {
      // keep going with error state handled in results
      setResult({ products: [], profile_name: 'Your Style', profile_bio: '', style_emoji: '✨', style, budget, budget_label: budget, categories });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setStyle(null);
    setBudget(null);
    setCategories([]);
    setResult(null);
    setLoading(false);
  };

  if (loading) return <FindingStyle />;
  if (result)  return <QuizResults result={result} onRetake={reset} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary2/5">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full mb-4">
            <Sparkles size={11} /> AI Style Quiz
          </div>
          <h1 className="text-2xl font-black text-gray-900">Find Your Perfect Style</h1>
          <p className="text-gray-500 text-sm mt-1.5">3 quick questions — personalized picks in seconds</p>
        </div>

        <StepDots step={step} total={3} />

        {/* ── Step 0: Style ── */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-6">What's your vibe?</h2>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setStyle(s.value); setStep(1); }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                    style === s.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/3'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{s.emoji}</span>
                  <p className="font-bold text-gray-800 text-sm">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Budget ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-6">What's your budget?</h2>
            <div className="flex flex-col gap-3">
              {BUDGETS.map(b => (
                <button
                  key={b.value}
                  onClick={() => { setBudget(b.value); setStep(2); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.01] ${
                    budget === b.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{b.label}</p>
                    <p className="text-xs text-gray-500">{b.desc}</p>
                  </div>
                  <ArrowRight size={16} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              className="mt-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mx-auto"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* ── Step 2: Categories ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">What are you shopping for?</h2>
            <p className="text-xs text-gray-400 text-center mb-6">Select all that apply</p>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {CATEGORIES.map(c => {
                const selected = categories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    onClick={() => toggleCat(c.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm scale-[1.04]'
                        : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/3'
                    }`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700">{c.label}</span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <svg width="8" height="6" fill="none" viewBox="0 0 8 6">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={categories.length === 0}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-primary to-primary1 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Sparkles size={16} />
              Get My Style Picks
            </button>

            <button
              onClick={() => setStep(1)}
              className="mt-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mx-auto"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
