import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, XCircle, Loader2 } from 'lucide-react';
import { verifyEsewaPayment } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EsewaReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      setStatus('failed');
      setMessage('Invalid payment return. Order ID missing.');
      return;
    }

    verifyEsewaPayment({ order_id: parseInt(orderId, 10) })
      .then((res) => {
        if (res.data.status && res.data.payment_status === 'SUCCESS') {
          setStatus('success');
          setMessage('Your payment was successful and your order has been confirmed.');
        } else {
          setStatus('failed');
          const ps = res.data.payment_status ?? 'UNKNOWN';
          const msgs = {
            FAILED:    'Payment failed. Please try again.',
            CANCELED:  'You cancelled the payment. Your order has not been placed.',
            PENDING:   'Payment is still pending. Please check back shortly.',
            REVERTED:  'Payment was refunded. Please contact support.',
            UNKNOWN:   'Could not verify payment status. Please contact support.',
          };
          setMessage(msgs[ps] ?? `Payment status: ${ps}`);
        }
      })
      .catch(() => {
        setStatus('failed');
        setMessage('Could not verify payment. Please contact support with your order details.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={48} className="text-primary animate-spin" />
        <p className="text-primary font-semibold text-lg">Verifying your payment...</p>
        <p className="text-gray-400 text-sm">Please wait, do not close this page.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={48} className="text-green-500" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-8">{message}</p>

        {/* eSewa branding */}
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

  // failed / cancelled
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle size={48} className="text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-primary mb-2">Payment Not Completed</h2>
      <p className="text-gray-500 mb-8">{message}</p>

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
