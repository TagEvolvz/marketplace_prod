import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight, ChevronRight, Headphones, Heart, Loader2, Pill, RefreshCw,
  Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, TrendingUp, Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI, cartAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, formatNumber, getProductImage } from '../utils';
import { heroText, staggerContainer, staggerItem } from '../utils/motion';
import { Product } from '../types';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [adding, setAdding] = useState(false);

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.effectivePrice) / product.compareAtPrice) * 100)
    : 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Sign in to add items');
      return;
    }
    setAdding(true);
    try {
      const res = await cartAPI.addItem({ productId: product._id, quantity: 1 });
      dispatch(setCart(res.data.data));
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      className="card-premium group relative"
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
    >
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={getProductImage(product.images)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm dark:bg-brand-primary dark:text-slate-950">
                -{discount}%
              </span>
            )}
            {(product as any).prescriptionRequired && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                <Pill className="h-3 w-3" /> Rx
              </span>
            )}
          </div>

          <button className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/85 text-slate-700 opacity-0 shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-white group-hover:opacity-100 dark:border-white/20 dark:bg-slate-950/60 dark:text-white">
            <Heart className="h-4 w-4" />
          </button>

          <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleAdd}
              disabled={adding || product.status === 'out_of_stock'}
              className="btn-primary w-full !h-10 text-xs"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-1 text-sm font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-dark dark:text-white dark:group-hover:text-brand-primary">
            {product.name}
          </h3>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating || 0) ? 'fill-current' : 'opacity-25'}`} />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-slate-500">({formatNumber(product.totalRatings || 0)})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(product.effectivePrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && (
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const SmartSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl">
      <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition-all focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 dark:border-white/10 dark:bg-slate-900/85">
        <Search className="ml-4 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groceries, medicine, or cosmetics"
          className="w-full bg-transparent px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
        <button className="btn-primary mr-2 !h-9 text-xs">Search</button>
      </div>
    </form>
  );
};

const SECTIONS = [
  {
    id: 'supermarket',
    label: 'Supermarket',
    icon: <ShoppingBag />,
    text: 'Fresh daily essentials delivered to your door.',
    href: '/products?section=supermarket',
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: <Pill />,
    text: 'Trusted health and wellness products.',
    href: '/products?section=pharmacy',
  },
  {
    id: 'cosmetics',
    label: 'Cosmetics',
    icon: <Sparkles />,
    text: 'Premium care, beauty, and personal essentials.',
    href: '/products?section=cosmetics',
  },
];

const ProductSection: React.FC<{
  title: string;
  href: string;
  tone?: string;
  isLoading: boolean;
  products?: Product[];
}> = ({ title, href, tone = 'text-brand-dark dark:text-brand-primary', isLoading, products }) => (
  <section className="mb-16 last:mb-0">
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">Featured</p>
        <h2 className="heading-2">{title}</h2>
      </div>
      <Link to={href} className={`flex items-center gap-2 text-sm font-bold transition-all hover:gap-3 ${tone}`}>
        View all <ChevronRight className="h-5 w-5" />
      </Link>
    </div>

    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5]" />)
        : products?.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  </section>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: superData, isLoading: superLoading } = useQuery({
    queryKey: ['home-super'],
    queryFn: () => productAPI.getProducts({ storeSection: 'supermarket', limit: 4 }).then((r) => r.data.data),
  });

  const { data: pharmData, isLoading: pharmLoading } = useQuery({
    queryKey: ['home-pharm'],
    queryFn: () => productAPI.getProducts({ storeSection: 'pharmacy', limit: 4 }).then((r) => r.data.data),
  });

  const { data: cosData, isLoading: cosLoading } = useQuery({
    queryKey: ['home-cos'],
    queryFn: () => productAPI.getProducts({ storeSection: 'cosmetics', limit: 4 }).then((r) => r.data.data),
  });

  return (
    <div className="relative min-h-screen">
      <section className="relative flex min-h-[68vh] items-center overflow-hidden border-b border-slate-200/80 pt-28 pb-12 dark:border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(34,197,94,0.08),transparent_38%),linear-gradient(to_bottom,transparent,rgba(255,255,255,0.55))] dark:bg-[linear-gradient(115deg,rgba(34,197,94,0.12),transparent_38%),linear-gradient(to_bottom,transparent,rgba(2,6,23,0.62))]" />
        <div className="page-container relative">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <motion.div {...heroText(0.1)} className="eyebrow mb-6 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 shadow-sm">
              <TrendingUp className="h-4 w-4" /> Curated Digital Shopping
            </motion.div>

            <motion.h1 {...heroText(0.2)} className="display-1 mb-5 max-w-4xl text-slate-950 dark:text-white">
              Essentials, wellness, and beauty in one refined marketplace.
            </motion.h1>

            <motion.p {...heroText(0.3)} className="body-copy mb-7 max-w-2xl text-base">
              Shop fresh groceries, trusted pharmacy products, and premium cosmetics with clear pricing, fast checkout, and a calmer way to browse.
            </motion.p>

            <motion.div {...heroText(0.4)} className="mb-9 flex w-full justify-center">
              <SmartSearchBar />
            </motion.div>

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
              {SECTIONS.map((s) => (
                <motion.button
                  key={s.id}
                  variants={staggerItem}
                  onClick={() => navigate(s.href)}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-lift dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-dark shadow-sm transition-all group-hover:bg-brand-primary group-hover:text-white dark:text-brand-primary dark:group-hover:text-slate-950">
                    {React.cloneElement(s.icon as React.ReactElement, { size: 24 })}
                  </div>
                  <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-950 dark:text-white">{s.label}</h3>
                  <p className="mb-5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{s.text}</p>
                  <span className="flex items-center gap-2 text-xs font-bold text-brand-dark transition-all group-hover:gap-3 dark:text-brand-primary">
                    Explore <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70 py-10 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="page-container">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { icon: <Truck />, title: 'Fast Delivery', sub: 'Reliable fulfilment' },
              { icon: <ShieldCheck />, title: 'Secure Checkout', sub: 'Protected payment' },
              { icon: <RefreshCw />, title: 'Easy Returns', sub: 'Simple support' },
              { icon: <Headphones />, title: 'Live Support', sub: 'Here when needed' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-brand-primary/10 bg-brand-primary/10 text-brand-dark shadow-sm dark:text-brand-primary">
                  {React.cloneElement(f.icon as React.ReactElement, { size: 20 })}
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-bold text-slate-950 dark:text-white">{f.title}</h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-section">
        <div className="page-container">
          <ProductSection
            title="Supermarket"
            href="/products?section=supermarket"
            isLoading={superLoading}
            products={superData?.products}
          />
          <ProductSection
            title="Pharmacy"
            href="/products?section=pharmacy"
            tone="text-blue-600 dark:text-blue-400"
            isLoading={pharmLoading}
            products={pharmData?.products}
          />
          <ProductSection
            title="Cosmetics"
            href="/products?section=cosmetics"
            tone="text-rose-600 dark:text-rose-400"
            isLoading={cosLoading}
            products={cosData?.products}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
