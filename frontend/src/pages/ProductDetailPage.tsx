import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, Truck, Shield, RefreshCw, Minus, Plus, ChevronRight, Package, Pill, Sparkles, Check, Loader2 } from 'lucide-react';
import { productAPI, cartAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage, formatDate } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, slideUp, buttonTap } from '../utils/motion';
import toast from 'react-hot-toast';

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getProductBySlug(slug!).then((r) => r.data.data),
    enabled: !!slug,
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to shop'); return; }
    if (!product) return;
    setAdding(true);
    try {
      const res = await cartAPI.addItem({ productId: product._id, quantity });
      dispatch(setCart(res.data.data));
      toast.success(`Successfully added to your flow`);
    } catch { toast.error('Flow interrupted. Try again.'); } finally { setAdding(false); }
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pt-32">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
        <div className="space-y-6">
          <div className="h-10 bg-white/5 rounded-2xl w-3/4 animate-pulse" />
          <div className="h-6 bg-white/5 rounded-xl w-1/2 animate-pulse" />
          <div className="h-20 bg-white/5 rounded-2xl w-full animate-pulse" />
          <div className="h-12 bg-white/5 rounded-2xl w-1/3 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="page-container pt-28 pb-24 text-center">
      <Package className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
      <p className="mb-8 font-medium text-slate-500">This item is not available right now.</p>
      <Link to="/products" className="btn-primary inline-flex">Return to Shop</Link>
    </div>
  );

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.effectivePrice) / product.compareAtPrice) * 100) : 0;
  const catName = typeof product.category === 'object' ? product.category.name : '';

  return (
    <div className="relative overflow-hidden pt-28 pb-16 font-sans">
      <div className="hidden">
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-brand-neon/5 blur-[100px] rounded-full" />
      </div>

      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <ChevronRight size={10} className="text-slate-700 flex-shrink-0" />
          <Link to="/products" className="hover:text-brand-primary transition-colors">Shop</Link>
          <ChevronRight size={10} className="text-slate-700 flex-shrink-0" />
          <span className="truncate text-slate-900 dark:text-white">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 mb-14">
          {/* ── Left: Immersive Media ────────────────────────────────────── */}
          <motion.div {...fadeIn} className="space-y-4">
            <div className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-slate-900">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    src={product.images?.[activeImg]?.url || getProductImage(product.images)}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>

                {discount > 0 && (
                  <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg dark:bg-brand-primary dark:text-slate-950">
                    -{discount}%
                  </div>
                )}
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
                {product.images.map((img: { url: string }, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                      activeImg === i ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Right: Premium Configuration ─────────────────────────────── */}
          <motion.div {...slideUp} className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="badge-primary text-[10px]">
                  {catName || 'Premium Choice'}
                </span>
                {product.status === 'active' ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Check size={14} /> In Stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-400">Out of Stock</span>
                )}
              </div>

              <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white md:text-4xl">
                {product.name}
              </h1>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(product.rating) ? 'fill-current' : 'opacity-20'} />
                    ))}
                  </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{product.rating?.toFixed(1)}</span>
                </div>
                <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                <span className="text-xs text-slate-500 font-semibold">{product.totalRatings} VERIFIED REVIEWS</span>
              </div>
            </div>

            <div className="surface mb-6 rounded-2xl p-6">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  {formatCurrency(product.effectivePrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.effectivePrice && (
                  <span className="text-base text-slate-500 line-through font-medium">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {product.shortDescription && (
                <p className="mb-6 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {product.shortDescription}
                </p>
              )}

              {/* Interaction Block */}
              <div className="space-y-5">
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity</span>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
                    <motion.button
                      whileTap={buttonTap}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                    >
                      <Minus size={16} />
                    </motion.button>
                    <span className="w-12 text-center text-sm font-black text-slate-950 dark:text-white">{quantity}</span>
                    <motion.button
                      whileTap={buttonTap}
                      onClick={() => setQuantity(Math.min(product.stock || 50, quantity + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
                    >
                      <Plus size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileTap={buttonTap}
                    onClick={handleAddToCart}
                    disabled={adding || product.status === 'out_of_stock'}
                    className="btn-primary flex-1"
                  >
                    {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart size={18} />}
                    {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
                  </motion.button>

                  <motion.button
                    whileTap={buttonTap}
                    onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist'); }}
                    className={`w-12 h-12 rounded-xl glass border flex items-center justify-center transition-all duration-300 ${
                      wishlisted ? 'border-brand-primary text-brand-dark bg-brand-primary/10 dark:text-brand-primary' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:text-white dark:hover:border-white/20'
                    }`}
                  >
                    <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Premium Trust Strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Truck size={18} />, label: 'Fast Delivery' },
                { icon: <Shield size={18} />, label: 'Secure Pay' },
                { icon: <RefreshCw size={18} />, label: 'Easy Returns' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-colors">
                  <div className="text-brand-primary group-hover:scale-110 transition-transform">{item.icon}</div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Tabs Content ────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10 bg-white/[0.02]">
            {(['description', 'specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-4 text-xs font-bold uppercase tracking-wide transition-all ${
                  activeTab === tab ? 'text-brand-neon' : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab === 'reviews' ? `Reviews (${product.totalRatings})` : tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-brand-neon shadow-[0_0_15px_#39FF14]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-400 leading-relaxed font-medium"
              >
                {activeTab === 'description' && (
                  <div className="max-w-4xl">
                    <p className="text-base text-white mb-4 font-bold">{product.name} Details</p>
                    <div className="prose prose-invert max-w-none">
                      {product.description?.split('\n').map((line: string, i: number) => (
                        <p key={i} className="mb-4">{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
                    {[
                      { label: 'SKU Identifier', value: product.sku },
                      { label: 'Store Section', value: product.storeSection },
                      { label: 'Current Inventory', value: `${product.stock} units` },
                      { label: 'Net Weight', value: product.weight ? `${product.weight} kg` : 'N/A' },
                      { label: 'First Flow Date', value: formatDate(product.createdAt) },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</span>
                        <span className="text-sm font-bold text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="text-center py-14">
                    <Sparkles className="w-10 h-10 text-brand-neon mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-bold text-white mb-2">Community Feedback</p>
                    <p>Verified reviews are currently being processed into the flow.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
