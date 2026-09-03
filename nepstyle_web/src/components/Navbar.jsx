import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Heart, User, Search, Menu, X,
  LogOut, Package, ChevronDown, Home, Grid3X3, Tag,
  ShoppingBag, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { to: '/',           label: 'Home',       icon: Home       },
  { to: '/categories', label: 'Categories', icon: Grid3X3    },
  { to: '/brands',     label: 'Brands',     icon: Tag        },
  { to: '/products',   label: 'Products',   icon: ShoppingBag },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const dropdownRef = useRef(null);

  /* scroll shadow */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  /* lock body scroll when drawer is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* ── MAIN NAV ──────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100/80'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

          {/* ── Logo ── */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 group mr-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary2 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight select-none">
              <span className="text-primary">Nep</span>
              <span className="bg-gradient-to-r from-primary1 to-primary2 bg-clip-text text-transparent">Style</span>
            </span>
          </Link>

          {/* ── Search (desktop) ── */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
            <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-[1.015]' : ''}`}>
              <Search
                size={16}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
                  searchFocused ? 'text-primary' : 'text-gray-400'
                }`}
              />
              <input
                type="text"
                placeholder="Search clothes, brands…"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </form>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-0.5 ml-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(to)
                    ? 'text-primary bg-primary4'
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50/80'
                }`}
              >
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors group"
              title="Wishlist"
            >
              <Heart size={20} className="text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors group"
              title="Cart"
            >
              <ShoppingCart size={20} className="text-gray-500 group-hover:text-primary transition-colors duration-200" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black px-0.5 shadow animate-scale-pop leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User / Auth */}
            {user ? (
              <div className="relative ml-1" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl transition-all duration-200 ${
                    dropdownOpen ? 'bg-primary4' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary2 flex items-center justify-center text-white font-black text-sm shadow-sm">
                    {user.fullname?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-up">
                    {/* Gradient header */}
                    <div className="bg-gradient-to-br from-primary to-primary1 px-4 py-4 flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                        {user.fullname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm leading-tight truncate">{user.fullname}</p>
                        <p className="text-primary3 text-xs mt-0.5 truncate">{user.email_address || user.phone_number}</p>
                      </div>
                    </div>
                    {/* Menu items */}
                    <div className="p-2">
                      <DropLink to="/profile" icon={User} label="My Profile"  onClick={() => setDropdownOpen(false)} />
                      <DropLink to="/orders"  icon={Package} label="My Orders" onClick={() => setDropdownOpen(false)} />
                      <DropLink to="/wishlist" icon={Heart} label="Wishlist"   onClick={() => setDropdownOpen(false)} />
                      <div className="border-t border-gray-100 mt-1.5 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-primary px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary1 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors ml-1"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} className="text-primary" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ─────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-[300px] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Panel header */}
          <div className="bg-gradient-to-br from-primary to-primary1 px-5 pt-14 pb-6 relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {user.fullname?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-base leading-tight truncate">{user.fullname}</p>
                  <p className="text-primary3 text-xs mt-0.5 truncate">{user.email_address || user.phone_number}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Welcome!</p>
                  <p className="text-primary3 text-xs">Sign in to get started</p>
                </div>
              </div>
            )}
          </div>

          {/* Search in drawer */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="Search products…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">Navigate</p>
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold transition-colors ${
                  isActive(to)
                    ? 'bg-primary4 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <Icon size={17} className={isActive(to) ? 'text-primary' : 'text-gray-400'} />
                {label}
                {isActive(to) && <span className="ml-auto w-2 h-2 bg-primary rounded-full" />}
              </Link>
            ))}

            {/* Cart & Wishlist quick links */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary4 text-primary text-sm font-bold hover:bg-primary3/40 transition-colors"
              >
                <ShoppingCart size={16} />
                Cart {cartCount > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-black">{cartCount}</span>}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <Heart size={16} /> Wishlist
              </Link>
            </div>

            {/* Account links */}
            {user && (
              <>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5 mt-5">Account</p>
                <DrawerLink to="/profile"  icon={User}    label="My Profile" onClick={() => setMenuOpen(false)} />
                <DrawerLink to="/orders"   icon={Package} label="My Orders"  onClick={() => setMenuOpen(false)} />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors"
              >
                <LogOut size={17} /> Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary4 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary1 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── small helpers ──────────────────────────────────────────── */
function DropLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-primary4 hover:text-primary transition-colors"
    >
      <Icon size={15} className="text-primary2 flex-shrink-0" />
      {label}
    </Link>
  );
}

function DrawerLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
    >
      <Icon size={17} className="text-gray-400" />
      {label}
    </Link>
  );
}
