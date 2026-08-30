import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Zap, Tag } from 'lucide-react';
import { fetchHome } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner, { SkeletonCard } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const BANNERS = [
  { bg: 'from-primary to-primary1', title: 'New Arrivals', sub: 'Discover the latest fashion trends', tag: 'Shop Now' },
  { bg: 'from-primary2 to-primary', title: 'Flash Sale', sub: 'Up to 50% off on selected items', tag: 'Grab Now' },
  { bg: 'from-primary1 to-primary2', title: 'Top Brands', sub: 'Authentic products from top brands', tag: 'Explore' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { loadCart } = useCart();
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    loadData();
    if (user) loadCart();
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchHome(user?.user_id || 0);
      setHome(res.data);
    } catch {
      toast.error('Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="skeleton h-56 rounded-2xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const banner = BANNERS[bannerIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      {/* Hero Banner */}
      <div className={`relative bg-gradient-to-r ${banner.bg} rounded-2xl p-8 text-white overflow-hidden min-h-[220px] flex items-center`}>
        <div className="relative z-10">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block">✨ Featured</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2">{banner.title}</h2>
          <p className="text-white/80 text-sm mb-4">{banner.sub}</p>
          <Link to="/products" className="bg-white text-primary font-bold px-5 py-2 rounded-xl text-sm hover:bg-primary4 transition-colors">
            {banner.tag} →
          </Link>
        </div>
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 translate-y-16" />
        <div className="absolute right-16 top-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8" />
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'bg-white w-5' : 'bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Recommended For You */}
      {home?.recommendedProducts?.length > 0 && (
        <Section title="Recommended For You" icon={<Tag size={20} />}>
          <ProductGrid products={home.recommendedProducts} />
        </Section>
      )}

      {/* Flash Sale */}
      {home?.flashSaleProducts?.length > 0 && (
        <div>
          <div className="flash-sale-bg rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 text-white mb-1">
              <Zap size={20} className="text-yellow-400" />
              <h2 className="text-xl font-bold">Flash Sale</h2>
            </div>
            <p className="text-primary3 text-sm">Limited time offers — grab them before they're gone!</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {home.flashSaleProducts.map((p) => (
              <FlashCard key={p.product_id} product={p} onClick={() => navigate('/product', { state: { product: p } })} />
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {home?.brands?.length > 0 && (
        <Section title="Brands" icon={<span>🏷️</span>} viewAll="/brands">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {home.brands.map((b) => (
              <Link key={b.brand_id} to={`/brands/${b.brand_id}`}
                className="flex-shrink-0 flex flex-col items-center gap-2 bg-white rounded-xl p-4 w-28 shadow-sm hover:shadow-md transition-shadow">
                <img src={b.brand_thumbnail} alt={b.brand_name}
                  className="w-14 h-14 object-contain rounded-lg"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/56?text=B'; }} />
                <span className="text-xs font-semibold text-primary text-center line-clamp-2">{b.brand_name}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Curated Products */}
      {home?.products?.length > 0 && (
        <Section title="Curated For You" icon={<span>✨</span>} viewAll="/products">
          <ProductGrid products={home.products} />
        </Section>
      )}

      {/* Categories */}
      {home?.categories?.length > 0 && (
        <Section title="Shop By Categories" icon={<span>🗂️</span>} viewAll="/categories">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {home.categories.map((c) => (
              <Link key={c.category_id} to={`/categories/${c.category_id}`}
                className="relative overflow-hidden rounded-xl h-32 group">
                <img src={c.category_thumbnail} alt={c.category_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x128?text=' + c.category_name; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-3 text-white font-bold text-sm">{c.category_name}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, viewAll, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        {viewAll && (
          <Link to={viewAll} className="flex items-center gap-1 text-sm text-primary2 font-medium hover:text-primary transition-colors">
            View All <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.slice(0, 8).map((p) => <ProductCard key={p.product_id} product={p} />)}
    </div>
  );
}

function FlashCard({ product, onClick }) {
  const discount = product.normal_price > product.sell_price
    ? Math.round(((product.normal_price - product.sell_price) / product.normal_price) * 100)
    : 0;
  return (
    <div onClick={onClick} className="card cursor-pointer hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={product.product_thumbnail} alt={product.product_name}
          className="w-full h-40 object-cover"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=No+Image'; }} />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-primary line-clamp-2 text-xs">{product.product_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-moneyColor font-bold text-sm">Rs.{product.sell_price?.toFixed(0)}</span>
          {discount > 0 && <span className="text-gray-400 line-through text-xs">Rs.{product.normal_price?.toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}
