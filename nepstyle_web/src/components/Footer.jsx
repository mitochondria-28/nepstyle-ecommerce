import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-2">Nep<span className="text-primary3">Style</span></h3>
          <p className="text-primary3 text-sm leading-relaxed">Your go-to fashion destination in Nepal. Curated collections for every style.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-primary4">Quick Links</h4>
          <ul className="space-y-1.5 text-sm text-primary3">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/categories" className="hover:text-white transition-colors">Categories</Link></li>
            <li><Link to="/brands" className="hover:text-white transition-colors">Brands</Link></li>
            <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">Cart</Link></li>
            <li><Link to="/deals" className="hover:text-white transition-colors">🔥 Deals</Link></li>
            <li><Link to="/collections" className="hover:text-white transition-colors">✨ Collections</Link></li>
            <li><Link to="/style-quiz" className="hover:text-white transition-colors">🎯 Style Quiz</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-primary4">Info</h4>
          <ul className="space-y-1.5 text-sm text-primary3">
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
            <li><Link to="/support" className="hover:text-white transition-colors">Customer Support</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary1 py-4 text-center text-xs text-primary3">
        &copy; {new Date().getFullYear()} NepStyle. All rights reserved.
      </div>
    </footer>
  );
}
