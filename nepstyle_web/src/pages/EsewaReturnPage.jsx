import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const REASON_MESSAGES = {
  canceled:  'You cancelled the payment. Your order has not been placed.',
  not_found: 'Payment not found. Please contact support.',
  mismatch:  'Payment verification failed. Please contact support.',
  error:     'An error occurred. Please contact support.',
  pending:   'Payment is still processing. Please check back shortly.',
  ambiguous: 'Payment status is unclear. Please contact support.',
};

export default function EsewaReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const payment = searchParams.get('payment'); // 'success' | 'failed'
  const orderId = searchParams.get('order_id');
  const reason  = searchParams.get('reason') ?? 'error';

  const isSuccess = payment === 'success';

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-green-500" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6">
          Your eSewa payment was confirmed and your order has been placed.
        </p>

        <div className="flex items-center gap-2 mb-8 px-4 py-2 bg-green-50 rounded-xl">
          <img src="/images/esewa.png" alt="eSewa" className="w-8 h-8 object-contain" />
          <span className="text-sm text-green-700 font-medium">Paid via eSewa</span>
        </div>

        <div className="flex gap-3 w-full">
          {user ? (
            <>
              <button onClick={() => navigate('/orders')} className="flex-1 btn-primary py-3 rounded-xl">
                View Orders
              </button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary py-3 rounded-xl">
                Continue Shopping
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/register')} className="flex-1 btn-primary py-3 rounded-xl">
                Create Account
              </button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary py-3 rounded-xl">
                Continue Shopping
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const failureMessage =
    REASON_MESSAGES[reason] ?? 'Payment was not completed. Please try again.';

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle size={48} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-primary mb-2">Payment Not Completed</h2>
      <p className="text-gray-500 mb-8">{failureMessage}</p>

      {orderId && (
        <p className="text-xs text-gray-400 mb-6">Order #{orderId} — contact support if amount was deducted.</p>
      )}

      <div className="flex gap-3 w-full">
        <button onClick={() => navigate('/')} className="flex-1 btn-primary py-3 rounded-xl">
          Back to Home
        </button>
        <button onClick={() => navigate(-2)} className="flex-1 btn-secondary py-3 rounded-xl">
          Try Again
        </button>
      </div>
    </div>
  );
}
