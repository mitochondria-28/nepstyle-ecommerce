import { useEffect, useState, useRef } from 'react';
import { Sparkles, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getCartRecommendations } from '../api/aiApi';
import toast from 'react-hot-toast';

function Skeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
          <div className="h-36 bg-gray-100" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-gray-100 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            <div className="h-6 bg-gray-100 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecoCard({ product, onAdd, onView }) {
  const discount = product.normal_price > product.sell_price
    ? Math.round((1 - product.sell_price / product.normal_price) * 100)
    : 0;

  return (
    <div className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all group">
      <div className="relative h-36 bg-gray-50 overflow-hidden cursor-pointer" onClick={onView}>
        {product.product_thumbnail || product.image_url
          ? <img
              src={product.product_thumbnail || product.image_url}
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          : <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart size={24} className="text-gray-200" />
            </div>
        }
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[10px] text-gray-400 truncate">{product.brand_name || product.category_name}</p>
        <p className="text-xs font-semibold text-primary leading-snug line-clamp-2 mt-0.5">{product.product_name}</p>
        <p className="font-bold text-moneyColor text-xs mt-0.5">Rs.{product.sell_price?.toLocaleString()}</p>
        <button
          onClick={onAdd}
          className="w-full mt-2 flex items-center justify-center gap-1 bg-primary hover:bg-primary1 text-white text-[11px] font-semibold py-1.5 rounded-xl transition-colors"
        >
          <ShoppingCart size={11} /> Add
        </button>
      </div>
    </div>
  );
}

export default function CartRecommendations({ cartItems }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart }       = useCart();
  const navigate            = useNavigate();
  const scrollRef           = useRef(null);

  useEffect(() => {
    if (!cartItems?.length) { setLoading(false); return; }
    const names      = cartItems.map(i => i.product_name);
    const excludeIds = cartItems.map(i => i.product_id);
    setLoading(true);
    getCartRecommendations(names, excludeIds)
      .then(r => setItems(r.data.products || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [cartItems?.length]);  // re-run only when cart size changes

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 170, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  const handleAdd = async (p) => {
    const result = await addToCart(p);
    if (result === 'guest') toast.error('Please log in to add to cart');
  };

  return (
    <section className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary2 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-primary text-base">You Might Also Need</h3>
            <p className="text-[11px] text-gray-400">AI picks to complete your order</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="w-7 h-7 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary4 flex items-center justify-center transition-colors">
            <ChevronLeft size={14} className="text-gray-600" />
          </button>
          <button onClick={() => scroll(1)} className="w-7 h-7 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary4 flex items-center justify-center transition-colors">
            <ChevronRight size={14} className="text-gray-600" />
          </button>
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        >
          {items.map(p => (
            <RecoCard
              key={p.product_id}
              product={p}
              onAdd={() => handleAdd(p)}
              onView={() => navigate('/product', { state: { product: p } })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
