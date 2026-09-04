import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import WishlistInsights from '../components/WishlistInsights';

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, loadWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) loadWishlist();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Heart size={64} className="text-primary3" />
        <h2 className="text-xl font-bold text-primary">Your Wishlist is Empty</h2>
        <p className="text-gray-400">Please login to view your wishlist</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-6 py-2.5 rounded-xl">Login</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">My Wishlist</h1>

      {/* AI Wishlist Insights */}
      {wishlistItems.length > 0 && <WishlistInsights items={wishlistItems} />}

      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-white rounded-2xl shadow-sm py-16">
          <Heart size={80} className="text-primary3" />
          <h2 className="text-xl font-semibold text-primary">Your wishlist is empty</h2>
          <p className="text-gray-400">Save items you love here!</p>
          <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-xl">Explore Products</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlistItems.map((item) => (
            <div key={item.wishlist_id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
              <img
                src={item.product_thumbnail}
                alt={item.product_name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                onClick={() => navigate('/product', { state: { product: { ...item, productId: item.product_id, productName: item.product_name, productThumbnail: item.product_thumbnail, productDescription: item.product_description, normalPrice: item.normal_price, sellPrice: item.sell_price } } })}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=N'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm line-clamp-2 mb-1">{item.product_name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-moneyColor font-bold text-sm">Rs.{item.sell_price}</span>
                  {item.normal_price > item.sell_price && (
                    <span className="text-gray-400 line-through text-xs">Rs.{item.normal_price}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      addToCart({ productId: item.product_id, productName: item.product_name, productThumbnail: item.product_thumbnail, productDescription: item.product_description, normalPrice: item.normal_price, sellPrice: item.sell_price });
                    }}
                    className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary1"
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.wishlist_id)}
                    className="p-1.5 border border-red-200 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
