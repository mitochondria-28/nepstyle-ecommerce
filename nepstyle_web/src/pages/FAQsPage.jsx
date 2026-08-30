import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse products, add them to your cart, and proceed to checkout. Select your delivery location and payment method, then confirm your order.' },
  { q: 'What payment methods are accepted?', a: 'We accept eSewa, Khalti, and Cash on Delivery. More payment options will be added soon.' },
  { q: 'How long does delivery take?', a: 'Standard delivery within Kathmandu Valley takes 1-2 business days. Outside the valley, it may take 3-5 business days.' },
  { q: 'Can I return or exchange a product?', a: 'Yes, we have a 7-day return policy for most items. Products must be unused, in original packaging with all tags intact.' },
  { q: 'Are all products authentic?', a: 'Absolutely! We only partner with verified brands and sellers. All products listed on NepStyle are 100% authentic.' },
  { q: 'How do I track my order?', a: 'You can track your order status in the "My Orders" section of your profile. We also send updates via notifications.' },
  { q: 'Is it safe to shop on NepStyle?', a: 'Yes, NepStyle uses industry-standard security protocols to protect your personal and payment information.' },
  { q: 'How do I contact customer support?', a: 'You can reach us through email or the contact form. Our support team is available 9 AM - 6 PM, Sunday to Friday.' },
];

export default function FAQsPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-primary mb-2">FAQs</h1>
      <p className="text-gray-500 text-sm mb-6">Frequently asked questions</p>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-semibold text-primary text-sm pr-4">{faq.q}</span>
              <ChevronDown size={18} className={`text-primary2 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
