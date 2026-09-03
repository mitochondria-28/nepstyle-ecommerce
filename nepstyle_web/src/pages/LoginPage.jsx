import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Star, Users, Package, Sparkles } from 'lucide-react';
import { login as apiLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── Brand panel data ─────────────────────────────────────────── */
const STATS = [
  { icon: Users,   value: '10k+', label: 'Happy Customers' },
  { icon: Star,    value: '4.8',  label: 'Average Rating'  },
  { icon: Package, value: '500+', label: 'Products'        },
];

const PREVIEW_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80', label: 'New Season',   pos: 'top-16 left-8'   },
  { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=80', label: 'Trending Now',  pos: 'top-36 right-6'  },
  { src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&q=80', label: 'Top Brands',   pos: 'bottom-32 left-12' },
];

/* ── Reusable input ───────────────────────────────────────────── */
function AuthInput({ icon: Icon, label, type = 'text', value, onChange, placeholder, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-gray-50 ${focused ? 'border-primary shadow-[0_0_0_4px_rgba(39,48,51,0.08)]' : 'border-gray-200 hover:border-gray-300'}`}>
        <Icon size={17} className={`absolute left-4 flex-shrink-0 transition-colors duration-200 ${focused ? 'text-primary' : 'text-gray-400'}`} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-primary placeholder-gray-400 focus:outline-none rounded-2xl"
        />
        {right}
      </div>
    </div>
  );
}

/* ── Left brand panel ─────────────────────────────────────────── */
function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary via-[#2e3d44] to-primary1 p-10 xl:p-14">

      {/* Ambient blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary3/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary2/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/3 blur-2xl" />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-white text-xl font-black tracking-tight">
            Nep<span className="text-primary3">Style</span>
          </span>
        </div>
        <p className="text-primary3/80 text-xs font-medium">Nepal's Premium Fashion Store</p>
      </div>

      {/* Floating preview cards */}
      <div className="relative z-10 flex-1 my-8">
        {PREVIEW_IMAGES.map((img, i) => (
          <div
            key={i}
            className={`absolute ${img.pos} w-32 xl:w-36`}
            style={{ animation: `float ${3 + i * 0.7}s ease-in-out ${i * 0.4}s infinite` }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
              <img src={img.src} alt={img.label} className="w-full h-24 xl:h-28 object-cover" />
              <div className="px-3 py-2">
                <p className="text-white text-xs font-semibold">{img.label}</p>
                <p className="text-primary3/70 text-xs">Shop now →</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="text-white text-3xl xl:text-4xl font-black leading-tight">
            Your Style,<br />
            <span className="text-primary3">Your Story.</span>
          </h2>
          <p className="text-primary3/70 text-sm mt-2 leading-relaxed">
            Authentic branded fashion delivered across Nepal.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <Icon size={16} className="text-primary3 mx-auto mb-1" />
              <p className="text-white font-black text-lg leading-none">{value}</p>
              <p className="text-primary3/60 text-xs mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [form, setForm]       = useState({ email_address: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email_address || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin(form);
      if (res.data.status) {
        login(res.data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left: Brand panel ──────────────────────────────── */}
      <BrandPanel />

      {/* ── Right: Form panel ──────────────────────────────── */}
      <div className="flex flex-col min-h-screen bg-white">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center gap-2 py-6 px-6 bg-primary">
          <Sparkles size={18} className="text-primary3" />
          <span className="text-white text-lg font-black">Nep<span className="text-primary3">Style</span></span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-primary tracking-tight">Welcome back</h1>
              <p className="text-gray-400 text-sm mt-1.5">Sign in to your NepStyle account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                icon={Mail}
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email_address}
                onChange={set('email_address')}
              />

              <AuthInput
                icon={Lock}
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={set('password')}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              {/* Forgot password */}
              <div className="flex justify-end -mt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary2 hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary1 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">New to NepStyle?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Register CTA */}
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary text-primary font-bold py-3.5 rounded-2xl transition-all duration-200 hover:bg-primary4/40 text-sm"
            >
              Create a Free Account <ArrowRight size={15} />
            </Link>

            {/* Trust line */}
            <p className="text-center text-xs text-gray-400 mt-6">
              🔒 Secure login · Your data is protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
