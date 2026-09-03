import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

function CarouselCard({ product, score }) {
  const navigate = useNavigate();
  const p = product?.product ?? product;

  const name      = p?.product_name ?? p?.productName ?? 'Product';
  const thumbnail = p?.product_thumbnail ?? p?.productThumbnail;
  const sellPrice = p?.sell_price ?? p?.sellPrice ?? 0;
  const normalPrice = p?.normal_price ?? p?.normalPrice ?? 0;
  const brand     = p?.brand_name ?? p?.brandName ?? '';
  const discount  = normalPrice > sellPrice
    ? Math.round(((normalPrice - sellPrice) / normalPrice) * 100)
    : 0;

  return (
    <div
      onClick={() => navigate('/product', { state: { product: p } })}
      className="group flex-none w-44 sm:w-52 cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden bg-gray-50">
        <img
          src={thumbnail}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {score > 0.7 && (
          <span className="absolute top-2 right-2 bg-amber-400/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            ⚡ Match
          </span>
        )}
      </div>
      <div className="p-3">
        {brand && (
          <p className="text-xs text-primary1 font-medium mb-0.5 truncate">{brand}</p>
        )}
        <p className="text-sm font-semibold text-primary leading-tight line-clamp-2 mb-1">{name}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-moneyColor">Rs.{Number(sellPrice).toFixed(0)}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">Rs.{Number(normalPrice).toFixed(0)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimilarProductsCarousel({ products = [] }) {
  const scrollRef = useRef(null);

  if (!products.length) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-primary rounded-xl flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">You May Also Like</h2>
            <p className="text-xs text-gray-400">AI-powered recommendations</p>
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

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((item, i) => (
          <div key={i} className="snap-start">
            <CarouselCard product={item} score={item?.score ?? 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
