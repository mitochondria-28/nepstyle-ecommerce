import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-primary4 border-b border-primary3 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <span className="text-2xl font-bold text-primary tracking-tight">Nep<span className="text-primary2">Style</span></span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 border border-primary rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link to="/wishlist" className="p-2 hover:bg-primary3/30 rounded-full transition-colors">
            <Heart size={22} className="text-primary" />
          </Link>

          <Link to="/cart" className="relative p-2 hover:bg-primary3/30 rounded-full transition-colors">
            <ShoppingCart size={22} className="text-primary" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm"
              >
                {user.fullname?.[0]?.toUpperCase() || 'U'}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-1 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-primary text-sm">{user.fullname}</p>
                    <p className="text-xs text-gray-400">{user.email_address}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                    <Package size={16} /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm px-3 py-1.5 rounded-lg">Login</Link>
          )}

          <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} className="text-primary" /> : <Menu size={22} className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-3 border-t border-primary3/50">
          <form onSubmit={handleSearch} className="mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 border border-primary rounded-xl bg-white text-sm focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/categories" className="text-sm text-primary1 font-medium hover:underline" onClick={() => setMenuOpen(false)}>Categories</Link>
            <Link to="/brands" className="text-sm text-primary1 font-medium hover:underline" onClick={() => setMenuOpen(false)}>Brands</Link>
            <Link to="/products" className="text-sm text-primary1 font-medium hover:underline" onClick={() => setMenuOpen(false)}>All Products</Link>
          </div>
        </div>
      )}

      {/* Desktop Nav Links */}
      <div className="hidden sm:flex border-t border-primary3/50 px-4 gap-6 py-1.5 max-w-7xl mx-auto">
        <Link to="/" className="text-sm text-primary font-medium hover:text-primary2 transition-colors">Home</Link>
        <Link to="/categories" className="text-sm text-primary font-medium hover:text-primary2 transition-colors">Categories</Link>
        <Link to="/brands" className="text-sm text-primary font-medium hover:text-primary2 transition-colors">Brands</Link>
        <Link to="/products" className="text-sm text-primary font-medium hover:text-primary2 transition-colors">All Products</Link>
      </div>
    </nav>
  );
}
