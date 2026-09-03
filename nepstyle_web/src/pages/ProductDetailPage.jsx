import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ArrowLeft, Plus, Minus, Check } from 'lucide-react';
import { fetchReviews, addReview, logActivity } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItems } = useWishlist();

  const product = state?.product;
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(state?.openBuyNow === true);
  const [quantity, setQuantity] = useState(1);

  const id = product?.product_id ?? product?.productId;
  const name = product?.product_name ?? product?.productName;
  const thumbnail = product?.product_thumbnail ?? product?.productThumbnail;
  const description = product?.product_description ?? product?.productDescription;
  const sellPrice = product?.sell_price ?? product?.sellPrice;
  const normalPrice = product?.normal_price ?? product?.normalPrice;
  const brand = product?.brand_name ?? product?.brandName ?? '';
  const category = product?.category_name ?? product?.categoryName ?? '';
  const stock = product?.total_product_count ?? product?.totalProductCount ?? 99;

  const discount = normalPrice > sellPrice ? Math.round(((normalPrice - sellPrice) / normalPrice) * 100) : 0;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const inWish = isInWishlist(id);
  const wishItem = wishlistItems.find((w) => w.product_id === id);

  useEffect(() => {
    if (!product) { navigate('/'); return; }
    loadReviews();
    if (user) logActivity({ user_id: user.user_id, product_id: id, action_type: 'view' }).catch(() => {});
  }, [id]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetchReviews(id);
      setReviews(res.data.data || []);
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to write a review'); return; }
    if (!comment.trim()) { toast.error('Please enter a comment'); return; }
    setSubmitting(true);
    try {
      const res = await addReview({ product_id: id, user_id: user.user_id, user_name: user.fullname, comment, rating });
      if (res.data.status) {
        toast.success('Review submitted!');
        setComment(''); setRating(5);
        loadReviews();
      }
    } catch { toast.error('Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const handleBuyNow = () => {
    setShowBuyModal(true);
  };

  const confirmBuyNow = () => {
    setShowBuyModal(false);
    navigate('/checkout', { state: { product, quantity, totalAmount: sellPrice * quantity, isBuyNow: true } });
  };

  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-4 hover:text-primary transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <img src={thumbnail} alt={name}
            className="w-full h-80 object-cover"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
          {discount > 0 && (
            <div className="bg-red-500 text-white text-center py-1.5 text-sm font-bold">
              {discount}% OFF — Limited Offer!
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-primary">{name}</h1>
              <button
                onClick={() => inWish ? removeFromWishlist(wishItem?.wishlist_id) : addToWishlist(product)}
                className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:scale-110 transition-transform flex-shrink-0"
              >
                <Heart size={20} className={inWish ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {brand && <span className="text-xs bg-primary4 text-primary1 px-2 py-0.5 rounded-full font-medium">{brand}</span>}
              {category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{category}</span>}
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={Number(avgRating)} size={18} />
              <span className="font-semibold text-primary">{avgRating}</span>
              <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-moneyColor">Rs.{sellPrice?.toFixed(2)}</span>
            {discount > 0 && <span className="text-gray-400 line-through text-lg">Rs.{normalPrice?.toFixed(2)}</span>}
            {discount > 0 && <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-lg">{discount}% off</span>}
          </div>

          <div className="bg-primary4/50 rounded-xl p-4">
            <p className="text-sm text-primary1 font-medium mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">{stock > 0 ? `In Stock (${stock} available)` : 'Out of Stock'}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                const result = await addToCart(product);
                if (result === 'guest') setShowBuyModal(true);
              }}
              disabled={stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary1 transition-colors disabled:opacity-50"
            >
              <ShoppingCart size={18} /> {user ? 'Add to Cart' : 'Buy Now'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary4 text-primary py-3 rounded-xl font-semibold hover:bg-primary3 transition-colors disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-primary mb-6">Reviews</h2>

        {/* Write Review */}
        <form onSubmit={handleSubmitReview} className="border border-gray-100 rounded-xl p-5 mb-8 bg-appBg">
          <h3 className="font-semibold text-primary mb-4">Write a Review</h3>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star size={28} className={s <= rating ? 'text-starColor fill-starColor' : 'text-gray-300'} />
                </button>
              ))}
              <span className="ml-2 text-gray-500 text-sm self-center">({rating}/5)</span>
            </div>
          </div>
          <textarea
            className="input-field resize-none h-24"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" disabled={submitting} className="btn-primary mt-3 px-6 py-2 rounded-xl">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>

        {/* Reviews List */}
        {reviewsLoading ? <LoadingSpinner /> : reviews.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">{avgRating}</span>
              <div>
                <StarRating rating={Number(avgRating)} size={20} />
                <p className="text-sm text-gray-500">{reviews.length} total reviews</p>
              </div>
            </div>
            {reviews.map((r, i) => (
              <div key={i} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-full bg-primary2/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary2 font-bold">{r.user_name?.[0]?.toUpperCase() || 'G'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-primary text-sm">{r.user_name}</span>
                    <StarRating rating={r.rating} size={14} />
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy Now Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-primary text-lg mb-4">Confirm Purchase</h3>
            <div className="flex gap-3 mb-4">
              <img src={thumbnail} className="w-16 h-16 rounded-lg object-cover" alt={name} />
              <div>
                <p className="font-semibold text-primary text-sm">{name}</p>
                <p className="text-moneyColor font-bold">Rs.{sellPrice?.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 bg-appBg rounded-xl p-3">
              <span className="font-medium text-primary">Quantity</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                  <Minus size={14} className="text-primary" />
                </button>
                <span className="text-lg font-bold text-primary w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                  <Plus size={14} className="text-primary" />
                </button>
              </div>
            </div>
            <div className="flex justify-between mb-5">
              <span className="font-bold text-primary">Total:</span>
              <span className="text-moneyColor font-bold text-lg">Rs.{(sellPrice * quantity).toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)} className="flex-1 border-2 border-primary text-primary py-3 rounded-xl font-semibold hover:bg-primary4">Cancel</button>
              <button onClick={confirmBuyNow} className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary1 flex items-center justify-center gap-2">
                <Check size={18} /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
