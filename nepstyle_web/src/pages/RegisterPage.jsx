import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { register as apiRegister } from '../api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullname: '', email_address: '', contact_number: '', password: '', confirm_password: '', otp: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullname || !form.email_address || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRegister({
        fullname: form.fullname,
        email_address: form.email_address,
        contact_number: form.contact_number,
        password: form.password,
        otp: form.otp || '000000',
      });
      if (res.data.status) {
        toast.success('Account created successfully!');
        navigate('/login');
      } else {
        toast.error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon: Icon, label, name, type = 'text', placeholder, required }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {name === 'password' || name === 'confirm_password' ? (
          <>
            <input
              type={showPass ? 'text' : 'password'}
              className="input-field pl-10 pr-10"
              placeholder={placeholder}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            />
            {name === 'password' && (
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </>
        ) : (
          <input
            type={type}
            className="input-field pl-10"
            placeholder={placeholder}
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-appBg px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Create Account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join NepStyle today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field icon={User} label="Full Name" name="fullname" placeholder="John Doe" required />
          <Field icon={Mail} label="Email Address" name="email_address" type="email" placeholder="you@example.com" required />
          <Field icon={Phone} label="Contact Number" name="contact_number" placeholder="+977 98XXXXXXXX" />
          <Field icon={Lock} label="Password" name="password" placeholder="Create a password" required />
          <Field icon={Lock} label="Confirm Password" name="confirm_password" placeholder="Re-enter password" required />

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl text-base">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
