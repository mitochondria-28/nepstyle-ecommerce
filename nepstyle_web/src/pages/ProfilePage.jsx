import { Link, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Info, HelpCircle, FileText, Shield, LogOut, ChevronRight, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const menuSections = [
  {
    title: 'Personal Information',
    items: [
      { icon: User, label: 'My Profile', path: '/profile/edit' },
      { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
    ],
  },
  {
    title: 'General',
    items: [
      { icon: Info, label: 'About Company', path: '/about' },
      { icon: HelpCircle, label: 'FAQs', path: '/faqs' },
      { icon: FileText, label: 'Terms & Conditions', path: '/terms' },
      { icon: Shield, label: 'Privacy Policy', path: '/privacy' },
    ],
  },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user.fullname?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">My Profile</h1>

      {/* User Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Welcome, {user.fullname}!</h2>
          <p className="text-gray-400 text-sm">{user.email_address}</p>
          {user.contact_number && <p className="text-gray-400 text-sm">{user.contact_number}</p>}
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide px-1 mb-2">{section.title}</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {section.items.map((item, i) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-appBg transition-colors ${i < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={19} className="text-primary2" />
                  <span className="text-sm font-medium text-primary">{item.label}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Other Actions */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide px-1 mb-2">Other Actions</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <Link to="/profile/change-password" className="flex items-center justify-between px-5 py-3.5 hover:bg-appBg border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Shield size={19} className="text-primary2" />
              <span className="text-sm font-medium text-primary">Change Password</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Bell size={19} className="text-primary2" />
              <span className="text-sm font-medium text-primary">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-colors text-left">
            <LogOut size={19} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
