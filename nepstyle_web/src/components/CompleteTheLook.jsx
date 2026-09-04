import { useEffect, useState } from 'react';
import { Wand2, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCompleteLook } from '../api/aiApi';
import toast from 'react-hot-toast';

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
          <div className="h-44 bg-gray-100" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-7 bg-gray-100 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LookCard({ product, onAddCart, onView }) {
  const discount = product.normal_price > product.sell_price
    ? Math.round((1 - product.sell_price / product.normal_price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all group">
      {/* Image */}
      <div className="relative h-44 bg-gray-50 overflow-hidden cursor-pointer" onClick={onView}>
        {product.product_thumbnail || product.image_url
          ? <img
              src={product.product_thumbnail || product.image_url}
              alt={product.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          : <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart size={28} className="text-gray-200" />
            </div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-lg">
            -{discount}%
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium text-gray-500 truncate">{product.brand_name || product.category_name}</p>
        <p className="text-sm font-semibold text-primary leading-snug line-clamp-2 mt-0.5">{product.product_name}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-bold text-moneyColor text-sm">Rs.{product.sell_price?.toLocaleString()}</span>
          {discount > 0 && (
            <span className="text-gray-400 line-through text-xs">Rs.{product.normal_price?.toLocaleString()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={onAddCart}
            className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-primary1 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            <ShoppingCart size={12} /> Add
          </button>
          <button
            onClick={onView}
            className="flex items-center justify-center gap-1 border border-gray-200 hover:border-primary hover:text-primary text-gray-500 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Eye size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompleteTheLook({ product }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart }       = useCart();
  const { user }            = useAuth();
  const navigate            = useNavigate();

  useEffect(() => {
    if (!product?.product_id) { setLoading(false); return; }
    setLoading(true);
    setItems([]);
    getCompleteLook(product.product_id)
      .then(r => setItems(r.data.products || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [product?.product_id]);

  if (!loading && items.length === 0) return null;

  const handleAdd = async (p) => {
    const result = await addToCart(p);
    if (result === 'guest') toast.error('Please log in to add to cart');
  };

  const handleView = (p) => {
    navigate('/product', { state: { product: p } });
  };

  return (
    <section className="mt-10 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary2 flex items-center justify-center">
          <Wand2 size={15} className="text-white" />
        </div>
        <h2 className="font-bold text-primary text-xl">Complete the Look</h2>
        <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
          <Sparkles size={8} /> AI Styled
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-4 -mt-2">Curated by AI to pair perfectly with your selection</p>

      {loading ? <Skeleton /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(p => (
            <LookCard
              key={p.product_id}
              product={p}
              onAddCart={() => handleAdd(p)}
              onView={() => handleView(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
