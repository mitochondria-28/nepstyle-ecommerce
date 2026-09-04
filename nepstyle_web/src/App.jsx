import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatWidget from './components/AIChatWidget';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import MyProfilePage from './pages/MyProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import OrderListPage from './pages/OrderListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AllCategoriesPage from './pages/AllCategoriesPage';
import AllBrandsPage from './pages/AllBrandsPage';
import AllProductsPage from './pages/AllProductsPage';
import CategoryProductsPage from './pages/CategoryProductsPage';
import BrandProductsPage from './pages/BrandProductsPage';
import SearchPage from './pages/SearchPage';
import AboutCompanyPage from './pages/AboutCompanyPage';
import FAQsPage from './pages/FAQsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import SupportPage from './pages/SupportPage';
import DealsPage from './pages/DealsPage';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
            <AIChatWidget />
            <Routes>
              {/* Auth routes (no navbar/footer) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Main app routes with layout */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/product" element={<Layout><ProductDetailPage /></Layout>} />
              <Route path="/search" element={<Layout><SearchPage /></Layout>} />
              <Route path="/categories" element={<Layout><AllCategoriesPage /></Layout>} />
              <Route path="/categories/:id" element={<Layout><CategoryProductsPage /></Layout>} />
              <Route path="/brands" element={<Layout><AllBrandsPage /></Layout>} />
              <Route path="/brands/:id" element={<Layout><BrandProductsPage /></Layout>} />
              <Route path="/products" element={<Layout><AllProductsPage /></Layout>} />
              <Route path="/about" element={<Layout><AboutCompanyPage /></Layout>} />
              <Route path="/faqs" element={<Layout><FAQsPage /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
              <Route path="/terms" element={<Layout><TermsConditionsPage /></Layout>} />
              <Route path="/support" element={<Layout><SupportPage /></Layout>} />
              <Route path="/deals"   element={<Layout><DealsPage /></Layout>} />

              {/* Protected routes */}
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
              <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
              <Route path="/profile" element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>} />
              <Route path="/profile/edit" element={<Layout><ProtectedRoute><MyProfilePage /></ProtectedRoute></Layout>} />
              <Route path="/profile/change-password" element={<Layout><ProtectedRoute><ChangePasswordPage /></ProtectedRoute></Layout>} />
              <Route path="/orders" element={<Layout><ProtectedRoute><OrderListPage /></ProtectedRoute></Layout>} />
              <Route path="/orders/:id" element={<Layout><ProtectedRoute><OrderDetailPage /></ProtectedRoute></Layout>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
