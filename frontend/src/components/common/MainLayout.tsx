import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Menu, X, Heart, LogOut,
  ShoppingBag, Shield, User,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import logo from '../../logo.png';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useDebounce } from '../../hooks';
import { getAvatarFallback } from '../../utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'Supermarket',  href: '/products?section=supermarket' },
  { label: 'Pharmacy',     href: '/products?section=pharmacy' },
  { label: 'Cosmetics',    href: '/products?section=cosmetics' },
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
    if (debouncedSearch) navigate(`/products?search=${encodeURIComponent(debouncedSearch)}`);
  }, [debouncedSearch, navigate]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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

  const handleLogout = () => { dispatch(logout()); navigate('/auth/login'); toast.success('Logged out'); };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
      isScrolled ? 'py-2' : 'py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className={`glass rounded-[28px] transition-all duration-700 shadow-2xl ${
          isScrolled ? 'border-brand-primary/30 shadow-brand-primary/10' : 'border-white/10 shadow-black/20'
        }`}>
          <div className="flex items-center h-20 px-6 md:px-8 gap-6">
            {/* Logo with Bouncing/Floating Vibe */}
            <Link to="/" className="flex items-center gap-4 group">
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  filter: ["drop-shadow(0 0 8px rgba(57, 255, 20, 0.2))", "drop-shadow(0 0 15px rgba(57, 255, 20, 0.5))", "drop-shadow(0 0 8px rgba(57, 255, 20, 0.2))"]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-14 h-14 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-brand-gradient rounded-2xl opacity-10 blur-xl group-hover:opacity-30 transition-opacity" />
                <img src={logo} alt="FLOW" className="w-12 h-12 object-contain relative z-10" />
              </motion.div>
              <span className="font-display text-2xl font-black tracking-tighter hidden lg:block">
                <span className="text-white">FL</span>
                <span className="text-brand-neon">OW</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-2">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} to={link.href}
                  className={({ isActive }) =>
                    `px-5 py-2.5 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 relative group ${
                      isActive
                        ? 'text-brand-neon'
                        : 'text-slate-400 hover:text-white'
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-glow"
                          className="absolute inset-0 bg-brand-primary/10 rounded-xl blur-sm"
                        />
                      )}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-neon group-hover:w-1/2 transition-all duration-500 rounded-full shadow-[0_0_10px_#39FF14]" />
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              <Link to="/cart" className="relative p-3 rounded-2xl text-white hover:bg-white/5 transition-all group">
                <ShoppingCart className="w-6 h-6 group-hover:text-brand-neon transition-colors" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-brand-neon text-black rounded-full text-[11px] font-black flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.5)]"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center p-1 rounded-2xl hover:bg-white/5 transition-colors border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-gradient p-[1.5px]">
                       <div className="w-full h-full bg-black rounded-[9px] flex items-center justify-center overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-[10px] font-black text-white">{getAvatarFallback(user?.firstName || 'U')}</span>
                          )}
                       </div>
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-64 glass rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 py-3 z-50"
                      >
                        <div className="px-6 py-4 border-b border-white/5">
                          <p className="text-sm font-black truncate text-white uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
                          <p className="text-[10px] text-slate-500 font-bold truncate tracking-widest">{user?.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link to="/orders" className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-brand-primary/10 hover:text-brand-neon rounded-2xl transition-all">
                             <ShoppingBag className="w-5 h-5" /> My Orders
                          </Link>
                          {user?.role === 'admin' && (
                            <Link to="/admin" className="flex items-center gap-4 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-brand-primary/10 hover:text-brand-neon rounded-2xl transition-all">
                               <Shield className="w-5 h-5" /> Admin Core
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-2xl transition-all">
                             <LogOut className="w-5 h-5" /> Terminate Session
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/auth/login" className="btn-primary !px-8 !py-3.5 !text-[11px] uppercase tracking-[0.2em] font-black">Access</Link>
              )}

              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-3 rounded-2xl hover:bg-white/5 transition-colors text-white">
                {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden mt-3 px-4"
          >
            <div className="glass rounded-[32px] border border-white/10 p-6 space-y-3 shadow-2xl">
               {NAV_LINKS.map(l => (
                 <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="block px-6 py-4 rounded-2xl hover:bg-brand-primary/10 text-sm font-black uppercase tracking-widest text-white transition-all">
                   {l.label}
                 </Link>
               ))}
               <div className="pt-4 border-t border-white/5 flex justify-center">
                  <ThemeToggle />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-black border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
    {/* Animated Background Flow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-brand-neon to-transparent opacity-30 shadow-[0_0_20px_#39FF14]" />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1]
      }}
      transition={{ duration: 10, repeat: Infinity }}
      className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/10 blur-[150px] rounded-full pointer-events-none"
    />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
        <div className="col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-4 mb-10 group">
            <motion.img
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              src={logo} alt="FLOW" className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(57,255,20,0.3)]"
            />
            <span className="font-display text-4xl font-black tracking-tighter text-white">FLOW</span>
          </Link>
          <p className="text-slate-500 text-lg font-bold leading-relaxed max-w-sm mb-12 uppercase tracking-tighter">
            The next evolution of the supermarket experience. Fluid motion. Future design. Zero friction.
          </p>
          <div className="flex gap-5">
             {[1,2,3,4].map(i => (
               <motion.div
                key={i}
                whileHover={{ y: -5, borderColor: '#39FF14' }}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all cursor-pointer group"
               >
                  <div className="w-5 h-5 bg-slate-600 group-hover:bg-brand-neon transition-colors shadow-brand-neon" />
               </motion.div>
             ))}
          </div>
        </div>

        {[
          { title: 'Flow', links: ['All Products', 'Supermarket', 'Pharmacy', 'Cosmetics'] },
          { title: 'Core', links: ['About Us', 'Sustainability', 'Careers', 'Press'] },
          { title: 'Support', links: ['Contact', 'Shipping', 'Returns', 'FAQ'] },
        ].map(section => (
          <div key={section.title}>
            <h4 className="text-white font-black text-xs mb-10 uppercase tracking-[0.3em]">{section.title}</h4>
            <ul className="space-y-6">
              {section.links.map(link => (
                <li key={link}>
                  <Link to="#" className="text-slate-500 hover:text-brand-neon text-sm font-bold transition-all uppercase tracking-tighter">{link}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
          &copy; {new Date().getFullYear()} FLOW DIGITAL RETAIL // CORE SYNTHESIS.
        </p>
        <div className="flex gap-10">
           {['Privacy', 'Terms', 'Cookies'].map(l => (
             <Link key={l} to="#" className="text-slate-700 hover:text-white text-[9px] font-black uppercase tracking-[0.5em] transition-colors">{l}</Link>
           ))}
        </div>
      </div>
    </div>
  </footer>
);

const MainLayout: React.FC = () => (
  <div className="min-h-screen bg-black text-slate-200 transition-colors duration-700 flex flex-col font-sans selection:bg-brand-neon/30 selection:text-brand-neon">
    {/* Global Background Vibe */}
    <div className="fixed inset-0 pointer-events-none -z-10">
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(57,255,20,0.03)_0%,transparent_50%)]" />
       <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(57,255,20,0.03)_0%,transparent_50%)]" />
    </div>

    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
