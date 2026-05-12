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
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }}
    >
      {/* Dynamic Hover Glow */}
      <div className="absolute -inset-1 bg-brand-gradient opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 rounded-2xl" />

      <Link to={`/products/${product.slug}`} className="block relative z-10">
        <div className="relative aspect-[4/5] bg-slate-50 dark:bg-dark-800/50 overflow-hidden">
          <motion.img
            src={getProductImage(product.images)} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-brand-neon text-black text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm"
              >
                -{discount}%
              </motion.span>
            )}
            {(product as any).prescriptionRequired && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm backdrop-blur-md">
                <Pill className="w-3 h-3" /> Rx
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-neon hover:text-black hover:border-brand-neon shadow-lg"
          >
            <Heart className="w-4 h-4" />
          </motion.button>

          <div className="absolute bottom-4 inset-x-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button
              onClick={handleAdd}
              disabled={adding || product.status === 'out_of_stock'}
              className="w-full btn-primary !py-2.5 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Flow'}
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 mb-2 group-hover:text-brand-neon transition-colors tracking-tight">{product.name}</h3>
          <div className="flex items-center gap-2 mb-3">
             <div className="flex text-brand-neon">
               {[...Array(5)].map((_, i) => (
                 <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating || 0) ? 'fill-current' : 'opacity-20'}`} />
               ))}
             </div>
             <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">({formatNumber(product.totalRatings || 0)} Reviews)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{formatCurrency(product.effectivePrice)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && (
                <span className="text-xs text-slate-400 line-through font-semibold opacity-50">{formatCurrency(product.compareAtPrice)}</span>
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
    <form onSubmit={handleSearch} className="relative group max-w-xl w-full">
      <div className="absolute -inset-0.5 bg-brand-gradient rounded-2xl blur opacity-15 group-focus-within:opacity-30 transition duration-300"></div>
      <div className="relative flex items-center bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        <Search className="ml-4 w-5 h-5 text-slate-400 group-focus-within:text-brand-neon transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I'm looking for fresh groceries, medicine, or cosmetics..."
          className="w-full py-2.5 px-4 bg-transparent text-white placeholder-slate-400 outline-none text-sm font-semibold"
        />
        <button className="mr-2 btn-primary !rounded-xl !py-2 !px-5 text-xs font-bold uppercase tracking-wide">Search</button>
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
      <section className="relative min-h-[62vh] flex items-center pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div
              {...heroText(0.1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-neon text-xs font-bold mb-6 uppercase tracking-widest shadow-sm"
            >
              <TrendingUp className="w-4 h-4" /> Next-Gen Digital Shopping
            </motion.div>

            <motion.h1
              {...heroText(0.2)}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight uppercase"
            >
              THE ULTIMATE <br />
              <span className="glow-text">RETAIL FLOW</span>
            </motion.h1>

            <motion.p
              {...heroText(0.3)}
              className="max-w-2xl text-slate-400 text-sm md:text-base font-medium mb-7 leading-relaxed opacity-90"
            >
              Immerse yourself in a fluid marketplace where supermarket essentials,
              healthcare, and beauty merge into one seamless experience.
            </motion.p>

            <motion.div {...heroText(0.4)} className="w-full flex justify-center mb-9">
              <SmartSearchBar />
            </motion.div>

            <motion.div
              variants={staggerContainer} initial="initial" animate="animate"
              className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl"
            >
              {SECTIONS.map((s) => (
                <motion.div
                  key={s.id} variants={staggerItem}
                  onClick={() => navigate(s.href)}
                  className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer overflow-hidden transition-all duration-300 hover:border-brand-primary/40 hover:shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl`} />
                  <div className="relative z-10">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-5 group-hover:bg-brand-primary group-hover:text-black transition-all duration-300 shadow-sm"
                    >
                      {React.cloneElement(s.icon as React.ReactElement, { size: 24 })}
                    </motion.div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{s.label}</h3>
                    <p className="text-sm text-slate-400 mb-5 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{s.text}</p>
                    <div className="flex items-center gap-2 text-brand-neon font-bold text-xs uppercase tracking-wide group-hover:gap-3 transition-all">
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
      <section className="py-12 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Truck />, title: 'Hyper Delivery', sub: 'Instant Flow' },
              { icon: <ShieldCheck />, title: 'Neural Shield', sub: 'Encrypted Pay' },
              { icon: <RefreshCw />, title: 'Fresh Sync', sub: 'Quality Assured' },
              { icon: <Headphones />, title: 'Core Support', sub: '24/7 Connectivity' },
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0 shadow-sm border border-brand-primary/10">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 20 })}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">{f.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Sections ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Supermarket Section */}
          <div className="mb-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <motion.h2
                  whileInView={{ x: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-2xl font-extrabold text-white tracking-tight uppercase"
                >
                  Supermarket
                </motion.h2>
                <div className="h-1 w-20 bg-brand-gradient rounded-full mt-3 shadow-[0_0_10px_rgba(57,255,20,0.35)]" />
              </div>
              <Link to="/products?section=supermarket" className="text-brand-neon font-bold flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-wide text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {superLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse" />)
              ) : (
                superData?.products?.map((p: Product) => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </div>

          {/* Pharmacy Section */}
          <div className="mb-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">Pharmacy</h2>
                <div className="h-1 w-20 bg-blue-500 rounded-full mt-3 shadow-[0_0_10px_rgba(59,130,246,0.35)]" />
              </div>
              <Link to="/products?section=pharmacy" className="text-blue-400 font-bold flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-wide text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {pharmLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse" />)
              ) : (
                pharmData?.products?.map((p: Product) => <ProductCard key={p._id} product={p} />)
              )}
            </div>
          </div>

          {/* Cosmetics Section */}
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight uppercase">Cosmetics</h2>
                <div className="h-1 w-20 bg-rose-500 rounded-full mt-3 shadow-[0_0_10px_rgba(244,63,94,0.35)]" />
              </div>
              <Link to="/products?section=cosmetics" className="text-rose-400 font-bold flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-wide text-xs">
                Enter Flow <ChevronRight size={20} />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {cosLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-white/5 animate-pulse" />)
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
