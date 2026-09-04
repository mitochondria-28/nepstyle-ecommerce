import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CartRecommendations from '../components/CartRecommendations';

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, loading, loadCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  useEffect(() => {
    if (cartItems.length > 0) {
      setSelected(cartItems.map((i) => i.cart_id));
      setSelectAll(true);
    }
  }, [cartItems]);

  const toggleSelect = (id) => setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const toggleAll = () => {
    if (selectAll) { setSelected([]); setSelectAll(false); }
    else { setSelected(cartItems.map((i) => i.cart_id)); setSelectAll(true); }
  };

  const selectedItems = cartItems.filter((i) => selected.includes(i.cart_id));
  const selectedTotal = selectedItems.reduce((s, i) => s + i.sell_price * i.quantity, 0);
  const selectedProductIds = selectedItems.map((i) => i.product_id);

  const handleCheckout = () => {
    if (selected.length === 0) return;
    navigate('/checkout', {
      state: {
        selectedProductIds,
        isSelectAll: selectAll,
        totalAmount: selectedTotal.toFixed(2),
        cartItems: selectedItems,
      }
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShoppingBag size={64} className="text-primary3" />
        <h2 className="text-xl font-bold text-primary">Your Cart is Empty</h2>
        <p className="text-gray-400">Please login to view your cart</p>
        <button onClick={() => navigate('/login')} className="btn-primary px-6 py-2.5 rounded-xl">Login</button>
      </div>
    );
  }

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">My Cart</h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-white rounded-2xl shadow-sm py-16">
          <ShoppingBag size={80} className="text-primary3" />
          <h2 className="text-xl font-semibold text-primary">Your cart is empty</h2>
          <p className="text-gray-400">Add some products to get started!</p>
          <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 rounded-xl">Shop Now</button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <input type="checkbox" checked={selectAll} onChange={toggleAll}
                className="w-5 h-5 accent-primary cursor-pointer" />
              <span className="text-sm font-medium text-primary">Select All ({cartItems.length} items)</span>
            </div>

            {cartItems.map((item) => (
              <CartItem key={item.cart_id} item={item}
                selected={selected.includes(item.cart_id)}
                onToggle={() => toggleSelect(item.cart_id)}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
              <h3 className="font-bold text-primary text-lg mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Selected Items</span>
                  <span className="font-medium">{selected.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">Rs.{selectedTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-bold text-primary">Total</span>
                  <span className="font-bold text-moneyColor text-lg">Rs.{selectedTotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={selected.length === 0}
                className="w-full btn-primary py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout ({selected.length})
              </button>
            </div>
          </div>
        </div>
        {/* AI Cart Recommendations */}
        <CartRecommendations cartItems={cartItems} />
        </>
      )}
    </div>
  );
}

function CartItem({ item, selected, onToggle }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 flex gap-3 items-center border-2 transition-colors ${selected ? 'border-primary4' : 'border-transparent'}`}>
      <input type="checkbox" checked={selected} onChange={onToggle}
        className="w-5 h-5 accent-primary cursor-pointer flex-shrink-0" />
      <img src={item.product_thumbnail} alt={item.product_name}
        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=N'; }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-primary text-sm line-clamp-2">{item.product_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-moneyColor font-bold text-sm">Rs.{item.sell_price}</span>
          <span className="text-gray-400 text-xs">× {item.quantity}</span>
        </div>
        <p className="text-primary font-bold text-sm mt-0.5">Total: Rs.{(item.sell_price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
}
