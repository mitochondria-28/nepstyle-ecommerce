import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BrandsPage from './pages/BrandsPage';
import FlashSalesPage from './pages/FlashSalesPage';
import OrdersPage from './pages/OrdersPage';
import ReviewsPage from './pages/ReviewsPage';

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicRoute><LoginPage /></PublicRoute>}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products"    element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/categories"  element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
      <Route path="/brands"      element={<ProtectedRoute><BrandsPage /></ProtectedRoute>} />
      <Route path="/flash-sales" element={<ProtectedRoute><FlashSalesPage /></ProtectedRoute>} />
      <Route path="/orders"      element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/reviews"     element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 3000, style: { borderRadius: '10px', fontSize: '13px' } }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
