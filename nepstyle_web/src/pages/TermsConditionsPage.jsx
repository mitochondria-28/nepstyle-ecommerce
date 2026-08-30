import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Terms & Conditions</h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: January 2025</p>
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          {[
            { title: '1. Acceptance of Terms', text: 'By accessing and using NepStyle, you accept and agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.' },
            { title: '2. Account Registration', text: 'You must provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.' },
            { title: '3. Product Information', text: 'We strive to ensure all product information is accurate. However, we reserve the right to correct errors and update product details, prices, and availability at any time.' },
            { title: '4. Ordering & Payment', text: 'By placing an order, you agree to pay the listed price plus any applicable taxes and delivery charges. Orders are confirmed only after payment is successfully processed.' },
            { title: '5. Returns & Refunds', text: 'Products may be returned within 7 days of delivery if they are unused, in original packaging. Refunds are processed within 5-7 business days to the original payment method.' },
            { title: '6. Intellectual Property', text: 'All content on NepStyle, including logos, images, and text, is the property of NepStyle and protected by intellectual property laws.' },
            { title: '7. Limitation of Liability', text: 'NepStyle shall not be liable for any indirect, incidental, or consequential damages arising from the use of our platform or products purchased thereon.' },
            { title: '8. Governing Law', text: 'These terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal.' },
          ].map(({ title, text }) => (
            <div key={title}>
              <h3 className="font-bold text-primary mb-1">{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
