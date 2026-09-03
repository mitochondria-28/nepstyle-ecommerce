import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Building2,
  Zap, ShoppingBag, Star, ShoppingCart,
  Server, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products',    icon: Package,          label: 'Products' },
  { path: '/categories',  icon: Tag,              label: 'Categories' },
  { path: '/brands',      icon: Building2,        label: 'Brands' },
  { path: '/flash-sales', icon: Zap,              label: 'Flash Sales' },
  { path: '/orders',      icon: ShoppingBag,      label: 'Orders' },
  { path: '/reviews',     icon: Star,             label: 'Reviews' },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const initials = admin?.fullname
    ? admin.fullname.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 flex-shrink-0">
            <ShoppingCart size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] leading-tight">NepStyle</h1>
            <p className="text-indigo-400 text-[11px] font-medium tracking-wide">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin info */}
      {admin && (
        <div className="px-4 py-3.5 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13px] font-semibold leading-tight truncate">
                {admin.fullname}
              </p>
              <p className="text-slate-500 text-[11px] truncate">{admin.email_address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-indigo-200' : ''} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="text-indigo-300" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/40 space-y-2">
        {/* Server status */}
        <div className="bg-slate-800/60 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <div className="w-2 h-2 bg-emerald-400 rounded-full absolute inset-0 animate-ping opacity-60" />
          </div>
          <Server size={13} className="text-slate-500" />
          <div>
            <p className="text-slate-300 text-[11px] font-semibold">Server Online</p>
            <p className="text-slate-600 text-[10px]">localhost:8080</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all duration-150 group"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
