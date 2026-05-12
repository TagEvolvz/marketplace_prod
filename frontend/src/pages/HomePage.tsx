import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, Pill, ShoppingBag, Sparkles,
  ChevronRight, Truck, ShieldCheck, Headphones, RefreshCw, Loader2,
  ArrowRight, TrendingUp, Search
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productAPI, cartAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage, formatNumber } from '../utils';
import { staggerContainer, staggerItem, heroText, buttonTap } from '../utils/motion';
import { Product } from '../types';
import toast from 'react-hot-toast';

// ─── Enhanced Product Card with "Vibe" ──────────────────────────────────────
export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [adding, setAdding] = useState(false);

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.effectivePrice) / product.compareAtPrice) * 100)
    : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Sign in to add items'); return; }
    setAdding(true);
    try {
      const res = await cartAPI.addItem({ productId: product._id, quantity: 1 });
      dispatch(setCart(res.data.data));
      toast.success('Added to cart');
    } catch { toast.error('Failed to add item'); } finally { setAdding(false); }
  };

  return (
    <motion.div
      className="card-premium group relative"
      whileHover={{
        y: -12,
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }}
    >
      {/* Dynamic Hover Glow */}
      <div className="absolute -inset-2 bg-brand-gradient opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 rounded-[40px]" />

      <Link to={`/products/${product.slug}`} className="block relative z-10">
        <div className="relative aspect-[4/5] bg-slate-50 dark:bg-dark-800/50 overflow-hidden">
          <motion.img
            src={getProductImage(product.images)} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {discount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-brand-neon text-black text-[10px] font-black px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.5)]"
              >
                -{discount}%
              </motion.span>
            )}
            {(product as any).prescriptionRequired && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                <Pill className="w-3 h-3" /> Rx
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-neon hover:text-black hover:border-brand-neon shadow-xl"
          >
            <Heart className="w-5 h-5" />
          </motion.button>

          <div className="absolute bottom-6 inset-x-6 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <button
              onClick={handleAdd}
              disabled={adding || product.status === 'out_of_stock'}
              className="w-full btn-primary !py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Flow'}
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-base font-black text-slate-800 dark:text-white line-clamp-1 mb-2 group-hover:text-brand-neon transition-colors tracking-tight uppercase">{product.name}</h3>
          <div className="flex items-center gap-2 mb-4">
             <div className="flex text-brand-neon">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating || 0) ? 'fill-current' : 'opacity-20'}`} />
               ))}
             </div>
             <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">({formatNumber(product.totalRatings || 0)} Reviews)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(product.effectivePrice)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && (
                <span className="text-sm text-slate-400 line-through font-bold opacity-50">{formatCurrency(product.compareAtPrice)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ─── Smart Search with Glow ─────────────────────────────────────────────────
const SmartSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative group max-w-2xl w-full">
      <div className="absolute -inset-1 bg-brand-gradient rounded-3xl blur-xl opacity-20 group-focus-within:opacity-50 transition duration-1000 animate-pulse"></div>
      <div className="relative flex items-center bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <Search className="ml-6 w-6 h-6 text-slate-400 group-focus-within:text-brand-neon transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I'm looking for fresh groceries, medicine, or cosmetics..."
          className="w-full py-2.5 px-4 bg-transparent text-white placeholder-slate-400 outline-none text-sm font-semibold"
        />
        <button className="mr-3 btn-primary !rounded-2xl !py-2 !px-6 text-sm font-black uppercase tracking-wide">Search</button>
      </div>
    </form>
  );
};

// ─── Section Meta ──────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'supermarket',
    label: 'Supermarket',
    icon: <ShoppingBag />,
    color: 'from-green-500/20 to-emerald-500/20',
    text: 'Fresh daily essentials delivered to your door.',
    href: '/products?section=supermarket'
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: <Pill />,
    color: 'from-blue-500/20 to-indigo-500/20',
    text: 'Health and wellness at the click of a button.',
    href: '/products?section=pharmacy'
  },
  {
    id: 'cosmetics',
    label: 'Cosmetics',
    icon: <Sparkles />,
    color: 'from-rose-500/20 to-purple-500/20',
    text: 'Unlock your beauty with premium care.',
    href: '/products?section=cosmetics'
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: superData, isLoading: superLoading } = useQuery({
    queryKey: ['home-super'],
    queryFn: () => productAPI.getProducts({ storeSection: 'supermarket', limit: 4 }).then(r => r.data.data)
  });

  const { data: pharmData, isLoading: pharmLoading } = useQuery({
    queryKey: ['home-pharm'],
    queryFn: () => productAPI.getProducts({ storeSection: 'pharmacy', limit: 4 }).then(r => r.data.data)
  });

  const { data: cosData, isLoading: cosLoading } = useQuery({
    queryKey: ['home-cos'],
    queryFn: () => productAPI.getProducts({ storeSection: 'cosmetics', limit: 4 }).then(r => r.data.data)
  });

  return (
    <div className="relative min-h-screen">
      {/* ── Background Elements with "Vibe" ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-neon/5 blur-[150px] rounded-full"
        />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[70vh] flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div
              {...heroText(0.1)}
              className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-neon text-xs font-black mb-10 uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(57,255,20,0.1)]"
            >
              <TrendingUp className="w-4 h-4" /> Next-Gen Digital Shopping
            </motion.div>

            <motion.h1
              {...heroText(0.2)}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight uppercase"
            >
              THE ULTIMATE <br />
              <span className="glow-text">RETAIL FLOW</span>
            </motion.h1>

            <motion.p
              {...heroText(0.3)}
              className="max-w-3xl text-slate-400 text-sm md:text-base font-medium mb-8 leading-relaxed opacity-90"
            >
              Immerse yourself in a fluid marketplace where supermarket essentials,
              healthcare, and beauty merge into one seamless experience.
            </motion.p>

            <motion.div {...heroText(0.4)} className="w-full flex justify-center mb-12">
              <SmartSearchBar />
            </motion.div>

            <motion.div
              variants={staggerContainer} initial="initial" animate="animate"
              className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl"
            >
              {SECTIONS.map((s) => (
                <motion.div
                  key={s.id} variants={staggerItem}
                  onClick={() => navigate(s.href)}
                  className="group relative p-10 rounded-[40px] bg-white/5 border border-white/10 cursor-pointer overflow-hidden transition-all duration-700 hover:border-brand-primary/50 hover:shadow-[0_20px_80px_rgba(57,255,20,0.15)]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl`} />
                  <div className="relative z-10">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-8 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-black transition-all duration-700 shadow-2xl"
                    >
                      {React.cloneElement(s.icon as React.ReactElement, { size: 40 })}
                    </motion.div>
                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{s.label}</h3>
                    <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{s.text}</p>
                    <div className="flex items-center gap-3 text-brand-neon font-black text-xs uppercase tracking-widest group-hover:gap-5 transition-all">
                      Explore Section <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: <Truck />, title: 'Hyper Delivery', sub: 'Instant Flow' },
              { icon: <ShieldCheck />, title: 'Neural Shield', sub: 'Encrypted Pay' },
              { icon: <RefreshCw />, title: 'Fresh Sync', sub: 'Quality Assured' },
              { icon: <Headphones />, title: 'Core Support', sub: '24/7 Connectivity' },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-6"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0 shadow-lg border border-brand-primary/10">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 28 })}
                </div>
                <div>
                  <h4 className="font-black text-base text-white uppercase tracking-tighter mb-1">{f.title}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Sections ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Supermarket Section */}
          <div className="mb-32">
            <div className="flex items-end justify-between mb-16">
              <div>
                <motion.h2
                  whileInView={{ x: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-3xl font-black text-white tracking-tighter uppercase"
                >
                  Supermarket
                </motion.h2>
                <div className="h-2 w-32 bg-brand-gradient rounded-full mt-4 shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
              </div>
              <Link to="/products?section=supermarket" className="text-brand-neon font-black flex items-center gap-3 hover:gap-6 transition-all uppercase tracking-[0.2em] text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {superLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-[40px] bg-white/5 animate-pulse" />)
              ) : (
                superData?.products?.map((p: Product) => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </div>

          {/* Pharmacy Section */}
          <div className="mb-32">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Pharmacy</h2>
                <div className="h-2 w-32 bg-blue-500 rounded-full mt-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </div>
              <Link to="/products?section=pharmacy" className="text-blue-400 font-black flex items-center gap-3 hover:gap-6 transition-all uppercase tracking-[0.2em] text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {pharmLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-[40px] bg-white/5 animate-pulse" />)
              ) : (
                pharmData?.products?.map((p: Product) => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </div>

          {/* Cosmetics Section */}
          <div>
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Cosmetics</h2>
                <div className="h-2 w-32 bg-rose-500 rounded-full mt-4 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
              </div>
              <Link to="/products?section=cosmetics" className="text-rose-400 font-black flex items-center gap-3 hover:gap-6 transition-all uppercase tracking-[0.2em] text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {cosLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-[40px] bg-white/5 animate-pulse" />)
              ) : (
                cosData?.products?.map((p: Product) => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default HomePage;
