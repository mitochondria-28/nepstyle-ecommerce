import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutCompanyPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">About NepStyle</h1>
        <div className="w-12 h-1 bg-primary2 rounded mb-6" />
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong className="text-primary">NepStyle</strong> is Nepal's premier fashion e-commerce platform, dedicated to bringing you the finest curated collections from top local and international brands.
          </p>
          <p>
            Founded with a vision to make quality fashion accessible to everyone in Nepal, we connect fashion enthusiasts with authentic products across clothing, accessories, footwear, and lifestyle categories.
          </p>
          <p>
            Our platform features AI-powered recommendations, real-time inventory tracking, and a seamless shopping experience designed for the modern Nepali consumer.
          </p>
          <div className="bg-primary4 rounded-xl p-5">
            <h3 className="font-bold text-primary mb-3">Our Values</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-primary font-bold">✦</span> Authenticity — Only genuine products from verified brands</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✦</span> Quality — Rigorous quality checks on all products</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✦</span> Trust — Transparent pricing and secure payments</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✦</span> Community — Supporting local fashion and culture</li>
            </ul>
          </div>
          <p>
            Whether you're looking for everyday casual wear or special occasion outfits, NepStyle is your trusted destination for all things fashion in Nepal.
          </p>
        </div>
      </div>
    </div>
  );
}
