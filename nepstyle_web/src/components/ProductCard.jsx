import { Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  const id = product.product_id ?? product.productId;
  const name = product.product_name ?? product.productName;
  const thumbnail = product.product_thumbnail ?? product.productThumbnail;
  const sellPrice = product.sell_price ?? product.sellPrice;
  const normalPrice = product.normal_price ?? product.normalPrice;
  const brand = product.brand_name ?? product.brandName ?? '';

  const discount = normalPrice > sellPrice
    ? Math.round(((normalPrice - sellPrice) / normalPrice) * 100)
    : 0;

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => navigate('/product', { state: { product } })}
    >
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={name}
          className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        <button
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          onClick={(e) => { e.stopPropagation(); addToWishlist(product); }}
        >
          <Heart
            size={16}
            className={isInWishlist(id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}
          />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-primary2 mb-0.5">{brand}</p>
        <p className="text-sm font-semibold text-primary line-clamp-2 leading-tight">{name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-moneyColor font-bold text-sm">Rs.{sellPrice?.toFixed(2)}</span>
          {discount > 0 && (
            <span className="text-gray-400 line-through text-xs">Rs.{normalPrice?.toFixed(2)}</span>
          )}
        </div>
        <button
          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary1 transition-colors"
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
