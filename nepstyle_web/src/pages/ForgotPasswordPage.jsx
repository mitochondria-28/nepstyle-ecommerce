import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { forgotPassword } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!email) { toast.error('Enter your email'); return; }
    setStep(2);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPassword) { toast.error('Enter new password'); return; }
    setLoading(true);
    try {
      const res = await forgotPassword({ email_address: email, new_password: newPassword });
      if (res.data.status) {
        toast.success('Password reset successfully!');
        navigate('/login');
      } else {
        toast.error(res.data.message || 'Failed to reset password');
      }
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-appBg px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Forgot Password</h2>
        <p className="text-gray-500 text-sm mb-6">
          {step === 1 ? 'Enter your email address to reset your password.' : 'Enter your new password.'}
        </p>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button onClick={handleNext} className="btn-primary w-full py-3 rounded-xl">Continue</button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="bg-primary4 px-4 py-2 rounded-lg text-sm text-primary1">{email}</div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                className="input-field pl-10"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-sm text-primary2 mt-4 hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}
