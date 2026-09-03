import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  ArrowRight, Check, Sparkles, Shield, Zap, Gift,
} from 'lucide-react';
import { register as apiRegister } from '../api';
import toast from 'react-hot-toast';

/* ── Password strength ────────────────────────────────────────── */
function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: 'Too short', color: 'bg-red-400'    },
    { label: 'Weak',      color: 'bg-orange-400' },
    { label: 'Fair',      color: 'bg-amber-400'  },
    { label: 'Good',      color: 'bg-blue-400'   },
    { label: 'Strong',    color: 'bg-green-500'  },
  ];
  return { score, ...map[score] };
}

/* ── Reusable input ───────────────────────────────────────────── */
function AuthInput({ icon: Icon, label, type = 'text', value, onChange, placeholder, right, check }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        {check && value.length > 0 && (
          <span className="text-green-500">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </div>
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
const PERKS = [
  { icon: Shield, title: 'Secure Account',    desc: 'Your data encrypted & safe' },
  { icon: Zap,    title: 'Instant Access',    desc: 'Browse 500+ products right away' },
  { icon: Gift,   title: 'Member Benefits',   desc: 'Exclusive deals & early access' },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary via-[#2e3d44] to-primary1 p-10 xl:p-14">

      {/* Ambient blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary3/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary2/10 blur-3xl" />

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

      {/* Hero visual */}
      <div className="relative z-10 flex-1 my-8 flex items-center justify-center">
        <div className="relative w-64 xl:w-72">
          {/* Main image */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20" style={{ animation: 'float 4s ease-in-out infinite' }}>
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80"
              alt="Fashion"
              className="w-full h-72 xl:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          {/* Floating badge top-left */}
          <div className="absolute -top-4 -left-6 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-xl" style={{ animation: 'float 3.5s ease-in-out 0.3s infinite' }}>
            <p className="text-white font-black text-lg leading-none">10k+</p>
            <p className="text-primary3/80 text-xs">Members</p>
          </div>
          {/* Floating badge bottom-right */}
          <div className="absolute -bottom-4 -right-6 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-xl" style={{ animation: 'float 3s ease-in-out 0.6s infinite' }}>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-sm">★★★★★</span>
            </div>
            <p className="text-white text-xs font-bold">4.8 Rating</p>
          </div>
        </div>
      </div>

      {/* Perks */}
      <div className="relative z-10 space-y-5">
        <div>
          <h2 className="text-white text-3xl xl:text-4xl font-black leading-tight">
            Join the<br />
            <span className="text-primary3">NepStyle Family.</span>
          </h2>
          <p className="text-primary3/70 text-sm mt-2 leading-relaxed">
            Create your free account and start exploring Nepal's finest fashion.
          </p>
        </div>
        <div className="space-y-3">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-primary3" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">{title}</p>
                <p className="text-primary3/60 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const [form, setForm] = useState({
    fullname: '', email_address: '', contact_number: '', password: '', confirm_password: '',
  });
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const passwordsMatch = form.confirm_password && form.password === form.confirm_password;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
        fullname:       form.fullname,
        email_address:  form.email_address,
        contact_number: form.contact_number,
        password:       form.password,
        otp:            '000000',
      });
      if (res.data.status) {
        toast.success('Account created! Welcome to NepStyle 🎉');
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

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left: Brand panel ──────────────────────────────── */}
      <BrandPanel />

      {/* ── Right: Form panel ──────────────────────────────── */}
      <div className="flex flex-col min-h-screen bg-white overflow-y-auto">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-center gap-2 py-6 px-6 bg-primary">
          <Sparkles size={18} className="text-primary3" />
          <span className="text-white text-lg font-black">Nep<span className="text-primary3">Style</span></span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-12">
          <div className="w-full max-w-sm">

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-3xl font-black text-primary tracking-tight">Create account</h1>
              <p className="text-gray-400 text-sm mt-1.5">Free forever · No credit card required</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full name */}
              <AuthInput
                icon={User}
                label="Full Name"
                placeholder="Your full name"
                value={form.fullname}
                onChange={set('fullname')}
                check
              />

              {/* Email */}
              <AuthInput
                icon={Mail}
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email_address}
                onChange={set('email_address')}
                check
              />

              {/* Phone */}
              <AuthInput
                icon={Phone}
                label="Phone Number"
                type="tel"
                placeholder="+977 98XXXXXXXX"
                value={form.contact_number}
                onChange={set('contact_number')}
              />

              {/* Password */}
              <div className="space-y-2">
                <AuthInput
                  icon={Lock}
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password"
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
                {/* Strength bar */}
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-amber-500' : strength.score === 3 ? 'text-blue-500' : 'text-green-600'}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                  {passwordsMatch && (
                    <span className="text-green-500 flex items-center gap-1 text-xs font-semibold">
                      <Check size={13} strokeWidth={3} /> Match
                    </span>
                  )}
                  {form.confirm_password && !passwordsMatch && (
                    <span className="text-red-400 text-xs font-semibold">Mismatch</span>
                  )}
                </div>
                <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-gray-50 ${
                  form.confirm_password
                    ? passwordsMatch
                      ? 'border-green-400 shadow-[0_0_0_4px_rgba(34,197,94,0.08)]'
                      : 'border-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.06)]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <Lock size={17} className="absolute left-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    className="w-full bg-transparent pl-11 pr-10 py-3.5 text-sm text-primary placeholder-gray-400 focus:outline-none rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary1 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Free Account <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">Already a member?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Sign in CTA */}
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary text-primary font-bold py-3.5 rounded-2xl transition-all duration-200 hover:bg-primary4/40 text-sm"
            >
              Sign In Instead <ArrowRight size={15} />
            </Link>

            {/* Trust line */}
            <p className="text-center text-xs text-gray-400 mt-6">
              🔒 By signing up, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-primary">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
