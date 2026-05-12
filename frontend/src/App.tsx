import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from './store';
import { restoreSession } from './store/slices/authSlice';
import MainLayout from './components/common/MainLayout';
import AdminLayout from './components/common/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PageLoader from './components/common/PageLoader';
import SplashScreen from './components/common/SplashScreen';
import AIAssistant from './components/ai/AIAssistant';
import { pageVariants } from './utils/motion';

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const HomePage          = lazy(() => import('./pages/HomePage'));
const ProductsPage      = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage          = lazy(() => import('./pages/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const OrdersPage        = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage   = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage      = lazy(() => import('./pages/WishlistPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));

const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('./pages/auth/VerifyEmailPage'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminProducts  = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('./pages/admin/AdminOrders'));

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const AppInner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!location.pathname.startsWith('/auth')) {
      dispatch(restoreSession());
    }
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (!isLoading) return;
    if (location.pathname.startsWith('/auth')) return;
    if (isAuthenticated) return;

    const t = setTimeout(() => {
      navigate('/auth/login', { replace: true });
    }, 5000);
    return () => clearTimeout(t);
  }, [isLoading, location.pathname, isAuthenticated, navigate]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) return <PageLoader />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
            <Route path="/products" element={<AnimatedPage><ProductsPage /></AnimatedPage>} />
            <Route path="/products/:slug" element={<AnimatedPage><ProductDetailPage /></AnimatedPage>} />

            {/* Customer-only routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart"             element={<AnimatedPage><CartPage /></AnimatedPage>} />
              <Route path="/checkout"         element={<AnimatedPage><CheckoutPage /></AnimatedPage>} />
              <Route path="/orders"           element={<AnimatedPage><OrdersPage /></AnimatedPage>} />
              <Route path="/orders/:orderNumber" element={<AnimatedPage><OrderDetailPage /></AnimatedPage>} />
              <Route path="/wishlist"         element={<AnimatedPage><WishlistPage /></AnimatedPage>} />
              <Route path="/profile"          element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
            </Route>
          </Route>

          {/* Auth pages (no main layout) */}
          <Route path="/auth/login"           element={<AnimatedPage><LoginPage /></AnimatedPage>} />
          <Route path="/auth/register"        element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
          <Route path="/auth/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
          <Route path="/auth/reset-password"  element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
          <Route path="/auth/verify-email"    element={<AnimatedPage><VerifyEmailPage /></AnimatedPage>} />

          {/* Admin panel */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
              <Route path="/admin/products"  element={<AnimatedPage><AdminProducts /></AnimatedPage>} />
              <Route path="/admin/orders"    element={<AnimatedPage><AdminOrders /></AnimatedPage>} />
              <Route path="/admin/users"     element={<AnimatedPage><AdminUsers /></AnimatedPage>} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-dark-900">
              <motion.div className="text-center" variants={pageVariants} initial="initial" animate="animate">
                <p className="text-7xl font-black text-brand-neon mb-4">404</p>
                <p className="text-slate-400 mb-6">Page not found</p>
                <a href="/" className="btn-primary inline-flex">Go Home</a>
              </motion.div>
            </div>
          } />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App: React.FC = () => (
  <>
    <AppInner />
    <AIAssistant />
  </>
);

export default App;
