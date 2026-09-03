import { createContext, useContext, useState, useCallback } from 'react';
import { fetchCart, addToCart as apiAddToCart, logActivity } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetchCart(user.user_id);
      setCartItems(res.data.cart_items || []);
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (product) => {
    if (!user) {
      // Signal to the caller that the user is not logged in; caller handles UX
      return 'guest';
    }
    try {
      const discount = product.normalPrice > product.sellPrice
        ? ((product.normalPrice - product.sellPrice) / product.normalPrice * 100).toFixed(0)
        : 0;
      await apiAddToCart({
        user_id: user.user_id,
        product_id: product.productId || product.product_id,
        product_name: product.productName || product.product_name,
        product_thumbnail: product.productThumbnail || product.product_thumbnail,
        product_description: product.productDescription || product.product_description,
        normal_price: product.normalPrice || product.normal_price,
        sell_price: product.sellPrice || product.sell_price,
        discount_percentage: Number(discount),
        discounted_price: (product.normalPrice || product.normal_price) - (product.sellPrice || product.sell_price),
        quantity: 1,
      });
      toast.success('Added to cart!');
      await loadCart();
      logActivity({ user_id: user.user_id, product_id: product.productId || product.product_id, action_type: 'cart' }).catch(() => {});
      return true;
    } catch {
      toast.error('Failed to add to cart');
      return false;
    }
  };

  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, cartTotal, loading, loadCart, addToCart, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
