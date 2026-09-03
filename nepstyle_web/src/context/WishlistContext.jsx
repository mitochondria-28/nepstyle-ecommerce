import { createContext, useContext, useState, useCallback } from 'react';
import { fetchWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemove, logActivity } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWishlist(user.user_id);
      setWishlistItems(res.data.wishlist_items || []);
    } catch {
      setWishlistItems([]);
    }
  }, [user]);

  const addToWishlist = async (product) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const discount = product.normalPrice > product.sellPrice
        ? ((product.normalPrice - product.sellPrice) / product.normalPrice * 100).toFixed(0)
        : 0;
      await apiAddToWishlist({
        user_id: user.user_id,
        product_id: product.productId || product.product_id,
        product_name: product.productName || product.product_name,
        product_thumbnail: product.productThumbnail || product.product_thumbnail,
        product_description: product.productDescription || product.product_description,
        normal_price: product.normalPrice || product.normal_price,
        sell_price: product.sellPrice || product.sell_price,
        discount_percentage: Number(discount),
        discounted_price: (product.normalPrice || product.normal_price) - (product.sellPrice || product.sell_price),
      });
      toast.success('Added to wishlist!');
      await loadWishlist();
      logActivity({ user_id: user.user_id, product_id: product.productId || product.product_id, action_type: 'wishlist' }).catch(() => {});
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      await apiRemove(wishlistId);
      toast.success('Removed from wishlist');
      await loadWishlist();
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => item.product_id === productId);

  return (
    <WishlistContext.Provider value={{ wishlistItems, loadWishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
