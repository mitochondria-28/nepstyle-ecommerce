import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';
import { updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function MyProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    email_address: user?.email_address || '',
    contact_number: user?.contact_number || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile({ user_id: user.user_id, ...form });
      if (res.data.status) {
        updateUser(form);
        toast.success('Profile updated successfully!');
        navigate('/profile');
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon: Icon, label, name, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type={type}
          className="input-field pl-10"
          placeholder={placeholder}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-primary mb-6">Edit Profile</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
            {user?.fullname?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field icon={User} label="Full Name" name="fullname" placeholder="Your full name" />
          <Field icon={Mail} label="Email Address" name="email_address" type="email" placeholder="your@email.com" />
          <Field icon={Phone} label="Contact Number" name="contact_number" placeholder="+977 98XXXXXXXX" />
          <Field icon={MapPin} label="Address" name="address" placeholder="Your address" />

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl mt-2">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
