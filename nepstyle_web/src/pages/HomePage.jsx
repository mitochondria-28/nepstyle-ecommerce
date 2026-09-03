import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Zap, Shield, RotateCcw, Truck, Star,
  ArrowRight, Flame, Sparkles, TrendingUp,
} from 'lucide-react';
import { fetchHome } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import { getPersonalizedFeed } from '../api/aiApi';
import toast from 'react-hot-toast';

/* ── Hero slides ──────────────────────────────────────────────── */
const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=80',
    tag: 'New Season',
    title: 'Elevate Your\nStyle Game',
    sub: 'Curated fashion from the world\'s top brands, delivered to your doorstep.',
    cta: 'Shop Collection',
    ctaLink: '/products',
    accent: 'from-primary/80 via-primary/50 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&q=80',
    tag: '⚡ Flash Sale',
    title: 'Up to 50% Off\nTop Brands',
    sub: 'Limited-time deals on Adidas, Nike, Puma and more — grab them before they\'re gone.',
    cta: 'See All Deals',
    ctaLink: '/products',
    accent: 'from-primary1/85 via-primary1/50 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80',
    tag: 'Trending Now',
    title: 'Authentic Brands\nGenuine Quality',
    sub: '100% authentic products from global brands. Shop with confidence, every time.',
    cta: 'Explore Brands',
    ctaLink: '/brands',
    accent: 'from-primary2/85 via-primary2/50 to-transparent',
  },
];

/* ── Trust pillars ────────────────────────────────────────────── */
const PILLARS = [
  { icon: Truck,    label: 'Fast Delivery',      desc: 'Across Nepal in 2–5 days' },
  { icon: Shield,   label: '100% Authentic',     desc: 'Genuine branded products' },
  { icon: RotateCcw, label: 'Easy Returns',      desc: '7-day hassle-free returns' },
  { icon: Star,     label: 'Top Rated',          desc: '4.8★ from 10k+ customers' },
];

/* ── Scroll-reveal hook ───────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.disconnect(); } },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Countdown timer ──────────────────────────────────────────── */
function useCountdown(hours = 8) {
  const end = useRef(Date.now() + hours * 3600 * 1000);
  const [time, setTime] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const t = setInterval(() => {
      const diff = Math.max(0, end.current - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

/* ── Digit block (countdown) ──────────────────────────────────── */
function Digit({ value }) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (prev.current !== value) { setFlip(true); setTimeout(() => setFlip(false), 400); }
    prev.current = value;
  }, [value]);
  return (
    <div className={`bg-primary text-white font-bold text-xl w-12 h-12 flex items-center justify-center rounded-xl ${flip ? 'digit-flip' : ''}`}>
      {String(value).padStart(2, '0')}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { user } = useAuth();
  const { loadCart } = useCart();
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [personalizedFeed, setPersonalizedFeed] = useState([]);
  const countdown = useCountdown(7);

  useEffect(() => {
    loadData();
    if (user) {
      loadCart();
      getPersonalizedFeed(user.user_id)
        .then((r) => {
          const items = r.data?.results?.map((x) => x.product ?? x) || [];
          setPersonalizedFeed(items);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx((i) => (i + 1) % SLIDES.length);
      setSlideKey((k) => k + 1);
    }, 5500);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchHome(user?.user_id || 0);
      setHome(res.data);
    } catch { toast.error('Failed to load home data'); }
    finally { setLoading(false); }
  };

  if (loading) return <HomePageSkeleton />;

  const slide = SLIDES[slideIdx];

  return (
    <div className="space-y-0 overflow-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative h-[88vh] min-h-[520px] max-h-[760px] overflow-hidden">
        {/* Background image */}
        <img
          key={slideKey}
          src={slide.image}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover hero-slide-enter"
        />
        {/* Overlay gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full">
            <div className="max-w-xl">
              <span key={slideKey + 'tag'} className="animate-fade-up inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
                <Sparkles size={13} /> {slide.tag}
              </span>
              <h1 key={slideKey + 'h1'} className="animate-fade-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 whitespace-pre-line drop-shadow-lg">
                {slide.title}
              </h1>
              <p key={slideKey + 'sub'} className="animate-fade-up delay-200 text-white/85 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                {slide.sub}
              </p>
              <div key={slideKey + 'cta'} className="animate-fade-up delay-300 flex flex-wrap gap-3">
                <Link
                  to={slide.ctaLink}
                  className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3.5 rounded-2xl hover:bg-primary4 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
                >
                  {slide.cta} <ArrowRight size={16} />
                </Link>
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-7 py-3.5 rounded-2xl border border-white/30 hover:bg-white/25 transition-all duration-200 text-sm"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIdx(i); setSlideKey((k) => k + 1); }}
              className={`rounded-full transition-all duration-300 ${i === slideIdx ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Arrow nav */}
        <button
          onClick={() => { setSlideIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length); setSlideKey(k => k + 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 transition-all z-20"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <button
          onClick={() => { setSlideIdx((i) => (i + 1) % SLIDES.length); setSlideKey(k => k + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 transition-all z-20"
        >
          <ChevronRight size={20} />
        </button>
      </section>

      {/* ── TRUST PILLARS ─────────────────────────────────────── */}
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 py-12">

        {/* ── CATEGORIES ──────────────────────────────────────── */}
        {home?.categories?.length > 0 && (
          <CategoriesSection categories={home.categories} />
        )}

        {/* ── FLASH SALE ──────────────────────────────────────── */}
        {home?.flashSaleProducts?.length > 0 && (
          <FlashSaleSection products={home.flashSaleProducts} countdown={countdown} navigate={navigate} />
        )}

        {/* ── AI PERSONALISED FEED ─────────────────────────── */}
        {user && personalizedFeed.length > 0 && (
          <PersonalisedSection products={personalizedFeed} navigate={navigate} />
        )}

        {/* ── BRANDS MARQUEE ──────────────────────────────────── */}
        {home?.brands?.length > 0 && (
          <BrandsSection brands={home.brands} />
        )}

        {/* ── FEATURED / RECOMMENDED ──────────────────────────── */}
        {home?.recommendedProducts?.length > 0 && (
          <ProductsSection
            title="Recommended For You"
            subtitle="Handpicked based on your preferences"
            icon={<TrendingUp size={22} />}
            products={home.recommendedProducts}
            viewAll="/products"
          />
        )}

        {/* ── ALL PRODUCTS ────────────────────────────────────── */}
        {home?.products?.length > 0 && (
          <ProductsSection
            title="New Arrivals"
            subtitle="Fresh styles added to the collection"
            icon={<Sparkles size={22} />}
            products={home.products}
            viewAll="/products"
          />
        )}

        {/* ── WHY NEPSTYLE ────────────────────────────────────── */}
        <WhySection />

        {/* ── CTA BANNER ──────────────────────────────────────── */}
        <CTABanner />

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Trust bar                                                       */
/* ─────────────────────────────────────────────────────────────── */
function TrustBar() {
  return (
    <div className="bg-white border-y border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PILLARS.map(({ icon: Icon, label, desc }, i) => (
          <div key={i} className={`flex items-center gap-3 p-2 animate-fade-up delay-${(i + 1) * 100}`}>
            <div className="w-10 h-10 bg-primary4 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary leading-tight">{label}</p>
              <p className="text-xs text-gray-400 leading-tight">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Categories section                                              */
/* ─────────────────────────────────────────────────────────────── */
function CategoriesSection({ categories }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal">
      <SectionHeader title="Shop by Category" subtitle="Explore our wide range of fashion categories" icon={<span>🗂️</span>} viewAll="/categories" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        {categories.slice(0, 10).map((cat, i) => (
          <Link
            key={cat.category_id}
            to={`/categories/${cat.category_id}`}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group relative overflow-hidden rounded-2xl h-36 sm:h-44 animate-scale-pop card-shine"
          >
            <img
              src={cat.category_thumbnail}
              alt={cat.category_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.src = `https://via.placeholder.com/200?text=${encodeURIComponent(cat.category_name)}`; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-white font-bold text-sm leading-tight">{cat.category_name}</p>
              <p className="text-white/60 text-xs mt-0.5 flex items-center gap-0.5">
                Shop <ChevronRight size={11} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Flash sale section                                              */
/* ─────────────────────────────────────────────────────────────── */
function FlashSaleSection({ products, countdown, navigate }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary1 rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden">
        {/* bg circles */}
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-24 -bottom-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={22} className="text-yellow-400" />
              <span className="text-white font-black text-2xl">Flash Sale</span>
              <span className="animate-pulse-glow bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ml-1">LIVE</span>
            </div>
            <p className="text-primary3 text-sm">Massive discounts — limited stock remaining!</p>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-2">
            <span className="text-primary3 text-xs font-semibold">Ends in</span>
            <Digit value={countdown.h} />
            <span className="text-white font-bold text-lg">:</span>
            <Digit value={countdown.m} />
            <span className="text-white font-bold text-lg">:</span>
            <Digit value={countdown.s} />
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 10).map((p, i) => (
          <FlashCard key={p.flash_sale_id ?? p.product_id} product={p} index={i}
            onClick={() => navigate('/product', { state: { product: p } })} />
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link to="/products" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:text-primary2 transition-colors">
          View all deals <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function FlashCard({ product, index, onClick }) {
  const discount = product.discount_percentage
    ? Math.round(product.discount_percentage)
    : product.normal_price > product.sell_price
      ? Math.round(((product.normal_price - product.sell_price) / product.normal_price) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 70}ms` }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group animate-fade-up card-shine"
    >
      <div className="relative overflow-hidden">
        <img
          src={product.product_thumbnail}
          alt={product.product_name}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-400"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image'; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-md">
            -{discount}%
          </span>
        )}
        <div className="absolute top-2 right-2 bg-yellow-400 text-primary text-xs font-bold px-1.5 py-0.5 rounded-md">
          <Zap size={10} className="inline" /> SALE
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-primary line-clamp-2 leading-tight">{product.product_name}</p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-moneyColor font-black text-base">Rs.{Number(product.sell_price).toFixed(0)}</span>
          {discount > 0 && (
            <span className="text-gray-400 line-through text-xs">Rs.{Number(product.normal_price).toFixed(0)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Brands marquee                                                  */
/* ─────────────────────────────────────────────────────────────── */
function BrandsSection({ brands }) {
  const ref = useReveal();
  // Duplicate for infinite scroll effect
  const doubled = [...brands, ...brands];
  return (
    <section ref={ref} className="reveal">
      <SectionHeader title="Top Brands" subtitle="Authentic products from brands you love" icon={<span>🏷️</span>} viewAll="/brands" />
      <div className="mt-6 overflow-hidden relative">
        {/* fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-appBg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-appBg to-transparent z-10 pointer-events-none" />
        <div className="marquee-track gap-4">
          {doubled.map((b, i) => (
            <Link
              key={i}
              to={`/brands/${b.brand_id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 bg-white hover:bg-primary4 rounded-2xl px-5 py-4 w-28 shadow-sm hover:shadow-md transition-all duration-200 mx-2 hover:-translate-y-0.5"
            >
              <img
                src={b.brand_thumbnail}
                alt={b.brand_name}
                className="w-12 h-12 object-contain"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=B'; }}
              />
              <span className="text-xs font-bold text-primary text-center leading-tight">{b.brand_name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Generic products section                                        */
/* ─────────────────────────────────────────────────────────────── */
function ProductsSection({ title, subtitle, icon, products, viewAll }) {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal">
      <SectionHeader title={title} subtitle={subtitle} icon={icon} viewAll={viewAll} />
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((p, i) => (
          <div key={p.product_id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {viewAll && (
        <div className="mt-6 text-center">
          <Link
            to={viewAll}
            className="inline-flex items-center gap-2 border-2 border-primary text-primary font-bold px-8 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all duration-200"
          >
            View All Products <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* AI Personalised "Picked For You" section                        */
/* ─────────────────────────────────────────────────────────────── */
function PersonalisedSection({ products, navigate }) {
  const ref      = useReveal();
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="reveal">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-primary rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              Picked For You
              <span className="text-xs bg-gradient-to-r from-amber-400 to-primary text-white font-bold px-2 py-0.5 rounded-full">⚡ AI</span>
            </h2>
            <p className="text-sm text-gray-400">Personalised based on your browsing history</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 bg-primary4 text-primary rounded-full flex items-center justify-center hover:bg-primary3 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 bg-primary4 text-primary rounded-full flex items-center justify-center hover:bg-primary3 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p, i) => {
          const pid       = p?.product_id ?? p?.productId;
          const name      = p?.product_name ?? p?.productName ?? 'Product';
          const thumb     = p?.product_thumbnail ?? p?.productThumbnail;
          const sellPrice = p?.sell_price ?? p?.sellPrice ?? 0;
          const normPrice = p?.normal_price ?? p?.normalPrice ?? 0;
          const brand     = p?.brand_name ?? p?.brandName ?? '';
          const discount  = normPrice > sellPrice
            ? Math.round(((normPrice - sellPrice) / normPrice) * 100)
            : 0;

          return (
            <div
              key={pid ?? i}
              onClick={() => navigate('/product', { state: { product: p } })}
              style={{ animationDelay: `${i * 50}ms` }}
              className="group flex-none w-44 sm:w-52 snap-start cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 animate-fade-up"
            >
              <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-50">
                <img
                  src={thumb}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
              <div className="p-3">
                {brand && <p className="text-xs text-primary1 font-medium mb-0.5 truncate">{brand}</p>}
                <p className="text-sm font-semibold text-primary leading-tight line-clamp-2 mb-1">{name}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-moneyColor">Rs.{Number(sellPrice).toFixed(0)}</span>
                  {discount > 0 && (
                    <span className="text-xs text-gray-400 line-through">Rs.{Number(normPrice).toFixed(0)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Why NepStyle                                                    */
/* ─────────────────────────────────────────────────────────────── */
const WHY_ITEMS = [
  { emoji: '🌏', title: 'Global Brands',       desc: 'Access to 10+ internationally recognized fashion brands all in one place.' },
  { emoji: '✅', title: '100% Authentic',      desc: 'Every product is sourced directly. No fakes, no compromise on quality.' },
  { emoji: '🚀', title: 'Lightning Delivery',  desc: 'Order today, receive in 2–5 business days anywhere across Nepal.' },
  { emoji: '🔒', title: 'Secure Payments',     desc: 'Pay with eSewa, Khalti or Cash on Delivery — fully safe and encrypted.' },
  { emoji: '🎁', title: 'Exclusive Deals',     desc: 'Flash sales, seasonal offers and member-only discounts every week.' },
  { emoji: '💬', title: '24/7 Support',        desc: 'Our dedicated support team is always here to help you shop happily.' },
];

function WhySection() {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal">
      <SectionHeader
        title="Why Shop With NepStyle?"
        subtitle="We make fashion accessible, authentic and enjoyable"
        icon={<span>💫</span>}
      />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WHY_ITEMS.map((item, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 80}ms` }}
            className="bg-white rounded-2xl p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group animate-fade-up"
          >
            <div className="w-12 h-12 bg-primary4 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {item.emoji}
            </div>
            <div>
              <h4 className="font-bold text-primary text-sm mb-1">{item.title}</h4>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* CTA banner                                                      */
/* ─────────────────────────────────────────────────────────────── */
function CTABanner() {
  const ref = useReveal();
  return (
    <section ref={ref} className="reveal">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary1 rounded-3xl p-8 sm:p-12 text-center">
        {/* Decorative circles */}
        <div className="absolute -left-10 -top-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute left-1/2 -top-16 w-36 h-36 rounded-full bg-primary3/20" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            <Sparkles size={12} /> Members Save More
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Start Your Style Journey Today
          </h2>
          <p className="text-primary3 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Join thousands of fashion-forward Nepalis who shop smarter with NepStyle. Create an account and unlock exclusive member deals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-2xl hover:bg-primary4 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-2xl border border-white/30 hover:bg-white/25 transition-all duration-200 text-sm"
            >
              Browse Without Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Shared section header                                           */
/* ─────────────────────────────────────────────────────────────── */
function SectionHeader({ title, subtitle, icon, viewAll }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary4 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-lg">{icon}</span>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-primary leading-tight">{title}</h2>
          {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {viewAll && (
        <Link
          to={viewAll}
          className="flex-shrink-0 flex items-center gap-1 text-sm text-primary2 font-semibold hover:text-primary transition-colors mt-1"
        >
          View All <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Loading skeleton                                                */
/* ─────────────────────────────────────────────────────────────── */
function HomePageSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="skeleton h-[88vh] max-h-[760px] min-h-[520px] w-full" />
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
        <div className="skeleton h-40 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
