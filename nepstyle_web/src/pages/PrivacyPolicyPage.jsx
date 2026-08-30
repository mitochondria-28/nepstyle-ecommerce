import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-primary2 mb-6 hover:text-primary">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-6">Last updated: January 2025</p>
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          {[
            { title: '1. Information We Collect', text: 'We collect information you provide when creating an account, making purchases, or contacting us. This includes your name, email address, phone number, and payment details.' },
            { title: '2. How We Use Your Information', text: 'Your information is used to process orders, personalize your shopping experience, send order updates, and improve our services. We do not sell your personal data to third parties.' },
            { title: '3. Data Security', text: 'We use industry-standard SSL encryption to protect your data during transmission. Your payment information is processed through secure payment gateways and is never stored on our servers.' },
            { title: '4. Cookies', text: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser preferences.' },
            { title: '5. Third-Party Services', text: 'We may share data with trusted third-party services including payment processors (eSewa, Khalti) and delivery partners solely to fulfill your orders.' },
            { title: '6. Your Rights', text: 'You have the right to access, update, or delete your personal information at any time. Contact us at privacy@nepstyle.com to exercise these rights.' },
            { title: '7. Contact Us', text: 'If you have questions about this privacy policy, please contact us at privacy@nepstyle.com or call our support line during business hours.' },
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
