import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword({ user_id: user.user_id, old_password: form.old_password, new_password: form.new_password });
      if (res.data.status) {
        toast.success('Password changed successfully!');
        navigate('/profile');
      } else {
        toast.error(res.data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const PassField = ({ label, name, show, onToggle }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type={show ? 'text' : 'password'}
          className="input-field pl-10 pr-10"
          placeholder="••••••••"
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={onToggle}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-primary mb-6">Change Password</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PassField label="Current Password" name="old_password" show={showOld} onToggle={() => setShowOld(!showOld)} />
          <PassField label="New Password" name="new_password" show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PassField label="Confirm New Password" name="confirm_password" show={showNew} onToggle={() => setShowNew(!showNew)} />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
