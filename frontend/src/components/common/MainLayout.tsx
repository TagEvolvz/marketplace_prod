import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Heart, LogOut, Menu, Search, Shield, ShoppingBag, ShoppingCart, UserRound, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import logo from '../../logo.png';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { getAvatarFallback } from '../../utils';
import { useDebounce } from '../../hooks';

const NAV_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'Supermarket', href: '/products?section=supermarket' },
  { label: 'Pharmacy', href: '/products?section=pharmacy' },
  { label: 'Cosmetics', href: '/products?section=cosmetics' },
];

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { itemCount } = useAppSelector((s) => s.cart);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 450);

  useEffect(() => {
    if (debouncedSearch.trim()) navigate(`/products?search=${encodeURIComponent(debouncedSearch.trim())}`);
  }, [debouncedSearch, navigate]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
    toast.success('Logged out');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
        isScrolled
          ? 'border-slate-200/80 bg-white/90 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80'
          : 'border-white/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60'
      }`}>
        <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl pr-1">
            <img src={logo} alt="FLOW" className="h-9 w-9 object-contain" />
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:block">
              FLOW
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <form onSubmit={handleSearch} className="ml-auto hidden w-full max-w-xs md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </form>

          <div className="flex items-center gap-1.5">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            <Link to="/wishlist" className="btn-ghost hidden h-10 w-10 px-0 md:inline-flex" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
            </Link>

            <Link to="/cart" className="btn-ghost relative h-10 w-10 px-0" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, y: 6 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white shadow-sm dark:text-slate-950"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 pr-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-[10px] font-bold text-white dark:bg-brand-primary dark:text-slate-950">
                    {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : getAvatarFallback(user?.firstName || 'U')}
                  </div>
                  <span className="hidden max-w-[7rem] truncate lg:block">{user?.firstName || 'Account'}</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="glass absolute right-0 mt-3 w-64 rounded-2xl p-2"
                    >
                      <div className="px-3 py-3">
                        <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                      </div>
                      <div className="space-y-1 border-t border-slate-200/80 p-1 pt-2 dark:border-white/10">
                        <Link to="/orders" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                          <ShoppingBag className="h-4 w-4" /> My Orders
                        </Link>
                        {user?.role === 'admin' && (
                          <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
                            <Shield className="h-4 w-4" /> Admin
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/auth/login" className="btn-primary hidden sm:inline-flex">Sign in</Link>
            )}

            <button onClick={() => setMobileOpen((v) => !v)} className="btn-ghost h-10 w-10 px-0 lg:hidden" aria-label="Open menu">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 max-w-7xl lg:hidden"
          >
            <div className="glass rounded-2xl p-3">
              <form onSubmit={handleSearch} className="mb-2 md:hidden">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products"
                    className="input h-11 pl-9"
                  />
                </div>
              </form>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
                <ThemeToggle />
                {!isAuthenticated && <Link to="/auth/login" className="btn-primary">Sign in</Link>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t border-slate-200/80 bg-white/70 py-10 dark:border-white/10 dark:bg-slate-950/70">
    <div className="page-container">
      <div className="grid gap-8 md:grid-cols-[1.5fr_2fr]">
        <div>
          <Link to="/" className="mb-4 inline-flex items-center gap-3">
            <img src={logo} alt="FLOW" className="h-10 w-10 object-contain" />
            <span className="text-lg font-extrabold text-slate-950 dark:text-white">FLOW</span>
          </Link>
          <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            A refined marketplace for essentials, wellness, and beauty with secure checkout and fast order management.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {[
            { title: 'Shop', links: ['All Products', 'Supermarket', 'Pharmacy', 'Cosmetics'] },
            { title: 'Account', links: ['Orders', 'Wishlist', 'Profile', 'Cart'] },
            { title: 'Support', links: ['Shipping', 'Returns', 'Privacy', 'Terms'] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link to="#" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 text-xs text-slate-500 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} FLOW Digital Retail.</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> Secure accounts</span>
          <span>Encrypted checkout</span>
        </div>
      </div>
    </div>
  </footer>
);

const MainLayout: React.FC = () => (
  <div className="app-shell flex min-h-screen flex-col font-sans">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
